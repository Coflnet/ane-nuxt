import { searchCurrency } from '../utils/searchCurrency.ts'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { computed, effectScope, nextTick, reactive, ref, watch } from 'vue'
import { searchRouteQuery } from '../utils/searchQuery.ts'
import { parseOfferFilterQuery } from '../utils/offerFilters.ts'
import { attributeValues } from '../utils/facetSearch.ts'
import { partFormFromQuery } from '../utils/partSearch.ts'

const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
const functionSource = name => source.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n}`))[0]

function searchState(query) {
  const route = reactive({ query })
  const requests = []
  const state = {
    route, computed, watch, searchCurrency, searchRouteQuery, attributeValues, parseOfferFilterQuery, toUrlSlug: slug => slug, PAGE_SIZE: 24, prevQuery: {},
    router: { push({ query }) { route.query = query } },
    buildSpecApiFilters: () => [], manualLoading: ref(false), searchError: ref(false),
    interpretation: ref(null), allProducts: ref([]), hasSearched: ref(true), totalResults: ref(0),
    platformBuckets: ref([]), storeBuckets: ref([]), categoryBuckets: ref([]), conditionBuckets: ref([]), attributeBuckets: ref({}), distanceFilterKm: ref(50),
  }
  for (const name of ['selectedCategory', 'selectedCondition', 'selectedMinPrice', 'selectedMaxPrice', 'selectedSort', 'userLocation', 'selectedMaxDistance', 'selectedCountryCode', 'selectedBatteryMin', 'selectedBatteryMax']) state[name] = ref(undefined)
  state.activeAttributeFilters = ref({})
  const code = [
    source.match(/const selectedStore = computed[^\n]*/)[0],
    source.match(/const searchQuery = computed[^\n]*/)[0],
    source.match(/const selectedPlatforms = computed[^\n]*/)[0],
    source.match(/const selectedPriceCurrency = computed[^\n]*/)[0],
    source.match(/const includePartOffers = computed[^\n]*/)[0],
    source.match(/const includeIndividualOffers = computed[^\n]*/)[0],
    ...['routeHasSearchQuery', 'syncPrevQuery', 'buildSearchParams', 'queryWithoutKeys', 'includeIndividualOffersInSearch', 'toggleIndividualOffers', 'toggleFilter', 'clearAllFilters', 'onSearch', 'onSearchCategorySelect'].map(functionSource),
    'let searchSeq = 0; function performSearch() { requests.push(buildSearchParams()) }; syncPrevQuery()',
    source.match(/\/\/ Watch route query changes and trigger search\n(watch\([\s\S]*?\n\}\))/)[1],
    'return { includePartOffers, includeIndividualOffers, includeIndividualOffersInSearch, toggleIndividualOffers, toggleFilter, clearAllFilters, onSearch, onSearchCategorySelect, buildSearchParams }',
  ].join('\n')
  const scope = effectScope()
  const bindings = scope.run(() => new Function('state', 'requests', `with (state) { ${stripTypeScriptTypes(`function setup() { ${code} }`)}; return setup() }`)(state, requests))
  return { ...bindings, route, requests, stop: () => scope.stop() }
}

test('individual part offers require an explicit URL choice and survive sharing and history', async () => {
  const state = searchState({ q: 'Getriebe' })
  try {
    assert.equal(state.includePartOffers.value, false)
    assert.equal(state.buildSearchParams().includePartOffers, undefined)
    state.toggleFilter('includePartOffers', 'true')
    await nextTick()
    assert.equal(state.route.query.q, 'Getriebe')
    assert.equal(state.includePartOffers.value, true)
    assert.equal(state.requests.at(-1).includePartOffers, 'true')
    const shared = Object.fromEntries(new URLSearchParams(state.route.query))
    state.route.query = { q: 'Getriebe' } // Back
    await nextTick()
    assert.equal(state.includePartOffers.value, false)
    assert.equal(state.requests.at(-1).includePartOffers, undefined)
    state.route.query = shared // Forward / shared URL
    await nextTick()
    assert.equal(state.requests.at(-1).includePartOffers, 'true')
    state.onSearchCategorySelect('parts')
    await nextTick()
    assert.deepEqual(state.route.query, { category: 'parts', includePartOffers: 'true' })
    state.onSearch('  Lager  ')
    await nextTick()
    assert.deepEqual(state.route.query, { q: 'Lager', includePartOffers: 'true' })
    state.clearAllFilters()
    await nextTick()
    assert.deepEqual(state.route.query, { q: 'Lager' })
    assert.equal(state.requests.at(-1).includePartOffers, undefined)
  }
  finally { state.stop() }
})

test('a flag-only shared link searches and false or malformed flags keep normal search', async () => {
  const state = searchState({ q: 'Getriebe' })
  try {
    state.route.query = searchRouteQuery('', true)
    await nextTick()
    assert.deepEqual(state.requests.at(-1), { offset: 0, limit: 24, priceCurrency: 'EUR', includePartOffers: 'true' })
    for (const value of ['false', '1', ['true']]) {
      state.route.query = { q: 'Getriebe', includePartOffers: value }
      await nextTick()
      assert.equal(state.includePartOffers.value, false)
      assert.equal(state.buildSearchParams().includePartOffers, undefined)
    }
  }
  finally { state.stop() }
})

test('the explicit parts catalogue link carries editable form text and includes individual offers', async () => {
  const parts = await readFile(new URL('../pages/parts.vue', import.meta.url), 'utf8')
  const expression = parts.match(/data-testid="parts-individual-offers"/)
  assert.ok(expression)
  const queries = [...parts.matchAll(/query: (searchRouteQuery\(form\.q \|\| form\.partNumber \|\| form\.machine, true\))/g)]
  assert.equal(queries.length, 1, 'the broad catalogue link remains separate from in-form empty-state recovery')
  const query = new Function('form', 'searchRouteQuery', `return ${queries[0][1]}`)
  const form = partFormFromQuery({ q: '  Getriebe  ', partNumber: '6203' })
  assert.deepEqual(query(form, searchRouteQuery), { q: 'Getriebe', includePartOffers: 'true' })
  form.q = ''
  assert.equal(query(form, searchRouteQuery).q, '6203')
  form.partNumber = ''
  form.machine = 'Traktor'
  assert.equal(query(form, searchRouteQuery).q, 'Traktor')
  form.machine = ''
  assert.deepEqual(query(form, searchRouteQuery), { includePartOffers: 'true' })
})

test('individual-offer recovery preserves all URL criteria, sharing, history and explicit legacy choice', async () => {
  const criteria = { q: 'Der Rote Korsar', category: 'ane-comics', condition: 'used', price_min: '5', price_max: '50', sort: 'price_asc', platforms: 'Ebay,Vinted', country: 'DE', zip: '10115', max_distance: '20', attr_series: ['Der Rote Korsar', 'Tintin'], attr_language: 'German' }
  const state = searchState(criteria)
  try {
    state.toggleIndividualOffers()
    await nextTick()
    assert.deepEqual(state.route.query, { ...criteria, includeIndividualOffers: 'true' })
    assert.equal(state.requests.at(-1).includeIndividualOffers, 'true')
    const shared = structuredClone({ ...state.route.query, attr_series: [...state.route.query.attr_series] })
    state.route.query = criteria
    await nextTick()
    assert.equal(state.requests.at(-1).includeIndividualOffers, undefined)
    state.route.query = shared
    await nextTick()
    assert.equal(state.requests.at(-1).includeIndividualOffers, 'true')
    state.toggleIndividualOffers()
    await nextTick()
    assert.deepEqual(state.route.query, criteria)
    state.route.query = { ...criteria, includePartOffers: 'true' }
    await nextTick()
    state.toggleIndividualOffers()
    await nextTick()
    assert.deepEqual(state.route.query, criteria, 'one visible switch disables legacy opt-in too')
    state.route.query = { ...criteria, includePartOffers: 'true' }
    await nextTick()
    state.includeIndividualOffersInSearch()
    await nextTick()
    assert.deepEqual(state.route.query, { ...criteria, includeIndividualOffers: 'true' }, 'legacy empty-state recovery explicitly upgrades scope')
    for (const value of ['false', '1', ['true']]) {
      state.route.query = { ...criteria, includeIndividualOffers: value }
      await nextTick()
      assert.equal(state.requests.at(-1).includeIndividualOffers, undefined)
    }
  }
  finally { state.stop() }
})

for (const locale of ['en', 'de']) {
  test(`${locale} tool-offer guidance renders in the existing checkbox and recovery without enabling the option`, async () => {
    const Vue = await import('vue')
    const { renderToString } = await import('vue/server-renderer')
    const messages = JSON.parse(await readFile(new URL(`../locales/${locale}.json`, import.meta.url), 'utf8'))
    const checkboxAt = source.indexOf('data-testid="include-individual-offers"')
    const recoveryAt = source.indexOf('data-testid="include-individual-offers-recovery"')
    const checkbox = source.slice(source.lastIndexOf('<label', checkboxAt), source.indexOf('</label>', checkboxAt) + 8)
    const recovery = source.slice(source.lastIndexOf('<button', recoveryAt), source.indexOf('</button>', recoveryAt) + 9)
    const criteria = { q: 'Knipex', country: 'DE', platforms: 'Kleinanzeigen', price_currency: 'EUR', price_max: '200' }
    const state = searchState(criteria)
    try {
      const app = Vue.createSSRApp({
        render: Vue.compile(`<section>${checkbox}${recovery}</section>`),
        setup: () => ({
          includeIndividualOffers: state.includeIndividualOffers, includePartOffers: state.includePartOffers,
          toggleIndividualOffers: state.toggleIndividualOffers, includeIndividualOffersInSearch: state.includeIndividualOffersInSearch,
        }),
      })
      app.config.globalProperties.$t = key => messages[key] || key
      const html = await renderToString(app)
      assert.equal(html.split(messages.includeIndividualOffers).length - 1, 2, 'Checkbox and recovery use the same action label')
      assert.match(messages.includeIndividualOffers, locale === 'en' ? /more tools/i : /mehr werkzeuge/i)
      assert.match(html, locale === 'en' ? /tools with few offers/i : /Werkzeuge mit wenigen Angeboten/)
      assert(!/<input[^>]*\schecked[=>\s]/.test(html))
      assert.deepEqual(state.route.query, criteria)
      assert.equal(state.includeIndividualOffers.value, false)
      assert.deepEqual(state.requests, [])
    }
    finally { state.stop() }
  })
}

test('empty photo and measurement searches return to editable criteria without a broad catalogue request', async () => {
  const { compile } = await import('@vue/compiler-dom')
  const { parse } = await import('@vue/compiler-sfc')
  const Vue = await import('vue')
  const { renderToString } = await import('@vue/server-renderer')
  const parts = await readFile(new URL('../pages/parts.vue', import.meta.url), 'utf8')
  const template = parse(parts).descriptor.template.content
  const render = new Function('Vue', compile(template, { mode: 'function', isCustomElement: tag => tag === 'NuxtLink' }).code)(Vue)
  for (const query of [
    { class: 'gear', teeth: '43', boreMm: '8.5', outerDiameterMm: '44' },
    { class: 'gear', mode: 'fragment', teeth_observed: '8', arc_degrees: '125', boreMm: '8.5' },
    { class: 'bearing', part_key: '6203-2RS', innerDiameterMm: '17', outerDiameterMm: '40', widthMm: '12' },
  ]) {
    const form = partFormFromQuery(query)
    const before = { ...form }
    const state = {
      t: key => key, localePath: value => value, searchRouteQuery, form, examples: [], partClasses: [], identityFields: ['part_key'],
      measurementFields: Object.keys(query).filter(key => !['class', 'mode', 'part_key'].includes(key)), toothed: form.class === 'gear',
      photoBase64: 'synthetic-photo', photoPreview: 'blob:synthetic', photoEstimate: null, photoError: '', photoLoading: false,
      hasSearched: true, results: { items: [] }, loading: false, error: '',
      clearInferred() {}, onClassChange() {}, choosePhoto() {}, analyzePhoto() {},
      search() { throw new Error('Recovery must preserve criteria without submitting a broad search') },
      reset() { throw new Error('Recovery must preserve criteria without resetting the form') },
    }
    const html = await renderToString(Vue.createSSRApp({ render: () => render(state, []) }))
    const empty = html.split('data-testid="parts-empty"')[1]
    const href = empty?.match(/<a[^>]+href="(#[^"]+)"/)?.[1]
    assert.ok(href, 'empty-state action returns within the current form')
    assert.match(html, new RegExp(`id="${href.slice(1)}"[^>]*tabindex="-1"`), 'local destination is focusable')
    assert.match(empty, /parts.reviewMeasurements/)
    assert.ok(!empty.includes('/search'), 'empty recovery cannot silently discard numeric constraints')
    assert.deepEqual(form, before)
    assert.match(html, /src="blob:synthetic"/, 'the selected photo remains available')
    for (const key of state.measurementFields) {
      assert.match(html, new RegExp(`data-testid="parts-${key}"[^>]*value="${query[key]}"`))
    }
  }
})
