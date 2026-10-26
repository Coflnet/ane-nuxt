import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import * as Vue from 'vue'
import {
  bucketNumberBounds,
  buildSpecApiFilters,
  impliedOsFilter,
  impliedOsLabel,
  parseBucketNumber,
  removeImpliedPhrase,
  sortOsVersionBuckets,
  withRangeParams,
  specRangeNumber,
} from '../utils/specFilters.ts'

test('maps spec range URL params to API attribute filters', () => {
  assert.deepEqual(
    buildSpecApiFilters({
      attr_os_version_min: '15',
      attr_release_year_min: '2022',
      attr_release_year_max: '2024',
      attr_screen_size_min: '6,1',
      attr_screen_size_max: '6.7',
    }),
    ['os_version_min:15', 'release_year_min:2022', 'release_year_max:2024', 'screen_size_min:6.1', 'screen_size_max:6.7'],
  )
})

test('maps the os_version_supports param to the API', () => {
  assert.deepEqual(buildSpecApiFilters({ attr_os_version_supports: '15' }), ['os_version_supports:15'])
})

test('drops spec range params that are not positive numbers', () => {
  assert.deepEqual(buildSpecApiFilters({ attr_os_version_min: 'abc', attr_screen_size_min: '-1', attr_release_year_max: '' }), [])
  assert.deepEqual(buildSpecApiFilters({ attr_os: 'Android' }), [])
})

test('parses screen size bucket values', () => {
  assert.equal(parseBucketNumber('6.1"'), 6.1)
  assert.equal(parseBucketNumber('6,7 Zoll'), 6.7)
  assert.equal(parseBucketNumber('6'), 6)
  assert.equal(parseBucketNumber('120Hz'), null)
  assert.deepEqual(bucketNumberBounds([{ value: '6.1"' }, { value: '5.4"' }, { value: 'n/a' }]), { min: 5.4, max: 6.1 })
  assert.equal(bucketNumberBounds([{ value: 'x' }]), null)
})

test('orders OS versions numerically, newest first', () => {
  const sorted = sortOsVersionBuckets([{ value: '9' }, { value: '15' }, { value: '10' }, { value: 'beta' }])
  assert.deepEqual(sorted.map(b => b.value), ['15', '10', '9'])
})

test('explicit range boundaries survive values equal to current filtered bounds', () => {
  assert.deepEqual(withRangeParams({ q: 'phone' }, 'screen_size', { min: 6, max: 7 }), { q: 'phone', attr_screen_size_min: '6', attr_screen_size_max: '7' })
  assert.deepEqual(withRangeParams({ q: 'phone', attr_screen_size_min: '6' }, 'screen_size', { min: null, max: null }), { q: 'phone' })
})

test('reads the OS filter the backend implied from the query text', () => {
  const exact = impliedOsFilter({ os: 'Android', os_version_supports: '15' })
  assert.deepEqual(exact, { os: 'Android', version: '15', mode: 'supports' })
  assert.equal(impliedOsLabel(exact), 'Android 15')
  const newer = impliedOsFilter({ os: 'iOS', os_version_min: '18' })
  assert.equal(impliedOsLabel(newer), 'iOS 18+')
  assert.equal(impliedOsLabel(impliedOsFilter({ os: 'Android' })), 'Android')
  assert.equal(impliedOsFilter(null), null)
})

test('removing the implied filter strips exactly its phrase from the query', () => {
  assert.equal(removeImpliedPhrase('samsung android 15 128gb', 'android 15'), 'samsung 128gb')
  assert.equal(removeImpliedPhrase('Android 15', 'android 15'), '')
  assert.equal(removeImpliedPhrase('nokia', 'android'), 'nokia')
  assert.equal(removeImpliedPhrase('nokia', null), 'nokia')
})

test('numeric spec changes preserve repeated generic attribute choices', () => {
  const query = { q: 'iphone', attr_storage: ['128GB', '256GB'], attr_color: ['Black', 'Blue'] }
  const next = withRangeParams(query, 'release_year', { min: 2020 })
  assert.deepEqual(next.attr_storage, ['128GB', '256GB'])
  assert.deepEqual(next.attr_color, ['Black', 'Blue'])
  assert.equal(next.attr_release_year_min, '2020')
})


test('year filters preserve independent signed integer boundaries and other repeated choices', () => {
  const query = { q: 'comics', attr_storage: ['128GB', '256GB'], attr_publication_year_min: '1972', attr_publication_year_max: '1980', attr_year_max: '-100', attr_release_year_min: '0' }
  assert.deepEqual(buildSpecApiFilters(query), ['release_year_min:0', 'publication_year_min:1972', 'publication_year_max:1980', 'year_max:-100'])
  assert.deepEqual(withRangeParams(query, 'publication_year', { min: 1972, max: 1980 }), query)
  const cleared = withRangeParams(query, 'publication_year', {})
  assert.equal(cleared.attr_publication_year_min, undefined)
  assert.equal(cleared.attr_year_max, '-100')
  assert.deepEqual(cleared.attr_storage, ['128GB', '256GB'])
  assert.equal(specRangeNumber('attr_year_min', '1980.5'), null)
  assert.equal(specRangeNumber('attr_screen_size_min', '0'), null)
  assert.deepEqual(bucketNumberBounds([{ value: '-500' }, { value: '0' }, { value: '1980' }, { value: '6 inch' }], true), { min: -500, max: 1980 })
})

