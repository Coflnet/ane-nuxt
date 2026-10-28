import { hasInvalidMeasurementRange } from '../utils/specFilters.ts'
import { nativeScopedPrice } from '../utils/searchCurrency.ts'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { computed, effectScope, nextTick, reactive, ref, watch } from 'vue'

const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
const functionSource = name => source.match(new RegExp(`(?:async )?function ${name}\\([\\s\\S]*?\\n}`))[0]

function budgetState(query, range, amounts) {
  const route = reactive({ query: { ...query } })
  const state = {
    route, priceRangeMin: ref(range.min), priceRangeMax: ref(range.max),
    priceFilterMin: ref(amounts.min), priceFilterMax: ref(amounts.max),
    selectedPriceCurrency: ref('SEK'),
    selectedMinPrice: computed(() => route.query.price_min === undefined ? undefined : Number(route.query.price_min)),
    selectedMaxPrice: computed(() => route.query.price_max === undefined ? undefined : Number(route.query.price_max)),
    router: { push({ query }) { route.query = query } },
    queryWithoutKeys: (...keys) => Object.fromEntries(Object.entries(route.query).filter(([key]) => !keys.includes(key))),
  }
  const apply = new Function('state', `with (state) { ${stripTypeScriptTypes(functionSource('applyPriceFilter'))}; return applyPriceFilter }`)(state)
  return { ...state, apply }
}

test('editing one budget bound preserves an untouched bound outside the latest source price range', () => {
  const query = { q: 'camera', platforms: 'Blocket', country: 'SE', price_currency: 'SEK', price_min: '10', price_max: '500', attr_brand: 'Canon' }
  const state = budgetState(query, { min: 100, max: 300 }, { min: 150, max: 500 })
  state.apply('min')
  assert.deepEqual(state.route.query, { ...query, price_min: '150' })
  state.priceFilterMin.value = 10
  state.priceFilterMax.value = 200
  state.route.query = { ...query }
  state.apply('max')
  assert.deepEqual(state.route.query, { ...query, price_max: '200' })
})

test('explicit budgets remain exact outside the observed range and an emptied field clears only that bound', () => {
  const query = { q: 'camera', price_currency: 'SEK', price_min: '10', price_max: '500' }
  const state = budgetState(query, { min: 100, max: 300 }, { min: 12.5, max: 750.5 })
  state.apply('min')
  assert.equal(state.route.query.price_min, '12.5')
  state.apply('max')
  assert.equal(state.route.query.price_max, '750.5')
  state.priceFilterMin.value = ''
  state.apply('min')
  assert.equal(state.route.query.price_min, undefined)
  assert.equal(state.route.query.price_max, '750.5')
  assert.equal(state.route.query.price_currency, 'SEK')
})

