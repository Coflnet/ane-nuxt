import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { compileScript, parse } from 'vue/compiler-sfc'
import { computed, effectScope, nextTick, reactive, ref, watch } from 'vue'
import { activeMarketplaces } from '../constants/CreateFilterConstants.ts'
import { parseOfferFilterQuery } from '../utils/offerFilters.ts'
import { attributeValues, facetSearchParams } from '../utils/facetSearch.ts'
import { buildSpecApiFilters, SPEC_RANGE_PARAMS } from '../utils/specFilters.ts'

// Execute the actual page declarations, watcher and handlers. Only unrelated UI state and
// navigation/network boundaries are replaced; marketplace/filter logic comes from the SFC AST.
async function searchPage(query) {
  const { descriptor } = parse(await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8'))
  const ast = compileScript(descriptor, { id: 'search-marketplaces' }).scriptSetupAst
  const declarations = new Set(['searchQuery', 'includePartOffers', 'includeIndividualOffers', 'selectedCategory', 'selectedCondition', 'selectedPlatforms', 'selectedMinPrice', 'selectedMaxPrice', 'selectedSort', 'selectedMaxDistance', 'activeAttributeFilters', 'hasActiveFilters', 'selectedCountryCode', 'prevQuery', 'platformBuckets', 'availablePlatforms'])
  const functions = new Set(['routeHasSearchQuery', 'syncPrevQuery', 'onCountrySelect', 'clearAllFilters', 'buildSearchParams', 'togglePlatform', 'queryWithoutKeys', 'buildProductLink', 'loadAttributeValues', 'loadMore', 'performSearch'])
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
  const requests = [], responses = []
  let page
  const scope = effectScope()
  const factory = new Function('ref', 'computed', 'reactive', 'watch', 'route', 'router', 'attributeValues', 'buildSpecApiFilters', 'SPEC_RANGE_PARAMS', 'parseOfferFilterQuery', 'activeMarketplaces', 'facetSearchParams', 'searchProducts', 'responses', `
    const userLocation = ref(null), selectedBatteryMin = ref(), selectedBatteryMax = ref();
    const hasSpecRangeSelection = ref(false), hasSearched = ref(true), distanceFilterKm = ref(50);
    const PAGE_SIZE = 20, urlToNumeric = ref({}), germanLabelBySlug = ref({});
    const resolveSearchCategoryParam = value => value;
    let searchSeq = 0;
    const loadingMore = ref(false); const manualLoading = ref(false), searchError = ref(false), interpretation = ref(null);
    const allProducts = ref([{ id: 1 }, { id: 2 }]), totalResults = ref(0), categoryBuckets = ref([]), conditionBuckets = ref([]), attributeBuckets = ref({});
    function applySearchResponse(response, append) { responses.push({ response, append }) }
    ${stripTypeScriptTypes(code).replace('import.meta.server', 'false')}
    syncPrevQuery();
    return { selectedCountryCode, selectedPlatforms, availablePlatforms, platformBuckets, hasActiveFilters, onCountrySelect, clearAllFilters, buildSearchParams, togglePlatform, buildProductLink, loadAttributeValues, loadMore };
  `)
  page = scope.run(() => factory(ref, computed, reactive, watch, route, router, attributeValues, buildSpecApiFilters, SPEC_RANGE_PARAMS, parseOfferFilterQuery, activeMarketplaces, facetSearchParams, async ({ query }) => {
    requests.push(query)
    return {}
  }, responses))
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
    assert.equal(page.buildProductLink(), '?platforms=Ebay&countries=DE')
    const destination = Object.fromEntries(new URLSearchParams(page.buildProductLink().slice(1)))
    const offers = parseOfferFilterQuery(destination)
    assert.deepEqual(offers.platforms, ['Ebay'])
    assert.deepEqual(offers.countries, ['DE'])
    await page.select('')
    assert.equal(page.buildProductLink(), '?platforms=Ebay', 'clearing country clears the destination country scope')
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

test('actual catalogue cards distinguish product-wide EUR references from unavailable prices in both languages', async () => {
  const Vue = await import('vue')
  const { renderToString } = await import('vue/server-renderer')
  const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
  const price = source.match(/<div[^>]+data-testid="catalogue-price"[\s\S]*?<\/div>/)?.[0]
  const scope = source.match(/<p[^>]+data-testid="catalogue-price-scope"[\s\S]*?<\/p>/)?.[0]
  assert(price && scope, 'Actual cards and filters must disclose the product-wide price scope')
  const formatPrice = source.match(/function formatPrice\(amount: number\) \{[\s\S]*?\n\}/)?.[0]
  assert(formatPrice)
  const { descriptor } = parse(`<script setup lang="ts">const props = defineProps<{ product: { minPrice?: number | null }, language: string }>(); const locale = { value: props.language }; ${formatPrice}</script><template>${scope}${price}</template>`)
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'catalogue-price', inlineTemplate: true }).content)
    .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace('export default', 'return')
  const component = new Function('Vue', code)(Vue)
  for (const language of ['en', 'de']) {
    const labels = JSON.parse(await readFile(new URL(`../locales/${language}.json`, import.meta.url), 'utf8'))
    assert.match(labels.cataloguePriceReference, /EUR/)
    assert.match(labels.cataloguePriceScope, language === 'en' ? /price filters.*across marketplaces and countries.*original currencies/ : /Preisfilter.*Marktplätze und Länder.*Originalwährungen/)
    for (const minPrice of [100, 0, null, undefined]) {
      const app = Vue.createSSRApp(component, { product: { minPrice }, language })
      app.config.globalProperties.$t = key => labels[key]
      const html = await renderToString(app)
      assert(html.includes(labels.cataloguePriceScope))
      if (minPrice) {
        assert(html.includes(labels.cataloguePriceReference))
        assert(html.includes(new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' }).format(minPrice)))
        assert(!html.includes(labels.startingFrom))
      }
      else {
        assert(html.includes(labels.checkPrice))
        assert(!html.includes(labels.cataloguePriceReference))
        assert(!html.includes('€'), 'Unknown or zero EUR aggregate must never present a free offer')
      }
    }
  }
})
