import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { compileScript, parse } from 'vue/compiler-sfc'
import * as Vue from 'vue'
import { searchCurrency, nativeScopedPrice } from '../utils/searchCurrency.ts'
import { parseOfferFilterQuery } from '../utils/offerFilters.ts'
import { attributeValues } from '../utils/facetSearch.ts'
import { buildSpecApiFilters, hasInvalidMeasurementRange, SPEC_RANGE_PARAMS } from '../utils/specFilters.ts'
import { resolveSearchCategoryParam } from '../utils/searchCategoryParam.ts'

const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
const { descriptor } = parse(source)
const script = descriptor.scriptSetup.content
const ast = compileScript(descriptor, { id: 'store-search' }).scriptSetupAst

// Use the page's declarations, response handler, initial fetch and route watcher. Only
// navigation, network and unrelated UI state are substituted, as in searchMarketplaces.
async function searchPage(query, { ssr = false, respond = () => ({ products: [], priceCurrency: 'EUR' }) } = {}) {
  const declarations = new Set(['searchQuery', 'includePartOffers', 'includeIndividualOffers', 'selectedCategory', 'selectedCondition',
    'selectedStore', 'storeBuckets', 'selectedPlatforms', 'selectedPriceCurrency', 'selectedMinPrice', 'selectedMaxPrice', 'selectedSort',
    'selectedMaxDistance', 'activeAttributeFilters', 'hasActiveFilters', 'selectedCountryCode', 'prevQuery', 'platformBuckets', 'currencyBuckets',
    'attributeBuckets', 'invalidMeasurementRange'])
  const functions = new Set(['routeHasSearchQuery', 'syncPrevQuery', 'buildSearchParams', 'queryWithoutKeys', 'toggleFilter', 'clearFilter',
    'clearAllFilters', 'performSearch', 'applySearchResponse'])
  const selected = ast.filter(node => (node.type === 'VariableDeclaration' && node.declarations.some(d => declarations.has(d.id.name)))
    || (node.type === 'FunctionDeclaration' && functions.has(node.id.name)))
    .map(node => script.slice(node.start, node.end)).join('\n')
  const watcher = ast.find(node => node.type === 'ExpressionStatement' && script.slice(node.start, node.end).startsWith('watch(() => route.query,'))
  const initial = script.slice(script.indexOf('const { data: initialSearch,'), script.indexOf('// Compute available category buckets'))
  const route = Vue.reactive({ query: { ...query }, fullPath: '/search' })
  const requests = []
  const router = { push({ query }) {
    route.query = { ...query }
    return Vue.nextTick()
  } }
  let initialRequest
  const state = {
    ...Vue, route, router, attributeValues, buildSpecApiFilters, SPEC_RANGE_PARAMS, parseOfferFilterQuery, searchCurrency,
    nativeScopedPrice, hasInvalidMeasurementRange, resolveSearchCategoryParam,
    searchProducts: async ({ query }) => {
      requests.push(query)
      return respond(query)
    },
    fetchTopLevelCategories: async () => {}, ensureGermanLabels: async () => {},
    useRaceableAsyncData(_key, fetcher) {
      const data = Vue.ref(null), error = Vue.ref(null), loading = Vue.ref(true)
      initialRequest = Promise.resolve().then(fetcher).then((value) => {
        data.value = value
      }, (failure) => {
        error.value = failure
      })
        .finally(() => { loading.value = false })
      return { data, error, loading }
    },
  }
  const effects = Vue.effectScope()
  const code = `
    const userLocation = ref(null), selectedBatteryMin = ref(), selectedBatteryMax = ref();
    const hasSpecRangeSelection = ref(false), distanceFilterKm = ref(50), zipResolving = ref(false);
    const hasSearched = ref(false), searchError = ref(false), interpretation = ref(null);
    const loadingMore = ref(false), manualLoading = ref(false), allProducts = ref([]), totalResults = ref(0);
    const categoryBuckets = ref([]), conditionBuckets = ref([]);
    const priceRangeMin = ref(0), priceRangeMax = ref(0), priceFilterMin = ref(0), priceFilterMax = ref(0);
    const batteryRangeMin = ref(0), batteryRangeMax = ref(100), batteryFilterMin = ref(0), batteryFilterMax = ref(100);
    const PAGE_SIZE = 20, urlToNumeric = ref({ tools: '123' }), germanLabelBySlug = ref({ '123': 'Werkzeug' });
    let searchSeq = 0;
    ${selected}
    ${initial}
    ${script.slice(watcher.start, watcher.end)}
    return { selectedStore, storeBuckets, hasActiveFilters, searchError, allProducts, hasSearched,
      toggleFilter, clearFilter, clearAllFilters, buildSearchParams, performSearch, applySearchResponse, routeHasSearchQuery };
  `
  const page = effects.run(() => new Function('state', `with (state) { ${stripTypeScriptTypes(`function setup() { ${code} }`).replaceAll('import.meta.server', String(ssr))}; return setup() }`)(state))
  await initialRequest
  await Vue.nextTick()
  return { ...page, route, router, requests, stop: () => effects.stop() }
}

