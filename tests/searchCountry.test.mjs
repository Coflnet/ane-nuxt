import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { compileScript, parse } from 'vue/compiler-sfc'
import { computed, effectScope, nextTick, reactive, ref, watch } from 'vue'
import { parseOfferFilterQuery } from '../utils/offerFilters.ts'
import { attributeValues } from '../utils/facetSearch.ts'
import { buildSpecApiFilters, SPEC_RANGE_PARAMS } from '../utils/specFilters.ts'

// Execute the actual page declarations, watcher and handlers. Only unrelated UI state and
// navigation/network boundaries are replaced; country/filter logic comes from the SFC AST.
async function searchPage(query) {
  const { descriptor } = parse(await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8'))
  const ast = compileScript(descriptor, { id: 'search-country' }).scriptSetupAst
  const declarations = new Set(['searchQuery', 'includePartOffers', 'includeIndividualOffers', 'selectedCategory', 'selectedCondition', 'selectedPlatforms', 'selectedMinPrice', 'selectedMaxPrice', 'selectedSort', 'selectedMaxDistance', 'activeAttributeFilters', 'hasActiveFilters', 'selectedCountryCode', 'prevQuery'])
  const functions = new Set(['routeHasSearchQuery', 'syncPrevQuery', 'onCountrySelect', 'clearAllFilters', 'buildSearchParams'])
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
  const requests = []
  let page
  const scope = effectScope()
  const factory = new Function('ref', 'computed', 'reactive', 'watch', 'route', 'router', 'performSearch', 'attributeValues', 'buildSpecApiFilters', 'SPEC_RANGE_PARAMS', 'parseOfferFilterQuery', `
    const userLocation = ref(null), selectedBatteryMin = ref(), selectedBatteryMax = ref();
    const hasSpecRangeSelection = ref(false), hasSearched = ref(true), distanceFilterKm = ref(50);
    const PAGE_SIZE = 20, urlToNumeric = ref({}), germanLabelBySlug = ref({});
    const resolveSearchCategoryParam = value => value;
    let searchSeq = 0;
    const manualLoading = ref(false), searchError = ref(false), interpretation = ref(null);
    const allProducts = ref([]), totalResults = ref(0), categoryBuckets = ref([]), conditionBuckets = ref([]), platformBuckets = ref([]), attributeBuckets = ref({});
    ${stripTypeScriptTypes(code)}
    syncPrevQuery();
    return { selectedCountryCode, hasActiveFilters, onCountrySelect, clearAllFilters, buildSearchParams };
  `)
  page = scope.run(() => factory(ref, computed, reactive, watch, route, router, () => requests.push(page.buildSearchParams()), attributeValues, buildSpecApiFilters, SPEC_RANGE_PARAMS, parseOfferFilterQuery))
  return { ...page, route, router, requests, stop: () => scope.stop(), select: async (value) => {
    page.onCountrySelect({ target: { value } })
    await nextTick()
  } }
}

test('changing country requests the actual new scope and preserves other URL filters', async () => {
  const query = { q: 'Jacke', category: 'clothing', attr_size: ['M', 'L'], price_max: '80', sort: 'price_asc' }
  const page = await searchPage(query)
  try {
    await page.select('FR')
    assert.deepEqual(page.route.query, { ...query, country: 'FR' })
    assert.equal(page.requests.length, 1, 'country-only navigation must refresh results')
    assert.equal(page.requests[0].country, 'FR')
    assert.deepEqual(page.requests[0].attributes, ['size:M', 'size:L'])
    assert.equal(page.requests[0].maxPrice, 80)
    await page.select('')
    assert.deepEqual(page.route.query, query, 'Any country clears only the country parameter')
    assert.equal(page.selectedCountryCode.value, '')
    assert.equal(page.requests.length, 2)
    assert.ok(!('country' in page.requests[1]))
  }
  finally { page.stop() }
})

test('history navigation restores the country control and request scope from the URL', async () => {
  const query = { q: 'LEGO', attr_theme: ['City', 'Space'], country: 'FR' }
  const page = await searchPage(query)
  try {
    await page.router.push({ query: { ...query, country: 'DE' } })
    assert.equal(page.selectedCountryCode.value, 'DE')
    assert.equal(page.requests.at(-1)?.country, 'DE')
    await page.router.push({ query })
    assert.equal(page.selectedCountryCode.value, 'FR')
    assert.equal(page.requests.at(-1)?.country, 'FR')
    assert.deepEqual(page.route.query.attr_theme, ['City', 'Space'])
    await page.router.push({ query: { q: 'LEGO', attr_theme: ['City', 'Space'] } })
    assert.equal(page.selectedCountryCode.value, '')
    assert.ok(!('country' in page.requests.at(-1)))
  }
  finally { page.stop() }
})

test('country alone exposes reset and clearing all filters clears the request scope', async () => {
  const page = await searchPage({ q: 'vinyl', country: 'FR' })
  try {
    assert.equal(page.hasActiveFilters.value, true)
    page.clearAllFilters()
    await nextTick()
    assert.deepEqual(page.route.query, { q: 'vinyl' })
    assert.equal(page.selectedCountryCode.value, '')
    assert.equal(page.hasActiveFilters.value, false)
    assert.equal(page.requests.length, 1)
    assert.ok(!('country' in page.requests[0]))
  }
  finally { page.stop() }
})

test('actual country control server-renders the URL country before hydration with an associated label', async () => {
  const Vue = await import('vue')
  const { renderToString } = await import('vue/server-renderer')
  const { countryName } = await import('../utils/countryDetection.ts')
  const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
  const control = source.slice(source.indexOf('<!-- Country shortcut -->') + '<!-- Country shortcut -->'.length, source.indexOf('<!-- ZIP code input:'))
  assert(control.includes(':value="selectedCountryCode"'))
  const { descriptor } = parse(`<script setup lang="ts">defineProps<{ selectedCountryCode: string }>(); const locale = 'en'; const countryName = __countryName; const onCountrySelect = () => {};</script><template>${control}</template>`)
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'country-select-ssr', inlineTemplate: true }).content)
    .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace('export default', 'return')
  const component = new Function('Vue', '__countryName', code)(Vue, countryName)
  for (const country of ['SE', 'PL', 'GB']) {
    const page = await searchPage({ q: 'camera', country })
    try {
      assert.equal(page.buildSearchParams().country, country)
      const app = Vue.createSSRApp(component, { selectedCountryCode: page.selectedCountryCode.value })
      app.config.globalProperties.$t = (_, fallback) => fallback
      const html = await renderToString(app)
      const selected = [...html.matchAll(/<option\b[^>]*>/g)].filter(m => /\bselected[\s=>]/.test(m[0]))
      assert.equal(selected.length, 1, html)
      assert.match(selected[0][0], new RegExp(`value="${country}"`))
      const id = html.match(/<select\b[^>]+\bid="([^"]+)"/)?.[1]
      assert(id, 'Country select must have an ID')
      assert(html.includes(`for="${id}"`), 'Visible Country label must name the select')
    }
    finally { page.stop() }
  }
})
