import { searchCurrency, nativeScopedPrice, isIndividualOffer } from '../utils/searchCurrency.ts'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { compileScript, parse } from 'vue/compiler-sfc'
import { computed, effectScope, nextTick, reactive, ref, watch } from 'vue'
import { activeMarketplaces } from '../constants/CreateFilterConstants.ts'
import { parseOfferFilterQuery } from '../utils/offerFilters.ts'
import { attributeValues, facetSearchParams, toggleAttributeValue } from '../utils/facetSearch.ts'
import { buildSpecApiFilters, SPEC_RANGE_PARAMS, SPEC_ATTRIBUTE_KEYS } from '../utils/specFilters.ts'

// Execute the actual page declarations, watcher and handlers. Only unrelated UI state and
// navigation/network boundaries are replaced; marketplace/filter logic comes from the SFC AST.
async function searchPage(query, respond = () => ({})) {
  const { descriptor } = parse(await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8'))
  const ast = compileScript(descriptor, { id: 'search-marketplaces' }).scriptSetupAst
  const declarations = new Set(['searchQuery', 'includePartOffers', 'includeIndividualOffers', 'selectedCategory', 'selectedCondition', 'selectedPlatforms', 'selectedPriceCurrency', 'selectedMinPrice', 'selectedMaxPrice', 'selectedSort', 'selectedMaxDistance', 'activeAttributeFilters', 'hasActiveFilters', 'selectedCountryCode', 'prevQuery', 'platformBuckets', 'availablePlatforms', 'attributeBuckets', 'availableAttributeBuckets', 'currencyBuckets'])
  const functions = new Set(['routeHasSearchQuery', 'syncPrevQuery', 'onCountrySelect', 'clearAllFilters', 'buildSearchParams', 'togglePlatform', 'queryWithoutKeys', 'buildProductLink', 'loadAttributeValues', 'loadMore', 'performSearch', 'pinPriceCurrency', 'onPriceCurrencySelect', 'applyPriceFilter', 'clearPriceFilter', 'applySearchResponse', 'toggleAttributeFilter', 'removeAttributeFilter'])
  const source = descriptor.scriptSetup.content
  const code = ast.filter(node =>
    (node.type === 'VariableDeclaration' && node.declarations.some(d => declarations.has(d.id.name)))
    || (node.type === 'FunctionDeclaration' && functions.has(node.id.name))
    || (node.type === 'ExpressionStatement' && source.slice(node.start, node.end).startsWith('watch(() => route.query,')),
  ).map(node => source.slice(node.start, node.end)).join('\n')
  const route = reactive({ query: { ...query } })
  const router = { push({ query: next }) {
    route.query = { ...next }
    return nextTick()
  } }
  router.replace = router.push
  const requests = [], responses = []
  let page
  const scope = effectScope()
  const factory = new Function('ref', 'computed', 'reactive', 'watch', 'route', 'router', 'attributeValues', 'buildSpecApiFilters', 'SPEC_RANGE_PARAMS', 'parseOfferFilterQuery', 'activeMarketplaces', 'facetSearchParams', 'searchProducts', 'responses', 'searchCurrency', 'nativeScopedPrice', 'toggleAttributeValue', 'SPEC_ATTRIBUTE_KEYS', `
    const userLocation = ref(null), selectedBatteryMin = ref(), selectedBatteryMax = ref();
    const rangeFilterAttrs = new Set(['battery']), yearRangeFilters = ref([]);
    const batteryRangeMin = ref(0), batteryRangeMax = ref(100), batteryFilterMin = ref(0), batteryFilterMax = ref(100);
    const hasSpecRangeSelection = ref(false), hasSearched = ref(true), distanceFilterKm = ref(50);
    const priceRangeMin = ref(0), priceRangeMax = ref(1000), priceFilterMin = ref(0), priceFilterMax = ref(1000);
    const PAGE_SIZE = 20, urlToNumeric = ref({}), germanLabelBySlug = ref({});
    const resolveSearchCategoryParam = value => value;
    let searchSeq = 0;
    const loadingMore = ref(false); const manualLoading = ref(false), searchError = ref(false), interpretation = ref(null);
    const allProducts = ref([{ id: 1 }, { id: 2 }]), totalResults = ref(0), categoryBuckets = ref([]), conditionBuckets = ref([]);
    ${stripTypeScriptTypes(code).replace('import.meta.server', 'false')}
    const apply = applySearchResponse;
    applySearchResponse = (response, append) => { responses.push({ response, append }); apply(response, append) };
    syncPrevQuery();
    return { performSearch, allProducts, activeAttributeFilters, availableAttributeBuckets, toggleAttributeFilter, removeAttributeFilter, selectedPriceCurrency, pinPriceCurrency, onPriceCurrencySelect, applyPriceFilter, clearPriceFilter, priceFilterMin, priceFilterMax, selectedCountryCode, selectedPlatforms, availablePlatforms, platformBuckets, hasActiveFilters, onCountrySelect, clearAllFilters, buildSearchParams, togglePlatform, buildProductLink, loadAttributeValues, loadMore };
  `)
  page = scope.run(() => factory(ref, computed, reactive, watch, route, router, attributeValues, buildSpecApiFilters, SPEC_RANGE_PARAMS, parseOfferFilterQuery, activeMarketplaces, facetSearchParams, async ({ query }) => {
    requests.push(query)
    return respond(query)
  }, responses, searchCurrency, nativeScopedPrice, toggleAttributeValue, SPEC_ATTRIBUTE_KEYS))
  return { ...page, route, router, requests, responses, stop: () => scope.stop(), select: async (value) => {
    page.onCountrySelect({ target: { value } })
    await nextTick()
  } }
}

test('marketplace deep links compose with country, facets and pagination, and reach matching offers', async () => {
  const page = await searchPage({ q: 'LEGO', platforms: 'Ebay,Vinted', country: 'FR', category: 'toys', attr_theme: ['City', 'Space'], attr_screen_size_min: '4', sort: 'price_asc' })
  try {
    const initial = page.buildSearchParams(0)
    assert.equal(initial.platforms, 'Ebay,Vinted', 'the initial SSR/client request reads the deep link')
    assert.equal(initial.country, 'FR')
    assert.equal(initial.category, 'toys')
    assert.equal(initial.sortBy, 'price_asc')
    assert.deepEqual(initial.attributes, ['theme:City', 'theme:Space', 'screen_size_min:4'])
    page.loadMore()
    await nextTick()
    assert.equal(page.requests.at(-1).offset, 2)
    assert.equal(page.requests.at(-1).platforms, initial.platforms)
    assert.equal(page.responses.at(-1).append, true)
    await page.loadAttributeValues('theme', 'Castle')
    assert.equal(page.requests.at(-1).platforms, initial.platforms)
    assert.equal(page.requests.at(-1).country, 'FR')
    assert.equal(page.requests.at(-1).limit, 0)
    const destination = new URLSearchParams(page.buildProductLink().slice(1))
    assert.equal(destination.get('platforms'), 'Ebay,Vinted')
    assert.equal(destination.get('countries'), 'FR')
    assert.equal(destination.has('attr_screen_size_min'), false)
  }
  finally { page.stop() }
})

test('multiselect changes and history remove one source while preserving other filters', async () => {
  const query = { q: 'camera', platforms: 'Ebay,Vinted', country: 'FR', category: 'cameras', attr_color: ['black', 'silver'], sort: 'newest' }
  const page = await searchPage(query)
  try {
    page.togglePlatform('Ebay')
    await nextTick()
    assert.deepEqual(page.route.query, { ...query, platforms: 'Vinted' })
    assert.equal(page.requests.at(-1).platforms, 'Vinted')
    assert.equal(page.requests.at(-1).country, 'FR')
    await page.router.push({ query })
    assert.deepEqual(page.selectedPlatforms.value, ['Ebay', 'Vinted'])
    assert.equal(page.requests.at(-1).platforms, 'Ebay,Vinted')
    await page.select('DE')
    assert.equal(page.requests.at(-1).platforms, 'Ebay,Vinted')
    assert.equal(page.requests.at(-1).country, 'DE')
    page.togglePlatform('Ebay')
    await nextTick()
    page.togglePlatform('Vinted')
    await nextTick()
    const remaining = { ...query }
    delete remaining.platforms
    assert.deepEqual(page.route.query, { ...remaining, country: 'DE' })
    assert.equal('platforms' in page.requests.at(-1), false)
  }
  finally { page.stop() }
})

test('marketplace-only browsing offers reset; unknown counts stay unknown and selected sources stay editable', async () => {
  const page = await searchPage({ platforms: 'AutoScout24' })
  try {
    assert.equal(page.hasActiveFilters.value, true)
    assert.equal(page.availablePlatforms.value.length, 10)
    assert.equal(page.availablePlatforms.value.find(option => option.value === 'AutoScout24').count, undefined)
    page.platformBuckets.value = [{ value: 'Ebay', count: 7 }, { value: 'Vinted', count: 0 }]
    assert.equal(page.availablePlatforms.value.find(option => option.value === 'Ebay').count, 7)
    assert.equal(page.availablePlatforms.value.find(option => option.value === 'Vinted').count, 0)
    assert.equal(page.availablePlatforms.value.find(option => option.value === 'Blocket').count, undefined)
    page.clearAllFilters()
    await nextTick()
    assert.deepEqual(page.route.query, {})
    assert.equal(page.hasActiveFilters.value, false)
    assert.deepEqual(page.selectedPlatforms.value, [])
    assert.equal(page.availablePlatforms.value.length, 9)
  }
  finally { page.stop() }
})

test('product offer links preserve the source/country intersection without catalogue-only URL state', async () => {
  const page = await searchPage({ q: 'camera', platforms: 'Ebay', country: 'DE', category: 'cameras', attr_color: ['black', 'silver'], attr_screen_size_min: '4', price_max: '500', condition: 'used', sort: 'price_asc', unrelated: 'ignored' })
  try {
    assert.equal(page.buildProductLink(), '?price_currency=EUR&platforms=Ebay&countries=DE')
    const destination = Object.fromEntries(new URLSearchParams(page.buildProductLink().slice(1)))
    const offers = parseOfferFilterQuery(destination)
    assert.deepEqual(offers.platforms, ['Ebay'])
    assert.deepEqual(offers.countries, ['DE'])
    await page.select('')
    assert.equal(page.buildProductLink(), '?price_currency=EUR&platforms=Ebay', 'clearing country clears the destination country scope')
  }
  finally { page.stop() }
})

test('case-varied marketplace deep links select existing checkboxes and canonicalize requests and offer links', async () => {
  const page = await searchPage({ q: 'camera', platforms: 'ebay,Ebay,OLX,olx' })
  try {
    assert.deepEqual(page.selectedPlatforms.value, ['Ebay', 'OLX'])
    assert.equal(page.availablePlatforms.value.length, 9, 'case variants must not create additional checkbox choices')
    const checked = page.availablePlatforms.value.filter(option => page.selectedPlatforms.value.includes(option.value))
    assert.deepEqual(checked.map(option => option.value), ['Ebay', 'OLX'])
    assert.equal(page.buildSearchParams().platforms, 'Ebay,OLX')
    const destination = Object.fromEntries(new URLSearchParams(page.buildProductLink().slice(1)))
    assert.equal(destination.platforms, 'Ebay,OLX')
    assert.deepEqual(parseOfferFilterQuery(destination).platforms, ['Ebay', 'OLX'])
    page.togglePlatform('Ebay')
    await nextTick()
    assert.equal(page.requests.at(-1).platforms, 'OLX')
    assert.equal(page.route.query.platforms, 'OLX')
  }
  finally { page.stop() }
})

test('actual catalogue cards render native scoped prices, never legacy EUR fallbacks', async () => {
  const Vue = await import('vue')
  const { renderToString } = await import('vue/server-renderer')
  const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
  const price = source.match(/<div[^>]+data-testid="catalogue-price"[\s\S]*?<\/div>/)?.[0]
  const scope = source.match(/<p[^>]+data-testid="catalogue-price-scope"[\s\S]*?<\/p>/)?.[0]
  const formatPrice = source.match(/function formatPrice\(amount: number\) \{[\s\S]*?\n\}/)?.[0]
  assert(price && scope && formatPrice)
  const { descriptor } = parse(`<script setup lang="ts">const props = defineProps<{ product: object, language: string, currency: string }>(); const locale = { value: props.language }; const selectedPriceCurrency = Vue.ref(props.currency); const nativeScopedPrice = globalThis.__nativeScopedPrice; ${formatPrice}</script><template>${scope}${price}</template>`)
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'catalogue-price', inlineTemplate: true }).content)
    .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace('export default', 'return')
  globalThis.__nativeScopedPrice = nativeScopedPrice
  const component = new Function('Vue', code)(Vue)
  try {
    for (const language of ['en', 'de']) {
      const labels = JSON.parse(await readFile(new URL(`../locales/${language}.json`, import.meta.url), 'utf8'))
      for (const currency of ['EUR', 'GBP', 'SEK', 'PLN']) {
        for (const [scopedMinPrice, scopedPriceCurrency] of [[100, currency], [0, currency], [null, currency], [undefined, undefined], [100, 'USD']]) {
          const app = Vue.createSSRApp(component, { product: { minPrice: 999, scopedMinPrice, scopedPriceCurrency }, language, currency })
          app.config.globalProperties.$t = (key, args) => labels[key]?.replace('{currency}', args?.currency?.value ?? args?.currency)
          app.config.globalProperties.isIndividualOffer = isIndividualOffer
          const html = await renderToString(app)
          if (scopedMinPrice > 0 && scopedPriceCurrency === currency) assert(html.includes(new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency }).format(100)))
          else assert(html.includes(labels.checkPrice))
          assert(!html.includes('999'), 'legacy minPrice must never reach the native card')
        }
      }
    }
  }
  finally { delete globalThis.__nativeScopedPrice }
})