const scopedQuery = { q: 'Bahco', store: 'Lefeld', platforms: 'Blocket,Ebay', country: 'SE', price_currency: 'SEK',
  category: 'tools', condition: 'used', price_min: '10', attr_article_number: ['111M-10', '111M-13'], attr_length_mm_min: '140' }

test('actual initial store request composes native currency, sources, category and repeated attributes', async () => {
  const page = await searchPage(scopedQuery)
  try {
    assert.deepEqual(page.requests[0], { offset: 0, limit: 20, priceCurrency: 'SEK', query: 'Bahco', store: 'Lefeld',
      platforms: 'Blocket,Ebay', country: 'SE', category: 'Werkzeug', condition: 'used', minPrice: 10,
      attributes: ['article_number:111M-10', 'article_number:111M-13', 'length_mm_min:140'] })
    assert.equal(page.hasActiveFilters.value, true)
    assert.deepEqual(page.buildSearchParams(20), { ...page.requests[0], offset: 20 })
  }
  finally { page.stop() }
})

test('store-only SSR deep link executes the real fetch and never invents a bucket from hits', async () => {
  const page = await searchPage({ store: 'Lefeld' }, { ssr: true, respond: () => ({ priceCurrency: 'EUR',
    products: [{ seoId: 'reference', stores: ['Lefeld'], attributes: [{ key: 'store', value: 'Lefeld' }] }] }) })
  try {
    assert.equal(page.requests.length, 1)
    assert.equal(page.requests[0].store, 'Lefeld')
    assert.equal(page.hasSearched.value, true)
    assert.equal(page.hasActiveFilters.value, true)
    assert.deepEqual(page.storeBuckets.value, [])
    assert.equal(page.selectedStore.value, 'Lefeld')
  }
  finally { page.stop() }
})

test('observed store buckets use only positive Lefeld aggregation and retain unavailable selections', async () => {
  const page = await searchPage({ store: 'Lefeld' })
  try {
    page.applySearchResponse({ priceCurrency: 'EUR', storeBuckets: [{ value: 'Lefeld', count: 3 }, { value: 'Other', count: 100 }] }, false)
    assert.deepEqual(page.storeBuckets.value, [{ value: 'Lefeld', count: 3 }])
    for (const storeBuckets of [undefined, [], [{ value: 'Lefeld', count: 0 }], [{ value: 'Lefeld', count: -1 }], [{ value: 'Other', count: 3 }]]) {
      page.applySearchResponse({ priceCurrency: 'EUR', storeBuckets, products: [{ stores: ['Lefeld'] }] }, false)
      assert.deepEqual(page.storeBuckets.value, [])
      assert.equal(page.selectedStore.value, 'Lefeld')
      assert.equal(page.buildSearchParams().store, 'Lefeld')
    }
  }
  finally { page.stop() }
})

test('select, unselect, back and reload change the actual request while preserving every other filter', async () => {
  const without = { ...scopedQuery }
  delete without.store
  const page = await searchPage(without)
  let reloaded
  try {
    page.toggleFilter('store', 'Lefeld')
    await Vue.nextTick()
    assert.deepEqual(page.route.query, scopedQuery)
    assert.equal(page.requests.at(-1).store, 'Lefeld')
    const selected = { ...page.requests.at(-1) }
    const shared = structuredClone(Vue.toRaw(page.route.query))
    page.toggleFilter('store', 'Lefeld')
    await Vue.nextTick()
    assert.deepEqual(page.route.query, without)
    assert.equal(page.requests.at(-1).store, undefined)
    await page.router.push({ query: shared }) // Forward/back history restores the URL choice.
    assert.deepEqual(page.requests.at(-1), selected)
    reloaded = await searchPage(shared)
    assert.deepEqual(reloaded.requests[0], selected)
    page.clearFilter('store')
    await Vue.nextTick()
    assert.deepEqual(page.route.query, without)
    assert.deepEqual(page.requests.at(-1).attributes, selected.attributes)
    assert.equal(page.requests.at(-1).priceCurrency, 'SEK')
  }
  finally {
    reloaded?.stop()
    page.stop()
  }
})

test('a recognized case-insensitive deep link clears in one checkbox action', async () => {
  const page = await searchPage({ q: 'Bahco', store: 'lefeld', price_currency: 'PLN' })
  try {
    assert.equal(page.requests[0].store, 'lefeld', 'the URL value is sent intact to API validation')
    page.toggleFilter('store', 'Lefeld')
    await Vue.nextTick()
    assert.deepEqual(page.route.query, { q: 'Bahco', price_currency: 'PLN' })
    assert.equal(page.requests.at(-1).store, undefined)
  }
  finally { page.stop() }
})

