import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { compileScript, parse } from 'vue/compiler-sfc'
import * as Vue from 'vue'
import { computed, effectScope, nextTick, reactive, ref, watch } from 'vue'
import { attributeValues, toggleAttributeValue, facetSearchParams } from '../utils/facetSearch.ts'

test('facet discovery preserves every search constraint except its own selected exact value', () => {
  const scope = { query: 'comics', category: 'comics', condition: 'used', country: 'DE', minPrice: 5, maxPrice: 50, lat: 52, lon: 13, maxDistanceKm: 20, attributes: ['series:Tintin', 'language:French'], offset: 40, limit: 20 }
  assert.deepEqual(facetSearchParams(scope, 'series', 'Astérix'), {
    ...scope, attributes: ['language:French'], offset: 0, limit: 0, facetKey: 'series', facetQuery: 'Astérix',
  })
  assert.deepEqual(scope.attributes, ['series:Tintin', 'language:French'])
})

async function createField(loadValues, buckets = [], server = false) {
  const file = new URL('../components/filters/AttributeFilter.vue', import.meta.url)
  const { descriptor } = parse(await readFile(file, 'utf8'))
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'facet-test' }).content)
    .replace(/import\s*\{([^}]*)\}\s*from\s*['"]vue['"]/g, (_, names) => `const {${names.replace(/\bas\b/g, ':')}} = __vue`)
    .replace('export default', 'return')
  const cleanup = []
  const component = new Function('__vue', 'ref', 'computed', 'watch', 'onBeforeUnmount', 'onMounted', code)(
    await import('vue'), ref, computed, watch, fn => cleanup.push(fn), (fn) => { if (!server) fn() },
  )
  const props = reactive({ title: 'Series', draft: '', buckets, selected: ['Selected outside the top 50'], scope: 'one', formatValue: value => value, loadValues })
  const effects = effectScope()
  const state = effects.run(() => component.setup(props, { expose() {}, emit(event, value) {
    if (event === 'update:draft') props.draft = value
  } }))
  return { state, props, stop: () => {
    effects.stop()
    cleanup.forEach(fn => fn())
  } }
}

test('all returned options are reachable, with an out-of-response selection kept visible', async () => {
  const buckets = Array.from({ length: 50 }, (_, i) => ({ value: `Series ${i}`, count: 2 }))
  const { state, stop } = await createField(async () => buckets, buckets)
  assert.equal(state.visibleBuckets.value.length, 51)
  assert.equal(state.visibleBuckets.value.at(-1).value, 'Series 49')
  assert.equal(state.visibleBuckets.value[0].count, undefined, 'an unknown count is not fabricated')
  stop()
})

test('remote discovery debounces, ignores stale responses, and keeps input and selection through error and retry', async () => {
  const pending = []
  const { state, props, stop } = await createField(query => new Promise((resolve, reject) => pending.push({ query, resolve, reject })))
  state.query.value = 'rare'
  await nextTick()
  assert.equal(pending.length, 0)
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(pending[0].query, 'rare')
  state.query.value = 'rare comic'
  await nextTick()
  pending[0].resolve([{ value: 'Stale' }])
  await nextTick()
  assert.equal(state.found.value, null)
  await new Promise(resolve => setTimeout(resolve, 330))
  pending[1].reject(new Error('offline'))
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(state.error.value, true)
  assert.equal(state.query.value, 'rare comic')
  assert.equal(state.visibleBuckets.value[0].value, props.selected[0])
  const retry = state.load()
  pending[2].resolve([{ value: 'Rare comic 181', count: 1 }])
  await retry
  assert.equal(state.error.value, false)
  assert.equal(state.visibleBuckets.value.at(-1).value, 'Rare comic 181')
  assert.equal(state.query.value, 'rare comic')
  stop()
})

test('a scope change refreshes untouched fields from props without per-facet requests', async () => {
  let requests = 0
  const fields = await Promise.all(Array.from({ length: 4 }, () => createField(async () => {
    requests++
    return []
  })))
  for (const { props } of fields) {
    props.selected = []
    props.scope = 'new search filters'
    props.buckets = [{ value: 'New scope option', count: 3 }]
    await nextTick()
  }
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(requests, 0, 'the main search already returns buckets for untouched fields')
  for (const { state } of fields) {
    assert.equal(state.loading.value, false)
    assert.equal(state.visibleBuckets.value.at(-1).value, 'New scope option')
    assert.equal(state.visibleBuckets.value.length, 1)
  }
  fields.forEach(field => field.stop())
})

test('clearing a value query restores scoped buckets and cancels stale discovery', async () => {
  const pending = []
  const { state, props, stop } = await createField(query => new Promise(resolve => pending.push({ query, resolve })), [{ value: 'Scoped option' }])
  props.selected = []
  state.query.value = '   '
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(pending.length, 0)
  state.query.value = 'rare'
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(pending.length, 1)
  state.query.value = ''
  await nextTick()
  pending[0].resolve([{ value: 'Obsolete result' }])
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(pending.length, 1, 'unselected fields do not request all values when cleared')
  assert.equal(state.loading.value, false)
  assert.equal(state.visibleBuckets.value.at(-1).value, 'Scoped option')
  assert.equal(state.visibleBuckets.value.length, 1)
  stop()
})