test('native currency defaults stay editable and money interaction pins them through markets, history, pagination and facets', async () => {
  const page = await searchPage({ q: 'camera', platforms: 'Blocket' })
  try {
    assert.equal(page.buildSearchParams().priceCurrency, 'SEK')
    page.pinPriceCurrency()
    await nextTick()
    assert.equal(page.route.query.price_currency, 'SEK')
    page.priceFilterMax.value = 500
    page.applyPriceFilter('max')
    await nextTick()
    page.togglePlatform('Blocket')
    await nextTick()
    page.togglePlatform('OLX')
    await nextTick()
    assert.equal(page.route.query.price_max, '500')
    assert.equal(page.buildSearchParams().priceCurrency, 'SEK')
    page.loadMore()
    await nextTick()
    assert.equal(page.requests.at(-1).priceCurrency, 'SEK')
    await page.loadAttributeValues('brand', 'Canon')
    assert.equal(page.requests.at(-1).priceCurrency, 'SEK')
    assert.equal(new URLSearchParams(page.buildProductLink().slice(1)).get('price_currency'), 'SEK')
    await page.router.push({ query: { q: 'camera', price_currency: 'GBP', price_max: '80', country: 'SE' } })
    assert.equal(page.buildSearchParams().priceCurrency, 'GBP')
    page.clearPriceFilter()
    await nextTick()
    assert.equal(page.route.query.price_currency, 'GBP')
    assert.equal(page.route.query.price_max, undefined)
    page.clearAllFilters()
    await nextTick()
    assert.deepEqual(page.route.query, { q: 'camera', price_currency: 'GBP' })
    page.onPriceCurrencySelect({ target: { value: 'PLN' } })
    await nextTick()
    assert.equal(page.requests.at(-1).priceCurrency, 'PLN')
  }
  finally { page.stop() }
})

