import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { computed, reactive, ref } from 'vue'
import { searchCurrency } from '../utils/searchCurrency.ts'
import { parseOfferFilterQuery } from '../utils/offerFilters.ts'
import { attributeValues } from '../utils/facetSearch.ts'
import { SPEC_RANGE_PARAMS, buildSpecApiFilters, hasInvalidMeasurementRange } from '../utils/specFilters.ts'

const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
const functionSource = name => source.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n}`))[0]

// Execute the page's actual setup state, eager SSR fetcher and request builder. Only I/O is stubbed.
async function initialPage(query) {
  const requests = []
  let initialRequest, mounted
  const state = {
    route: reactive({ query: { ...query }, fullPath: '/search' }), ref, computed,
    searchCurrency, parseOfferFilterQuery, attributeValues, SPEC_RANGE_PARAMS, buildSpecApiFilters, hasInvalidMeasurementRange,
    useUserLocation: () => ({ requestBrowserPosition() { throw new Error('SSR must not request browser position') } }),
    PAGE_SIZE: Number(source.match(/const PAGE_SIZE = (\d+)/)[1]),
    selectedBatteryMin: ref(undefined), selectedBatteryMax: ref(undefined),
    invalidMeasurementRange: computed(() => hasInvalidMeasurementRange(query)),
    fetchTopLevelCategories: async () => {}, ensureGermanLabels: async () => {},
    fetchGlobalCategoryCounts() {}, ensureCountsBySlug() {}, setupScrollObserver() {}, lookupZipCode: async () => {},
    applySearchResponse() {}, hasSearched: ref(false), searchError: ref(false),
    searchProducts: async ({ query }) => {
      requests.push(query)
      return { products: [], total: 0 }
    },
    useRaceableAsyncData(_, fetcher) {
      initialRequest = fetcher()
      return {}
    },
    onMounted(callback) { mounted = callback },
  }
  const declarations = source.slice(source.indexOf('// URL-derived state'), source.indexOf('// Data state'))
  const initial = source.slice(source.indexOf('const { data: initialSearch,'), source.indexOf('// Combined loading:'))
  const mount = source.slice(source.indexOf('onMounted(async () => {'), source.indexOf('// --- Localization helpers ---'))
  const code = `${declarations}; ${functionSource('routeHasSearchQuery')}; ${functionSource('buildSearchParams')};
    ${initial}; function performSearch() { return searchProducts({ query: buildSearchParams() }) }; ${mount}`
  new Function('state', `with (state) { ${stripTypeScriptTypes(code).replaceAll('import.meta.server', 'true')} }`)(state)
  await initialRequest
  return { requests, mount: () => mounted() }
}

const nearby = {
  q: 'Knipex', country: 'SE', platforms: 'Blocket', price_currency: 'SEK', includeIndividualOffers: 'true',
  lat: '59.3', lon: '18.1', max_distance: '25', attr_article_number: ['95 31 250', '95 32 320'], attr_length_mm_max: '320',
}

test('first SSR nearby request includes URL coordinates and radius with native and repeated filter scope', async () => {
  const page = await initialPage(nearby)
  assert.equal(page.requests.length, 1)
  assert.deepEqual(page.requests[0], {
    offset: 0, limit: 20, priceCurrency: 'SEK', query: 'Knipex', includeIndividualOffers: 'true', platforms: 'Blocket',
    country: 'SE', lat: 59.3, lon: 18.1, maxDistanceKm: 25,
    attributes: ['article_number:95 31 250', 'article_number:95 32 320', 'length_mm_max:320'],
  })
})

test('mount does not issue a second nearby request after setup already fetched the URL scope', async () => {
  const page = await initialPage(nearby)
  await page.mount()
  assert.equal(page.requests.length, 1)
})

test('finite zero and negative URL coordinates retain their exact nearby scope', async () => {
  for (const [lat, lon] of [['0', '0'], ['-33.9', '18.4']]) {
    const page = await initialPage({ ...nearby, lat, lon })
    assert.equal(page.requests[0].lat, Number(lat))
    assert.equal(page.requests[0].lon, Number(lon))
    assert.equal(page.requests[0].maxDistanceKm, 25)
  }
})

test('ZIP resolution and invalid measurement guards suppress the initial nearby request', async () => {
  for (const guard of [{ zip: '10115' }, { attr_length_mm_max: 'invalid' }]) {
    const page = await initialPage({ ...nearby, ...guard })
    assert.equal(page.requests.length, 0)
  }
})

test('missing or nonfinite coordinate pairs do not send partial geometry or radius', async () => {
  for (const pair of [{ lat: '', lon: '18.1' }, { lat: '59.3', lon: '' }, { lat: 'NaN', lon: '18.1' }, { lat: '59.3', lon: 'Infinity' }]) {
    const page = await initialPage({ ...nearby, ...pair })
    assert.equal(page.requests.length, 1)
    for (const key of ['lat', 'lon', 'maxDistanceKm']) assert.equal(page.requests[0][key], undefined)
    assert.equal(page.requests[0].country, 'SE')
    assert.equal(page.requests[0].priceCurrency, 'SEK')
  }
})