test('a searched field clears old-scope results before a failed refresh and preserves input and selection', async () => {
  let fail = false
  const { state, props, stop } = await createField(async () => {
    if (fail) throw new Error('offline')
    return [{ value: 'Old country option' }]
  })
  state.query.value = 'rare'
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(state.visibleBuckets.value.at(-1).value, 'Old country option')
  fail = true
  props.scope = 'new country'
  props.buckets = [{ value: 'New country option' }]
  await nextTick()
  assert.equal(state.found.value, null)
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(state.error.value, true)
  assert.equal(state.query.value, 'rare')
  assert.deepEqual(state.visibleBuckets.value.map(b => b.value), [...props.selected, 'New country option'])
  stop()
})

test('multi-value URL state toggles literal alternatives and preserves every unrelated criterion', () => {
  const initial = { q: 'iphone', country: 'DE', attr_color: 'Black', history_days: '7' }
  const selected = toggleAttributeValue(initial, 'storage', '128GB')
  const both = toggleAttributeValue(selected, 'storage', '256GB')
  assert.deepEqual(both.attr_storage, ['128GB', '256GB'])
  assert.equal(both.attr_color, 'Black')
  assert.equal(both.history_days, '7')
  assert.deepEqual(attributeValues(['A,B:C', 'A,B:C', null]), ['A,B:C'])
  const removed = toggleAttributeValue(both, 'storage', '128GB')
  assert.equal(removed.attr_storage, '256GB')
  assert.equal(toggleAttributeValue(removed, 'storage', '256GB').attr_storage, undefined)
  assert.equal(initial.attr_storage, undefined)
  assert.deepEqual(facetSearchParams({ attributes: ['storage:128GB', 'storage:256GB', 'color:Black'] }, 'storage', '').attributes, ['color:Black'])
})

test('selected values remain visible together and own-key alternatives load without a text query', async () => {
  const calls = []
  const { state, props, stop } = await createField(async (query) => {
    calls.push(query)
    return [{ value: '512GB', count: 3 }]
  })
  props.selected = ['128GB', '256GB']
  await new Promise(resolve => setTimeout(resolve, 330))
  await nextTick()
  assert.deepEqual(calls, [''])
  assert.deepEqual(state.visibleBuckets.value.map(bucket => bucket.value), ['128GB', '256GB', '512GB'])
  assert.equal(state.visibleBuckets.value[0].count, undefined)
  stop()
})

test('SSR renders supplied buckets without starting deferred discovery requests', async () => {
  let requests = 0
  const { state, stop } = await createField(async () => {
    requests++
    return []
  }, [{ value: 'Supplied option' }], true)
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(requests, 0)
  assert.equal(state.loading.value, false)
  assert.equal(state.visibleBuckets.value.at(-1).value, 'Supplied option')
  stop()
})

// Execute the page's actual computed selection, rather than duplicating its filtering predicate.
test('a failed optional count lookup keeps unknown options selectable without fabricated numbers', async () => {
  const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
  const declaration = source.slice(source.indexOf('const availableAttributeBuckets = computed('), source.indexOf('// Battery range:'))
  const code = stripTypeScriptTypes(declaration) + '\nreturn availableAttributeBuckets'
  const buckets = new Function('computed', 'activeAttributeFilters', 'attributeBuckets', 'rangeFilterAttrs', 'SPEC_ATTRIBUTE_KEYS', 'yearRangeFilters', code)(
    computed, ref({ storage: ['256GB'] }), ref({ storage: [{ value: '128GB' }, { value: '256GB', count: 0 }, { value: '512GB', count: 0 }] }), new Set(), new Set(), ref([]),
  )
  assert.deepEqual(buckets.value.storage.map(b => b.value), ['128GB', '256GB'])
  assert.equal(buckets.value.storage[0].count, undefined)
  const { state, stop } = await createField(async () => buckets.value.storage, buckets.value.storage, true)
  assert(state.visibleBuckets.value.some(b => b.value === '128GB' && b.count === undefined))
  stop()
})

test('localized value search keeps current scoped label matches and authoritative discovery counts', async () => {
  const { state, props, stop } = await createField(async () => [], [{ value: 'Black', count: 12 }])
  props.selected = []
  props.formatValue = value => ({ Black: 'Schwarz', Blue: 'Blau' })[value] ?? value
  state.query.value = '  SCHWARZ  '
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.deepEqual(state.visibleBuckets.value, [{ value: 'Black', count: 12 }])

  props.scope = 'another country'
  props.buckets = [{ value: 'Blue', count: 4 }]
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.deepEqual(state.visibleBuckets.value, [], 'a localized match from the previous scope must disappear')

  props.buckets = [{ value: 'Black', count: 9 }]
  props.loadValues = async () => [{ value: 'Black', count: 7 }, { value: 'Schwarz metallic', count: 2 }]
  await state.load()
  assert.deepEqual(state.visibleBuckets.value, [{ value: 'Black', count: 7 }, { value: 'Schwarz metallic', count: 2 }], 'remote values win without duplicates or invented raw aliases')
  state.query.value = ''
  await nextTick()
  assert.deepEqual(state.visibleBuckets.value, props.buckets)
  stop()
})