test('actual catalogue and offer currency selects server-render the chosen native option before hydration', async () => {
  const Vue = await import('vue')
  const { renderToString } = await import('vue/server-renderer')
  for (const [file, binding] of [['../pages/search.vue', 'selectedPriceCurrency'], ['../components/product/OfferFilters.vue', 'state.priceCurrency || \'\'']]) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8')
    const control = source.match(new RegExp(`<select\\s+:value="${binding.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?<\\/select>`))?.[0]
    assert(control, `Actual currency control in ${file}`)
    const { descriptor } = parse(`<script setup lang="ts">const props = defineProps<{ currency: string }>(); const selectedPriceCurrency = Vue.ref(props.currency); const priceCurrencies = ['EUR', 'GBP', 'SEK', 'PLN']; const state = { priceCurrency: props.currency }; const onPriceCurrencySelect = () => {}; const emit = () => {};</script><template>${control}</template>`)
    const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'currency-select-ssr', inlineTemplate: true }).content)
      .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
      .replace('export default', 'return')
    const component = new Function('Vue', code)(Vue)
    for (const currency of ['SEK', 'PLN', 'GBP', 'EUR', ...(file.includes('OfferFilters') ? [''] : [])]) {
      const app = Vue.createSSRApp(component, { currency })
      app.config.globalProperties.$t = key => key
      const html = await renderToString(app)
      const selected = [...html.matchAll(/<option\b[^>]*>/g)].filter(match => /\bselected[\s=>]/.test(match[0]))
      assert.equal(selected.length, 1, `${file} ${currency}: ${html}`)
      assert.match(selected[0][0], currency ? new RegExp(`value="${currency}"`) : /\bvalue(?:="")?\s/)
    }
  }
})

