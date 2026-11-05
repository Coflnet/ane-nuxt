import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import * as Vue from 'vue'
import { compileScript, parse } from 'vue/compiler-sfc'
import { facetSearchParams } from '../utils/facetSearch.ts'

const page = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
const fieldSource = await readFile(new URL('../components/filters/AttributeFilter.vue', import.meta.url), 'utf8')
const loopStart = page.indexOf('<FiltersAttributeFilter')
const loop = page.slice(loopStart, page.indexOf('/>', loopStart) + 2)
const buckets = page.slice(page.indexOf('const availableAttributeBuckets = computed('), page.indexOf('// Battery range:'))
const drafts = page.match(/const facetDrafts = [^\n]+/)[0]
const loadSource = page.match(/async function loadAttributeValues\([\s\S]*?\n\}/)[0]

// Mount the actual page loop/computation and actual field. No Nuxt server or network.
async function mount({ productTypes = [], category = '', mapping = {}, query = '', supplied = {}, selected = {}, values = [{ value: 'Later-page value', count: 3 }] } = {}) {
  const calls = []
  const params = {
    query, country: 'DE', platforms: 'Kleinanzeigen,Willhaben', priceCurrency: 'EUR', condition: 'used',
    minPrice: 10, maxPrice: 250, sortBy: 'price_asc',
    attributes: Object.entries(selected).flatMap(([key, values]) => values.map(value => `${key}:${value}`)),
  }
  const loadAttributeValues = new Function('invalidMeasurementRange', 'searchProducts', 'facetSearchParams', 'buildSearchParams', `${stripTypeScriptTypes(loadSource)}; return loadAttributeValues`)(Vue.ref(false), async ({ query }) => {
    calls.push(query)
    return { attributeBuckets: { [query.facetKey]: values } }
  }, facetSearchParams, () => params)
  const fixture = {
    attributeBuckets: Vue.ref(supplied), activeAttributeFilters: Vue.ref(selected), interpretation: Vue.ref({ productTypes }),
    selectedCategory: Vue.ref(category), urlToNumeric: Vue.ref(mapping), searchQuery: Vue.ref(query),
    rangeFilterAttrs: new Set(), SPEC_ATTRIBUTE_KEYS: new Set(), yearRangeFilters: Vue.ref([]),
    facetSearchScope: Vue.ref(JSON.stringify(params)), localizeAttrKey: key => key.charAt(0).toUpperCase() + key.slice(1),
    localizeAttrValue: (_key, value) => value, loadAttributeValues, toggleAttributeFilter() {},
  }
  function compile(source, id) {
    const { descriptor } = parse(source)
    const code = stripTypeScriptTypes(compileScript(descriptor, { id, inlineTemplate: true }).content)
      .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
      .replace(/^import .*$/gm, '').replace('export default', 'return')
    return new Function('Vue', 'fixture', `const { ref, computed, reactive, watch, onMounted, onBeforeUnmount } = Vue; ${code}`)(Vue, fixture)
  }
  const field = compile(fieldSource, 'contextual-field')
  const parent = compile(`<script setup lang="ts">const { attributeBuckets, activeAttributeFilters, interpretation, selectedCategory, urlToNumeric, searchQuery, rangeFilterAttrs, SPEC_ATTRIBUTE_KEYS, yearRangeFilters, facetSearchScope, localizeAttrKey, localizeAttrValue, loadAttributeValues, toggleAttributeFilter } = fixture;\n${drafts}\n${buckets}</script><template><section>${loop}</section></template>`, 'contextual-page')
  const node = type => ({ type, tagName: type.toUpperCase(), props: {}, listeners: {}, children: [],
    addEventListener(name, callback) { this.listeners[name] = callback }, removeEventListener() {}, getRootNode: () => ({ activeElement: null }),
  })
  const renderer = Vue.createRenderer({
    createElement: node, createText: text => ({ ...node('#text'), text }), createComment: () => node('#comment'),
    setText(n, text) { n.text = text }, setElementText(n, text) {
      n.text = text
      n.children = []
    },
    parentNode: n => n.parent, nextSibling: n => n.parent?.children[n.parent.children.indexOf(n) + 1],
    patchProp(n, key, _old, value) {
      n.props[key] = value
      if (key === 'value') n.value = value
    },
    insert(n, parent, anchor) {
      if (n.parent) n.parent.children.splice(n.parent.children.indexOf(n), 1)
      n.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      parent.children.splice(index < 0 ? parent.children.length : index, 0, n)
    },
    remove(n) { n.parent.children.splice(n.parent.children.indexOf(n), 1) },
  })
  globalThis.Document ??= class {}
  globalThis.ShadowRoot ??= class {}
  const app = renderer.createApp(parent)
  app.component('FiltersAttributeFilter', field)
  app.config.globalProperties.$t = key => key
  const root = node('root')
  const all = (n = root) => [n, ...n.children.flatMap(child => all(child))]
  const card = key => all().find(n => n.type === 'h3' && n.text === fixture.localizeAttrKey(key))?.parent
  const settle = async () => {
    for (let i = 0; i < 10; i++) await Vue.nextTick()
  }
  app.mount(root)
  await settle()
  return { calls, params, all, card, settle, stop: () => app.unmount() }
}