test('precise screen dimensions and existing inch spellings reject other dimensions and composites', () => {
  for (const value of ['5.43', '5.43"', '5,43 Zoll', '5.43 inch', '5.43 inches', "5.43''"]) assert.equal(parseBucketNumber(value), 5.43)
  for (const value of ['150 mm', '6 cm', '1920x1080', '6.1 x 3.2', 'Infinity']) assert.equal(parseBucketNumber(value), null)
  assert.deepEqual(buildSpecApiFilters({ attr_screen_size_min: '5.43', attr_screen_size_max: '5.43' }), ['screen_size_min:5.43', 'screen_size_max:5.43'])
})

// Run the actual range component with Vue's renderer, including its number-input events and watchers.
async function mountRange(props) {
  const source = await readFile(new URL('../components/filters/NumberRangeFilter.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'range-test', inlineTemplate: true }).content)
    .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace('export default', 'return')
  const component = new Function('Vue', `const { ref, watch } = Vue; ${code}`)(Vue)
  const node = type => ({ type, tagName: type.toUpperCase(), props: {}, listeners: {}, children: [], addEventListener(name, fn) { this.listeners[name] = fn }, removeEventListener() {}, getRootNode: () => ({ activeElement: null }) })
  const renderer = Vue.createRenderer({
    createElement: node, createText: text => ({ ...node('#text'), text }), createComment: () => node('#comment'),
    setText(n, text) { n.text = text }, setElementText(n, text) { n.text = text; n.children = [] },
    parentNode: n => n.parent, nextSibling: () => null,
    patchProp(n, key, old, value) { n.props[key] = value; if (key === 'value') n.value = value },
    insert(n, parent) { n.parent = parent; parent.children.push(n) }, remove() {},
  })
  const emitted = []
  const root = node('root')
  globalThis.Document = class {}
  globalThis.ShadowRoot = class {}
  const app = renderer.createApp({ render: () => Vue.h(component, { ...props, onApply: range => emitted.push(range) }) })
  app.mount(root)
  const all = (n = root) => [n, ...n.children.flatMap(child => all(child))]
  const find = id => all().find(n => n.props['data-testid'] === id)
  return { find, emitted, unmount: () => app.unmount(), change: async (id, value) => {
    const input = find(id)
    input.value = value
    input.listeners.input({ target: input })
    input.props.onChange()
    await Vue.nextTick()
  } }
}

test('rendered precise inputs retain current values through filtered bounds and URL navigation', async () => {
  const props = Vue.reactive({ title: 'Screen', bounds: { min: 4, max: 6.9 }, step: 'any', testId: 'screen-size' })
  const view = await mountRange(props)
  try {
    assert.equal(view.find('screen-size-min').props.step, 'any')
    await view.change('screen-size-min', '5.43')
    await view.change('screen-size-max', '5.43')
    assert.deepEqual(view.emitted.at(-1), { min: 5.43, max: 5.43 })
    const query = withRangeParams({ attr_storage: ['128GB', '256GB'] }, 'screen_size', view.emitted.at(-1))
    assert.deepEqual(buildSpecApiFilters(query), ['screen_size_min:5.43', 'screen_size_max:5.43'])
    props.selectedMin = 5.43
    props.selectedMax = 5.43
    props.bounds = { min: 5.43, max: 5.43 }
    await Vue.nextTick()
    assert.equal(Number(view.find('screen-size-min').value), 5.43)
    assert.equal(Number(view.find('screen-size-max').value), 5.43)
    props.selectedMin = 6.14
    props.selectedMax = undefined
    await Vue.nextTick()
    assert.equal(Number(view.find('screen-size-min').value), 6.14)
    assert.equal(view.find('screen-size-max').value, '')
    await view.change('screen-size-min', '')
    assert.deepEqual(view.emitted.at(-1), { min: null, max: null })
  } finally { view.unmount() }
})

test('actual page year controls survive single-value and empty responses without losing URL selection', async () => {
  const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
  const declaration = source.slice(source.indexOf('const yearRangeFilters = computed('), source.indexOf('const selectedScreenSizeMin'))
  const route = Vue.reactive({ query: { attr_publication_year_min: '1980', attr_publication_year_max: '1980' } })
  const buckets = Vue.ref({ publication_year: [{ value: '1980' }], year: [{ value: '-500' }] })
  const controls = new Function('computed', 'route', 'attributeBuckets', 'specRangeNumber', 'bucketNumberBounds', stripTypeScriptTypes(declaration) + '\nreturn yearRangeFilters')(
    Vue.computed, route, buckets, specRangeNumber, bucketNumberBounds,
  )
  assert.deepEqual(controls.value.find(f => f.key === 'publication_year'), { key: 'publication_year', min: 1980, max: 1980, bounds: { min: 1980, max: 1980 } })
  assert.deepEqual(controls.value.find(f => f.key === 'year').bounds, { min: -500, max: -500 })
  buckets.value = {}
  assert.deepEqual(controls.value.find(f => f.key === 'publication_year').bounds, { min: 1980, max: 1980 })
  route.query = { attr_year_max: '-100' }
  assert.equal(controls.value.find(f => f.key === 'publication_year').bounds, null)
  assert.deepEqual(controls.value.find(f => f.key === 'year').bounds, { min: -100, max: -100 })
})
