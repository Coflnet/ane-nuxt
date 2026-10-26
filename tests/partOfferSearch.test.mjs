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
    route, computed, watch, searchRouteQuery, attributeValues, parseOfferFilterQuery, toUrlSlug: slug => slug, PAGE_SIZE: 24, prevQuery: {},
    router: { push({ query }) { route.query = query } },
    buildSpecApiFilters: () => [], manualLoading: ref(false), searchError: ref(false),
    interpretation: ref(null), allProducts: ref([]), hasSearched: ref(true), totalResults: ref(0),
    platformBuckets: ref([]), categoryBuckets: ref([]), conditionBuckets: ref([]), attributeBuckets: ref({}), distanceFilterKm: ref(50),
  }
  for (const name of ['selectedCategory', 'selectedCondition', 'selectedMinPrice', 'selectedMaxPrice', 'selectedSort', 'userLocation', 'selectedMaxDistance', 'selectedCountryCode', 'selectedBatteryMin', 'selectedBatteryMax']) state[name] = ref(undefined)
  state.activeAttributeFilters = ref({})
  const code = [
    source.match(/const searchQuery = computed[^\n]*/)[0],
    source.match(/const selectedPlatforms = computed[^\n]*/)[0],
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
    assert.deepEqual(state.requests.at(-1), { offset: 0, limit: 24, includePartOffers: 'true' })
    for (const value of ['false', '1', ['true']]) {
      state.route.query = { q: 'Getriebe', includePartOffers: value }
      await nextTick()
      assert.equal(state.includePartOffers.value, false)
      assert.equal(state.buildSearchParams().includePartOffers, undefined)
    }
  }
  finally { state.stop() }
})

test('parts catalogue links carry editable form text and explicitly include individual offers', async () => {
  const parts = await readFile(new URL('../pages/parts.vue', import.meta.url), 'utf8')
  const expression = parts.match(/data-testid="parts-individual-offers"/)
  assert.ok(expression)
  const queries = [...parts.matchAll(/query: (searchRouteQuery\(form\.q \|\| form\.partNumber \|\| form\.machine, true\))/g)]
  assert.equal(queries.length, 2, 'main link and empty-state recovery share the same search')
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