for (const [type, key, value] of [['comics', 'series', 'Synthetic series beyond first page'], ['books', 'language', 'French']]) {
  test(`${type} title search renders missing ${key}, then discovers it once on explicit focus`, async () => {
    const view = await mount({ productTypes: [type], query: `${type} synthetic title`, supplied: { publisher: [{ value: 'Synthetic publisher', count: 1 }] }, values: [{ value, count: 3 }] })
    try {
      assert.deepEqual(view.calls, [], 'Untouched contextual fields make no requests')
      const card = view.card(key)
      assert(card, `Actual page must expose ${key} when it is absent from first-page metadata`)
      assert.deepEqual(view.all().filter(n => n.type === 'h3').map(n => n.text).sort(), ['Publisher', key.charAt(0).toUpperCase() + key.slice(1)].sort(), 'No unrelated contextual cards')
      const input = view.all(card).find(n => n.type === 'input')
      input.props.onFocus()
      await view.settle()
      assert.deepEqual(view.calls, [{ ...view.params, offset: 0, limit: 0, facetKey: key, facetQuery: '' }])
      assert(view.all(card).some(n => n.text === value), 'Later-page option is selectable after discovery')
      input.props.onFocus()
      await view.settle()
      assert.equal(view.calls.length, 1, 'Successful same-scope refocus reuses values')
    }
    finally { view.stop() }
  })
}

test('exact comics and physical-book selectors and registered localized slugs expose only the verified key', async () => {
  for (const [category, mapping, key] of [
    ['ane-comics', {}, 'series'], ['comics-local', { 'comics-local': 'ane-comics' }, 'series'],
    ['543543', {}, 'language'], ['784', {}, 'language'], ['gedruckte-buecher', { 'gedruckte-buecher': '543543' }, 'language'],
  ]) {
    const view = await mount({ category, mapping })
    try {
      assert(view.card(key), category)
      assert.deepEqual(view.calls, [], 'Leaf browsing does not start per-panel discovery')
      assert.deepEqual(view.all().filter(n => n.type === 'h3').map(n => n.text), [key.charAt(0).toUpperCase() + key.slice(1)])
    }
    finally { view.stop() }
  }
})

test('query substrings, lookalike selectors, audio/e-books and stationery do not create missing comics/book cards', async () => {
  for (const scope of [
    { query: 'comicstuhl bookshelves' }, { query: 'bookshelf', productTypes: ['furniture'] },
    { productTypes: ['comic', 'book', 'comics_furniture'] }, { category: 'ane-comics-extra' }, { category: '5435430' },
    { category: '543541' }, { category: '543542' }, { category: '961', productTypes: ['stationery'] },
    { category: 'bookcase', mapping: { bookcase: '436' } },
  ]) {
    const view = await mount(scope)
    try {
      assert.equal(view.card('series'), undefined, JSON.stringify(scope))
      assert.equal(view.card('language'), undefined, JSON.stringify(scope))
      assert.deepEqual(view.calls, [])
    }
    finally { view.stop() }
  }
})

test('existing real values and unrelated storage fields keep their generic rendering', async () => {
  const view = await mount({ productTypes: ['comics'], supplied: { series: [{ value: 'Existing series', count: 7 }], language: [{ value: 'German', count: 2 }], storage: [{ value: '38GB', count: 1 }] } })
  try {
    for (const [key, value] of [['series', 'Existing series'], ['language', 'German'], ['storage', '38GB']]) {
      assert(view.card(key), key)
      assert(view.all(view.card(key)).some(n => n.text === value))
    }
    assert.deepEqual(view.calls, [])
  }
  finally { view.stop() }
})

test('typed series discovery preserves native filters and selected outside-page choices while excluding only own series', async () => {
  const selected = { series: ['Selected outside page'], language: ['French'] }
  const view = await mount({ productTypes: ['comics'], query: 'comics synthetic title', selected, values: [{ value: 'Rare [literal] series', count: 1 }] })
  try {
    const card = view.card('series')
    assert(view.all(card).some(n => n.text === 'Selected outside page'))
    const input = view.all(card).find(n => n.type === 'input')
    input.value = 'Rare [literal]'
    input.listeners.input({ target: input })
    await view.settle()
    await new Promise(resolve => setTimeout(resolve, 330))
    await view.settle()
    const calls = view.calls.filter(call => call.facetKey === 'series')
    assert.deepEqual(calls, [{ ...view.params, offset: 0, limit: 0, facetKey: 'series', facetQuery: 'Rare [literal]', attributes: ['language:French'] }])
    assert(view.all(card).some(n => n.text === 'Selected outside page'))
    assert(view.all(card).some(n => n.text === 'Rare [literal] series'))
  }
  finally { view.stop() }
})
