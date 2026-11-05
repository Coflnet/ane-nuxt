import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import * as Vue from 'vue'
import { computed, ref } from 'vue'
import { compileScript, parse } from 'vue/compiler-sfc'
import { useFormat } from '../composable/useFormat.ts'
import { facetSearchParams, toggleAttributeValue } from '../utils/facetSearch.ts'

const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
const functionSource = name => source.match(new RegExp(`(?:async )?function ${name}\\([\\s\\S]*?\\n}`))[0]
function facetBuckets({ productTypes = [], category = '', mapping = {}, buckets = {}, selected = {} } = {}) {
  const start = source.indexOf('const availableAttributeBuckets = computed(')
  const block = source.slice(start, source.indexOf('// Battery range:', start))
  const state = { computed, activeAttributeFilters: ref(selected), attributeBuckets: ref(buckets), rangeFilterAttrs: new Set(), SPEC_ATTRIBUTE_KEYS: new Set(), yearRangeFilters: ref([]), interpretation: ref({ productTypes }), selectedCategory: ref(category), urlToNumeric: ref(mapping) }
  return new Function('state', `with (state) { ${stripTypeScriptTypes(block)}; return availableAttributeBuckets }`)(state).value
}

test('actual total display formats complete API totals above10000 without a display cap', () => {
  const start = source.includes('const SEARCH_TOTAL_CAP') ? source.indexOf('const SEARCH_TOTAL_CAP') : source.indexOf('const { formatNumber } = useFormat()')
  const block = source.slice(start, source.indexOf('const categoryBuckets', start))
  for (const locale of ['en', 'de']) {
    for (const total of [85645, 10032, 10000, 9999, 208, 0]) {
      const display = new Function('computed', 'totalResults', 'locale', 'useFormat', `${stripTypeScriptTypes(block)}; return formattedTotalResults`)(computed, ref(total), ref(locale), useFormat)
      assert.equal(display.value, useFormat().formatNumber(total, locale), `${locale} total${total}`)
    }
  }
})

test('parsed vinyl-record intent exposes lazy artist discovery when other main facets survive', () => {
  const result = facetBuckets({ productTypes: ['vinyl_records'], buckets: { format: [{ value: 'LP', count: 4 }], brand: [{ value: 'Synthetic label', count: 2 }] } })
  assert.deepEqual(result.artist, [], 'Show an empty searchable artist field without fabricated values/counts')
  assert.deepEqual(result.format, [{ value: 'LP', count: 4 }])
  assert.deepEqual(result.brand, [{ value: 'Synthetic label', count: 2 }])
})

test('exact vinyl leaf and a registered localized slug expose artist without text interpretation', () => {
  for (const scope of [{ category: '543523' }, { category: 'schallplatten', mapping: { schallplatten: '543523' } }, { category: 'records', mapping: { records: '543523' } }]) {
    assert.deepEqual(facetBuckets(scope).artist, [], JSON.stringify(scope))
  }
})

test('Vinylboden and unrelated category/type scopes gain no empty artist card', () => {
  for (const scope of [{}, { category: 'vinylboden', productTypes: ['flooring'] }, { category: '5435230' }, { category: 'bekleidung', mapping: { bekleidung: '1604' }, productTypes: ['jacket'] }]) {
    assert.equal(Object.hasOwn(facetBuckets(scope), 'artist'), false, JSON.stringify(scope))
  }
})

test('real artist buckets and selected artists survive instead of being replaced with empty discovery', () => {
  const artist = [{ value: 'Synthetic artist', count: 1 }]
  assert.deepEqual(facetBuckets({ productTypes: ['vinyl_records'], buckets: { artist } }).artist, artist)
  assert.deepEqual(facetBuckets({ selected: { artist: ['Outside the response'] } }).artist, [{ value: 'Outside the response' }])
})

test('clothing storage remains visible through existing generic facet rendering', () => {
  const storage = [{ value: '38GB', count: 2 }]
  assert.deepEqual(facetBuckets({ category: '1604', productTypes: ['jacket'], buckets: { storage } }).storage, storage, 'Repair classification upstream; do not cosmetically hide bad data')
})

test('artist discovery and selection keep native currency, budget, country, platforms, sort and other attributes', async () => {
  const scope = { query: 'vinyl', country: 'SE', platforms: 'Blocket', priceCurrency: 'SEK', minPrice: 10, maxPrice: 500, sortBy: 'price', includeIndividualOffers: true, attributes: ['artist:Selected artist', 'format:LP', 'condition:used'] }
  const calls = []
  const load = new Function('invalidMeasurementRange', 'searchProducts', 'facetSearchParams', 'buildSearchParams', `${stripTypeScriptTypes(functionSource('loadAttributeValues'))}; return loadAttributeValues`)(ref(false), async ({ query }) => {
    calls.push(query)
    return { attributeBuckets: { artist: [{ value: 'Rare [literal] artist', count: 1 }] } }
  }, facetSearchParams, () => scope)
  assert.deepEqual(await load('artist', '[literal]'), [{ value: 'Rare [literal] artist', count: 1 }])
  assert.deepEqual(calls, [{ ...scope, offset: 0, limit: 0, facetKey: 'artist', facetQuery: '[literal]', attributes: ['format:LP', 'condition:used'] }])
  const query = { q: 'vinyl', country: 'SE', platforms: 'Blocket', price_currency: 'SEK', price_min: '10', price_max: '500', sort: 'price', attr_format: 'LP', attr_artist: 'Selected artist' }
  let next
  const toggle = new Function('router', 'toggleAttributeValue', 'queryWithoutKeys', `${stripTypeScriptTypes(functionSource('toggleAttributeFilter'))}; return toggleAttributeFilter`)({ push: (value) => {
    next = value.query
  } }, toggleAttributeValue, () => query)
  toggle('artist', 'Rare [literal] artist')
  assert.deepEqual(next, { ...query, attr_artist: ['Selected artist', 'Rare [literal] artist'] })
})