test('LP and 2LP use the existing exact attribute flow with independent offers, native money and shared URLs', async () => {
  // Synthetic API boundary only: 2LP is an explicit pressing format of one offer, never an inferred multipack.
  const offers = [
    ...Array.from({ length: 5 }, (_, i) => ({ seoId: `lp-offer-${i}`, attributes: [{ key: 'format', value: 'LP' }] })),
    ...Array.from({ length: 5 }, (_, i) => ({ seoId: `two-lp-offer-${i}`, attributes: [{ key: 'format', value: '2LP' }] })),
    ...Array.from({ length: 3 }, (_, i) => ({ seoId: `unknown-offer-${i}`, attributes: [] })),
  ].map(offer => ({ ...offer, scopedMinPrice: 100, scopedPriceCurrency: 'SEK' }))
  const buckets = [{ value: 'LP', count: 5 }, { value: '2LP', count: 5 }]
  const respond = async (query) => {
    const values = (query.attributes ?? []).filter(value => value.startsWith('format:')).map(value => value.slice('format:'.length))
    const products = values.length ? offers.filter(offer => offer.attributes.some(attribute => attribute.key === 'format' && values.includes(attribute.value))) : offers
    return { products, total: products.length, priceCurrency: 'SEK', priceMin: 100, priceMax: 100, attributeBuckets: { format: buckets } }
  }
  const query = { category: 'vinyl', includeIndividualOffers: 'true', platforms: 'Blocket', country: 'SE', price_currency: 'SEK', price_max: '500' }
  const page = await searchPage(query, respond)
  let reloaded
  try {
    await page.performSearch()
    assert.equal(page.allProducts.value.length, 13)
    assert.deepEqual(page.allProducts.value.map(offer => offer.seoId), offers.map(offer => offer.seoId), 'all independent IDs are preserved without creating a set or pressing group')
    assert.deepEqual(page.availableAttributeBuckets.value.format, buckets, 'use the API coverage-qualified format buckets unchanged')
    assert.equal(page.allProducts.value.filter(offer => offer.attributes.length === 0).length, 3, 'unknown formats stay unknown')
    page.toggleAttributeFilter('format', '2LP')
    await nextTick()
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(page.route.query.attr_format, '2LP')
    const request = page.requests.at(-1)
    assert.deepEqual(request.attributes, ['format:2LP'])
    assert.equal(request.category, 'vinyl')
    assert.equal(request.includeIndividualOffers, 'true')
    assert.equal(request.priceCurrency, 'SEK')
    assert.equal(request.maxPrice, 500)
    assert.deepEqual(page.allProducts.value.map(offer => offer.seoId), offers.slice(5, 10).map(offer => offer.seoId), 'only the five exact 2LP independent offer IDs survive')
    assert.equal(new Set(page.allProducts.value.map(offer => offer.seoId)).size, 5)
    const destination = new URLSearchParams(page.buildProductLink().slice(1))
    assert.equal(destination.get('price_currency'), 'SEK')
    assert.equal(destination.has('attr_format'), false, 'catalogue-only format is not invented as an offer-endpoint filter')
    await page.loadAttributeValues('format', 'LP')
    assert.equal(page.requests.at(-1).facetKey, 'format')
    assert.equal(page.requests.at(-1).facetQuery, 'LP')
    assert.equal(page.requests.at(-1).priceCurrency, 'SEK')
    assert.deepEqual(page.requests.at(-1).attributes, [], 'format discovery removes only its own exact-value selection')
    const shared = new URLSearchParams(page.route.query)
    reloaded = await searchPage(Object.fromEntries(shared), respond)
    await reloaded.performSearch()
    assert.deepEqual(reloaded.activeAttributeFilters.value.format, ['2LP'])
    assert.deepEqual(reloaded.buildSearchParams().attributes, ['format:2LP'])
    assert.deepEqual(reloaded.allProducts.value.map(offer => offer.seoId), offers.slice(5, 10).map(offer => offer.seoId))
    await page.router.push({ query })
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(page.allProducts.value.length, 13, 'history restores all independent offers including three unknowns')
    page.toggleAttributeFilter('format', 'LP')
    await nextTick()
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(page.allProducts.value.map(offer => offer.seoId), offers.slice(0, 5).map(offer => offer.seoId), 'LP never substring-matches 2LP')
    page.removeAttributeFilter('format')
    await nextTick()
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(page.route.query.attr_format, undefined)
    assert.equal(page.route.query.price_currency, 'SEK')
    assert.equal(page.route.query.price_max, '500')
    assert.equal(page.allProducts.value.length, 13)
  }
  finally {
    page.stop()
    reloaded?.stop()
  }
})