async function lifecycle(query = { priceCurrency: 'SEK', platforms: 'Blocket' }) {
  const route = reactive({ query: { ...query } })
  const requests = []
  const initialData = ref(null), initialError = ref(null), initialLoading = ref(true)
  const state = {
    route, ref, computed, watch, hasInvalidMeasurementRange, zipResolving: ref(false), selectedCategory: ref(''),
    routeHasSearchQuery: () => true,
    buildSearchParams: () => ({ ...route.query }),
    fetchTopLevelCategories: async () => {}, ensureGermanLabels: async () => {}, syncPrevQuery: () => {},
    loadingMore: ref(false), manualLoading: ref(false), searchError: ref(false), hasSearched: ref(false),
    allProducts: ref([]), totalResults: ref(0),
    nativeScopedPrice,
    selectedPriceCurrency: computed(() => route.query.priceCurrency),
    searchProducts: ({ query }) => new Promise((resolve, reject) => requests.push({ query, resolve, reject })),
    useRaceableAsyncData(key, fetcher) {
      Promise.resolve().then(fetcher).then((value) => {
        initialData.value = value
      }, (error) => {
        initialError.value = error
      }).finally(() => {
        initialLoading.value = false
      })
      return { data: initialData, error: initialError, loading: initialLoading }
    },
  }
  for (const key of ['storeBuckets', 'platformBuckets', 'currencyBuckets', 'categoryBuckets', 'conditionBuckets']) state[key] = ref([])
  for (const key of ['priceRangeMin', 'priceRangeMax', 'priceFilterMin', 'priceFilterMax', 'batteryRangeMin', 'batteryRangeMax', 'batteryFilterMin', 'batteryFilterMax']) state[key] = ref(0)
  for (const key of ['selectedBatteryMin', 'selectedBatteryMax', 'selectedMinPrice', 'selectedMaxPrice', 'interpretation']) state[key] = ref(undefined)
  state.attributeBuckets = ref({})
  const initialStart = source.indexOf('const { data: initialSearch,')
  const initialEnd = source.indexOf('// Compute available category buckets', initialStart)
  const block = source.slice(initialStart, initialEnd)
  const seq = source.match(/let searchSeq = 0/)[0]
  const measurementValidation = source.match(/const invalidMeasurementRange = computed\([^\n]+/)[0]
  const code = `${seq}; ${measurementValidation}; ${block}; ${functionSource('performSearch')}; ${functionSource('applySearchResponse')}; return { performSearch, loading }`
  const effects = effectScope()
  const actions = effects.run(() => new Function('state', `with (state) { ${stripTypeScriptTypes(`function setup() { ${code} }`).replaceAll('import.meta.server', 'false')}; return setup(); }`)(state))
  await nextTick()
  await Promise.resolve()
  return { ...state, ...actions, requests, stop: () => effects.stop() }
}

test('a late initial client response cannot overwrite a newer native-currency filter search or keep its spinner active', async () => {
  const page = await lifecycle()
  try {
    assert.equal(page.requests.length, 1)
    page.route.query = { priceCurrency: 'GBP', platforms: 'Gumtree' }
    const latest = page.performSearch()
    page.requests[1].resolve({ priceCurrency: 'GBP', products: [{ id: 'current-GBP' }], platformBuckets: [{ value: 'Gumtree', count: 2 }] })
    await latest
    await nextTick()
    const loadingAfterLatest = page.loading.value
    page.requests[0].resolve({ priceCurrency: 'SEK', products: [{ id: 'obsolete-SEK' }], platformBuckets: [{ value: 'Blocket', count: 99 }] })
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(page.allProducts.value, [{ id: 'current-GBP' }])
    assert.deepEqual(page.platformBuckets.value, [{ value: 'Gumtree', count: 2 }], 'obsolete initial facets must not replace current counts')
    assert.equal(loadingAfterLatest, false, 'completed current search must not wait for superseded initial request')
  }
  finally { page.stop() }
})

test('a late initial failure cannot replace successful current results with an error', async () => {
  const page = await lifecycle()
  try {
    const latest = page.performSearch()
    page.requests[1].resolve({ priceCurrency: 'SEK', products: [{ id: 'current' }] })
    await latest
    page.requests[0].reject(new Error('obsolete initial failure'))
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(page.searchError.value, false)
    assert.deepEqual(page.allProducts.value, [{ id: 'current' }])
  }
  finally { page.stop() }
})

test('failed current search preserves every URL input and retry uses the same native budget and filters', async () => {
  const page = await lifecycle()
  try {
    page.route.query = { priceCurrency: 'GBP', platforms: 'Gumtree', country: 'GB', minPrice: 10, maxPrice: 500, attributes: ['brand:Canon'] }
    const original = { ...page.route.query }
    const failed = page.performSearch()
    page.requests[1].reject(new Error('temporary test outage'))
    await failed
    assert.equal(page.searchError.value, true)
    assert.deepEqual(page.route.query, original)
    const retried = page.performSearch()
    assert.deepEqual(page.requests[2].query, original)
    page.requests[2].resolve({ priceCurrency: 'GBP', products: [{ id: 'recovered' }] })
    await retried
    assert.equal(page.searchError.value, false)
    assert.deepEqual(page.allProducts.value, [{ id: 'recovered' }])
    page.requests[0].resolve({ priceCurrency: 'SEK', products: [] })
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(page.allProducts.value, [{ id: 'recovered' }])
  }
  finally { page.stop() }
})

test('actual budget chip SSR distinguishes a zero maximum from an unbounded budget', async () => {
  const Vue = await import('vue')
  const { renderToString } = await import('vue/server-renderer')
  const { compileScript, parse } = await import('vue/compiler-sfc')
  const chip = source.match(/<span\s+v-if="selectedMinPrice[\s\S]*?<\/span>/)?.[0]
  assert(chip, 'Actual active-budget chip')
  const { descriptor } = parse(`<script setup lang="ts">defineProps<{ selectedMinPrice?: number, selectedMaxPrice?: number }>(); const locale = { value: 'en' }; const selectedPriceCurrency = { value: 'SEK' }; const clearPriceFilter = () => {}; ${functionSource('formatPrice')}</script><template>${chip}</template>`)
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'budget-chip-ssr', inlineTemplate: true }).content)
    .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace('export default', 'return')
  const component = new Function('Vue', code)(Vue)
  for (const [min, max] of [[undefined, 0], [5, 0], [undefined, 100], [5, undefined], [undefined, undefined]]) {
    const app = Vue.createSSRApp(component, { selectedMinPrice: min, selectedMaxPrice: max })
    app.config.globalProperties.$t = key => key
    const html = await renderToString(app)
    if (min === undefined && max === undefined) {
      assert(!html.includes('<span'), 'No budget has no active chip')
      continue
    }
    assert(html.includes('<span'), 'A zero maximum is still an active budget')
    const expectedMax = max === undefined ? '∞' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SEK' }).format(max)
    assert(html.includes(`– ${expectedMax}`), 'Actual chip renders the exact maximum, including zero')
  }
})

test('malformed millimetre deep link issues no initial or retry request and recovers after correction', async () => {
  const query = { priceCurrency: 'SEK', platforms: 'Blocket', country: 'SE', attr_part_inner_mm_min: 'not-a-dimension' }
  const page = await lifecycle(query)
  try {
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(page.hasSearched.value, false, 'cached-null hydration has no fetcher-side local state')
    const resultVisibility = source.match(/v-if="(loading \|\| products.length > 0 \|\| hasSearched \|\| invalidMeasurementRange)"/)[1]
    assert.equal(new Function('loading', 'products', 'hasSearched', 'invalidMeasurementRange', `return ${resultVisibility}`)(false, [], false, hasInvalidMeasurementRange(page.route.query)), true, 'URL-derived recovery stays visible after cached-null hydration')
    await page.performSearch()
    assert.equal(page.requests.length, 0)
    assert.equal(hasInvalidMeasurementRange(page.route.query), true, 'actual validation keeps the recovery error visible')
    assert.equal(page.route.query.attr_part_inner_mm_min, 'not-a-dimension', 'raw selection remains available to the remove chip')
    assert.deepEqual(page.route.query, query)
    assert.equal(page.loading.value, false)
    page.route.query = { ...query, attr_part_inner_mm_min: '17' }
    const recovered = page.performSearch()
    assert.equal(page.requests.length, 1)
    assert.deepEqual(page.requests[0].query, page.route.query)
    page.requests[0].resolve({ priceCurrency: 'SEK', products: [{ id: 'corrected-dimension' }] })
    await recovered
    assert.deepEqual(page.allProducts.value, [{ id: 'corrected-dimension' }])
    assert.equal(page.searchError.value, false)
  }
  finally { page.stop() }
})