test('artist facet shows a localized label in English and German', async () => {
  const mapping = source.slice(source.indexOf('const attrKeyTranslationMap:'), source.indexOf('// Common attribute value translations'))
  for (const [locale, expected] of [['en', 'Artist'], ['de', 'Künstler']]) {
    const messages = JSON.parse(await readFile(new URL(`../locales/${locale}.json`, import.meta.url), 'utf8'))
    const localize = new Function('t', `${stripTypeScriptTypes(mapping)}; ${stripTypeScriptTypes(functionSource('localizeAttrKey'))}; ${stripTypeScriptTypes(functionSource('formatAttrKeyFallback'))}; return localizeAttrKey`)((key, fallback) => messages[key] ?? fallback)
    assert.equal(localize('artist'), expected)
  }
})

test('empty artist discovery waits for explicit focus and reuses its successful same-scope lookup', async () => {
  const field = await fieldComponent()
  const node = type => ({ type, tagName: type.toUpperCase(), props: {}, children: [], addEventListener() {}, removeEventListener() {}, getRootNode: () => ({ activeElement: null }) })
  const renderer = Vue.createRenderer({
    createElement: node, createText: text => ({ ...node('#text'), text }), createComment: () => node('#comment'),
    setText(n, text) { n.text = text }, setElementText(n, text) {
      n.text = text
      n.children = []
    },
    parentNode: n => n.parent, nextSibling: () => null,
    patchProp(n, key, _old, value) { n.props[key] = value },
    insert(n, parent) {
      n.parent = parent
      parent.children.push(n)
    },
    remove(n) { n.parent.children.splice(n.parent.children.indexOf(n), 1) },
  })
  globalThis.Document ??= class {}
  globalThis.ShadowRoot ??= class {}
  const calls = []
  const app = renderer.createApp(field, {
    title: 'Artist', draft: '', buckets: [], selected: [], scope: 'synthetic-vinyl-SEK', discoverOnFocus: true,
    formatValue: value => value, loadValues: async (query) => {
      calls.push(query)
      return [{ value: 'Synthetic artist', count: 2 }]
    },
  })
  app.config.globalProperties.$t = key => key
  const root = node('root')
  app.mount(root)
  const settle = async () => {
    for (let i = 0; i < 8; i++) await Vue.nextTick()
  }
  const all = (n = root) => [n, ...n.children.flatMap(child => all(child))]
  try {
    await settle()
    assert.deepEqual(calls, [], 'An untouched empty artist card issues no requests')
    const input = all().find(n => n.type === 'input')
    assert.equal(typeof input.props.onFocus, 'function', 'The actual input must expose explicit lazy discovery')
    input.props.onFocus()
    await settle()
    assert.deepEqual(calls, [''])
    assert(all().some(n => n.text === 'Synthetic artist'))
    input.props.onFocus()
    await settle()
    assert.deepEqual(calls, [''], 'Refocusing a successful same-scope discovery does not repeat the count request')
  }
  finally { app.unmount() }
})

async function fieldComponent() {
  const { descriptor } = parse(await readFile(new URL('../components/filters/AttributeFilter.vue', import.meta.url), 'utf8'))
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'artist-focus', inlineTemplate: true }).content)
    .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace(/^import .*$/gm, '').replace('export default', 'return')
  return new Function('Vue', `const { ref, computed, watch, onMounted, onBeforeUnmount } = Vue; ${code}`)(Vue)
}

test('facet helper is reserved for multiple selections and untouched empty discovery has no false no-match message', async () => {
  const { renderToString } = await import('vue/server-renderer')
  const component = await fieldComponent()
  for (const selected of [[], ['One'], ['One', 'Two']]) {
    const app = Vue.createSSRApp(component, {
      title: 'Artist', buckets: [], selected, scope: 'synthetic', draft: '', discoverOnFocus: true,
      formatValue: value => value, loadValues: async () => [],
    })
    app.config.globalProperties.$t = key => key
    const html = await renderToString(app)
    assert.equal(html.includes('filterMatchAny'), selected.length > 1)
    assert.equal(html.includes('noMatchingFilterValues'), false, 'No lookup has completed yet')
  }
})