test('unknown store remains visible and removable after API failure without broadening the failed request', async (t) => {
  t.mock.method(console, 'warn', () => {})
  const query = { ...scopedQuery, store: 'unknown-store' }
  const page = await searchPage(query, { respond: (params) => {
    if (params.store) throw new Error('Invalid store')
    return { products: [], priceCurrency: 'SEK' }
  } })
  try {
    assert.equal(page.requests[0].store, 'unknown-store')
    assert.equal(page.searchError.value, true)
    assert.equal(page.selectedStore.value, 'unknown-store')
    assert.deepEqual(page.route.query, query)
    page.clearFilter('store')
    await Vue.nextTick()
    await Promise.resolve()
    assert.equal(page.requests.at(-1).store, undefined)
    assert.equal(page.searchError.value, false)
    const expected = { ...query }
    delete expected.store
    assert.deepEqual(page.route.query, expected)
  }
  finally { page.stop() }
})

test('clear all removes store but retains the existing search text and native currency contract', async () => {
  const page = await searchPage(scopedQuery)
  try {
    page.clearAllFilters()
    await Vue.nextTick()
    assert.deepEqual(page.route.query, { q: 'Bahco', price_currency: 'SEK' })
    assert.equal(page.selectedStore.value, '')
    assert.equal(page.requests.at(-1).store, undefined)
  }
  finally { page.stop() }
})

// Mount the actual fieldset and active badge so click handlers, checked state,
// unavailable status and target sizing are tested together with the page actions.
async function mountControls(page) {
  const fieldset = source.match(/<fieldset\b[^>]+data-testid="store-reference-filter"[\s\S]*?<\/fieldset>/)?.[0]
  const badge = source.match(/<button\b[^>]+data-testid="active-store-reference"[\s\S]*?<\/button>/)?.[0]
  assert.ok(fieldset && badge)
  const { descriptor } = parse(`<script setup lang="ts">defineProps<{ selectedStore: string; storeBuckets: unknown[]; toggleFilter: Function; clearFilter: Function }>()</script><template>${fieldset}${badge}</template>`)
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'store-controls', inlineTemplate: true }).content)
    .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace('export default', 'return')
  const component = new Function('Vue', code)(Vue)
  const node = type => ({ type, props: {}, children: [] })
  const renderer = Vue.createRenderer({
    createElement: node, createText: text => ({ ...node('#text'), text }), createComment: () => node('#comment'),
    setText(n, text) { n.text = text },
    setElementText(n, text) {
      n.text = text
      n.children = []
    },
    parentNode: n => n.parent, nextSibling: n => n.parent?.children[n.parent.children.indexOf(n) + 1] || null,
    patchProp(n, key, old, value) { n.props[key] = value },
    insert(n, parent, anchor) {
      n.parent = parent
      const at = anchor ? parent.children.indexOf(anchor) : -1
      if (at < 0) parent.children.push(n)
      else parent.children.splice(at, 0, n)
    },
    remove(n) {
      const i = n?.parent?.children.indexOf(n)
      if (i >= 0) n.parent.children.splice(i, 1)
    },
  })
  const root = node('root')
  const app = renderer.createApp({ render: () => Vue.h(component, { selectedStore: page.selectedStore.value, storeBuckets: page.storeBuckets.value,
    toggleFilter: page.toggleFilter, clearFilter: page.clearFilter }) })
  app.config.globalProperties.$t = key => key
  app.mount(root)
  const all = (n = root) => [n, ...n.children.flatMap(child => all(child))]
  return { find: id => all().find(n => n.props['data-testid'] === id), all, stop: () => app.unmount() }
}

test('actual Lefeld checkbox and clear badge remain accessible and usable with zero observed references', async () => {
  const page = await searchPage({ q: 'Bahco' })
  const controls = await mountControls(page)
  try {
    const checkbox = controls.find('store-reference-lefeld')
    assert.equal(checkbox.props.type, 'checkbox')
    assert.match(checkbox.parent.props.class, /\bmin-h-11\b/)
    assert.equal(checkbox.props.checked, false)
    assert.ok(controls.all().some(n => n.props.role === 'status'))
    checkbox.props.onChange()
    await Vue.nextTick()
    assert.equal(page.requests.at(-1).store, 'Lefeld')
    assert.equal(controls.find('store-reference-lefeld').props.checked, true)
    const badge = controls.find('active-store-reference')
    assert.match(badge.props.class, /\bmin-h-11\b/)
    assert.equal(badge.props['aria-label'], 'clearStoreReferenceFilter')
    badge.props.onClick()
    await Vue.nextTick()
    assert.deepEqual(page.route.query, { q: 'Bahco' })
    assert.equal(page.requests.at(-1).store, undefined)
    assert.equal(controls.find('store-reference-lefeld').props.checked, false)
  }
  finally {
    controls.stop()
    page.stop()
  }
})