// Compile the page's actual loop and bucket computation so removing a key unmounts its field.
test('page retains facet discovery drafts through removal and remount and cancels the removed request', async () => {
  const page = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
  const loop = page.slice(page.indexOf('<FiltersAttributeFilter'), page.indexOf('/>', page.indexOf('<FiltersAttributeFilter')) + 2)
  const drafts = page.match(/const facetDrafts = [^\n]+/)?.[0] ?? ''
  const buckets = page.slice(page.indexOf('const availableAttributeBuckets = computed('), page.indexOf('// Battery range:'))
  const pending = []
  const fixture = {
    attributeBuckets: ref({ article_number: [{ value: '8070', count: 1 }] }), activeAttributeFilters: ref({}),
    rangeFilterAttrs: new Set(), SPEC_ATTRIBUTE_KEYS: new Set(), yearRangeFilters: ref([]),
    facetSearchScope: ref('A'), localizeAttrKey: key => key, localizeAttrValue: (_key, value) => value,
    loadAttributeValues: (_key, query) => new Promise(resolve => pending.push({ query, resolve })), toggleAttributeFilter() {},
  }
  function compile(source, id) {
    const { descriptor } = parse(source)
    const code = stripTypeScriptTypes(compileScript(descriptor, { id, inlineTemplate: true }).content)
      .replace(/import\s*\{([^}]*)\}\s*from\s*['"]vue['"]/g, (_, names) => `const {${names.replace(/\bas\b/g, ':')}} = Vue`)
      .replace('export default', 'return')
    return new Function('Vue', 'fixture', `const { ref, computed, reactive, watch, onMounted, onBeforeUnmount } = Vue; ${code}`)(Vue, fixture)
  }
  const field = compile(await readFile(new URL('../components/filters/AttributeFilter.vue', import.meta.url), 'utf8'), 'draft-field')
  const parent = compile(`<script setup lang="ts">const { attributeBuckets, activeAttributeFilters, rangeFilterAttrs, SPEC_ATTRIBUTE_KEYS, yearRangeFilters, facetSearchScope, localizeAttrKey, localizeAttrValue, loadAttributeValues, toggleAttributeFilter } = fixture;\n${drafts}\n${buckets}</script><template><div>${loop}</div></template>`, 'draft-parent')
  const node = type => ({ type, tagName: type.toUpperCase(), props: {}, listeners: {}, children: [],
    addEventListener(name, fn) { this.listeners[name] = fn }, removeEventListener() {}, getRootNode: () => ({ activeElement: null }),
  })
  const renderer = Vue.createRenderer({
    createElement: node, createText: text => ({ ...node('#text'), text }), createComment: () => node('#comment'),
    setText(n, text) { n.text = text }, setElementText(n, text) {
      n.text = text
      n.children = []
    },
    parentNode: n => n.parent, nextSibling: () => null,
    patchProp(n, key, _old, value) {
      n.props[key] = value
      if (key === 'value') n.value = value
    },
    insert(n, parent, anchor) {
      if (n.parent) n.parent.children.splice(n.parent.children.indexOf(n), 1)
      n.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      if (index < 0) parent.children.push(n)
      else parent.children.splice(index, 0, n)
    },
    remove(n) {
      n.parent.children.splice(n.parent.children.indexOf(n), 1)
      n.parent = null
    },
  })
  globalThis.Document ??= class {}
  globalThis.ShadowRoot ??= class {}
  const app = renderer.createApp(parent)
  app.component('FiltersAttributeFilter', field)
  app.config.globalProperties.$t = key => key
  const root = node('root')
  const all = (n = root) => [n, ...n.children.flatMap(child => all(child))]
  app.mount(root)
  try {
    const original = all().find(n => n.type === 'input')
    original.value = '807'
    original.listeners.input({ target: original })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 330))
    assert.equal(pending[0].query, '807')
    fixture.attributeBuckets.value = {}
    fixture.facetSearchScope.value = 'B'
    await nextTick()
    assert.equal(all().some(n => n.type === 'input'), false, 'the actual page loop must remove the field')
    pending[0].resolve([{ value: 'obsolete removed-field response' }])
    await nextTick()
    fixture.attributeBuckets.value = { article_number: [{ value: '8071', count: 1 }] }
    fixture.facetSearchScope.value = 'A restored'
    await nextTick()
    const restored = all().find(n => n.type === 'input')
    assert.notEqual(restored, original, 'a fresh field must have mounted')
    assert.equal(restored.value, '807', 'the page must restore the typed draft')
    await new Promise(resolve => setTimeout(resolve, 330))
    assert.equal(pending[1].query, '807')
    pending[1].resolve([{ value: '8072 fresh result', count: 1 }])
    await new Promise(resolve => setTimeout(resolve, 0))
    await nextTick()
    assert(all().some(n => n.text === '8072 fresh result'))
    assert(!all().some(n => n.text === 'obsolete removed-field response'))
  }
  finally { app.unmount() }
})
