import assert from 'node:assert/strict'
import test from 'node:test'
import {
  activeQuickAction,
  applyNearby,
  buildMatchesParams,
  buildOfferFilterQuery,
  buildSimilarSearchQuery,
  emptyOfferFilter,
  extractApiErrorMessage,
  hasActiveOfferFilter,
  parseOfferFacets,
  parseOfferFilterQuery,
  toggleListValue,
  toggleQuickAction,
} from '../utils/offerFilters.ts'
import { buildProductResourceUrl } from '../utils/productApiUrl.ts'
import { parseStoredPosition, serializePosition } from '../utils/geoPosition.ts'

test('an empty query means no filter and no quick action', () => {
  const state = parseOfferFilterQuery({})
  assert.deepEqual(state, emptyOfferFilter())
  assert.equal(hasActiveOfferFilter(state), false)
  assert.equal(activeQuickAction(state, 'DE'), null)
})

test('query is parsed and written back symmetrically', () => {
  const query = { platforms: 'Vinted,Ebay', countries: 'de,AT', shipping: 'true', lat: '52.5', lon: '13.4', max_distance: '50', q: 'keep' }
  const state = parseOfferFilterQuery(query)
  assert.deepEqual(state.platforms, ['Vinted', 'Ebay'])
  assert.deepEqual(state.countries, ['DE', 'AT'])
  assert.equal(state.shipping, true)
  assert.equal(state.lat, 52.5)
  assert.equal(state.maxDistance, 50)
  assert.deepEqual(buildOfferFilterQuery(state, query), {
    q: 'keep', platforms: 'Vinted,Ebay', countries: 'DE,AT', shipping: 'true', lat: '52.5', lon: '13.4', max_distance: '50',
  })
})

test('building the query drops stale filter keys and empty values', () => {
  const query = buildOfferFilterQuery(emptyOfferFilter(), { zip: '10115', lat: '1', max_distance: '50', tab: 'x' })
  assert.deepEqual(query, { tab: 'x' })
})

test('garbage numbers are ignored', () => {
  const state = parseOfferFilterQuery({ lat: 'abc', lon: '1', max_distance: '-3' })
  assert.equal(state.lat, undefined)
  assert.equal(state.maxDistance, undefined)
})

test('my country quick action toggles on and off', () => {
  const on = toggleQuickAction(emptyOfferFilter(), 'country', 'AT')
  assert.deepEqual(on.countries, ['AT'])
  assert.equal(activeQuickAction(on, 'AT'), 'country')
  const off = toggleQuickAction(on, 'country', 'AT')
  assert.deepEqual(off, emptyOfferFilter())
})

test('only one quick action is active: eu replaces country and nearby', () => {
  let state = toggleQuickAction(emptyOfferFilter(), 'country', 'DE')
  state = toggleQuickAction(state, 'eu', 'DE')
  assert.deepEqual(state.countries, ['EU'])
  assert.equal(state.shipping, true)
  assert.equal(activeQuickAction(state, 'DE'), 'eu')
  state = applyNearby(state, { zip: '10115', zipCountry: 'DE' })
  assert.equal(activeQuickAction(state, 'DE'), 'nearby')
  assert.deepEqual(state.countries, [])
  assert.equal(state.shipping, false)
  state = toggleQuickAction(state, 'country', 'DE')
  assert.equal(activeQuickAction(state, 'DE'), 'country')
  assert.equal(state.zip, '')
  assert.equal(state.maxDistance, undefined)
})

test('quick actions keep the marketplace selection', () => {
  const base = { ...emptyOfferFilter(), platforms: ['Vinted'] }
  assert.deepEqual(toggleQuickAction(base, 'country', 'DE').platforms, ['Vinted'])
  assert.deepEqual(toggleQuickAction(toggleQuickAction(base, 'eu', 'DE'), 'eu', 'DE').platforms, ['Vinted'])
})

test('nearby by coordinates uses 50 km and is active', () => {
  const state = applyNearby(emptyOfferFilter(), { lat: 1, lon: 2 })
  assert.equal(state.maxDistance, 50)
  assert.equal(activeQuickAction(state, 'DE'), 'nearby')
})

test('country picked in the multi select that is not the own country is no quick action', () => {
  const state = { ...emptyOfferFilter(), countries: ['FR'] }
  assert.equal(activeQuickAction(state, 'DE'), null)
  assert.equal(hasActiveOfferFilter(state), true)
})

test('toggleListValue adds and removes', () => {
  assert.deepEqual(toggleListValue(['a'], 'b'), ['a', 'b'])
  assert.deepEqual(toggleListValue(['a', 'b'], 'a'), ['b'])
})

test('matches url carries the new filter parameters', () => {
  const state = { ...emptyOfferFilter(), platforms: ['Vinted', 'Ebay'], countries: ['EU'], shipping: true, zip: '1011', zipCountry: 'NL', maxDistance: 50 }
  const url = buildProductResourceUrl('https://api', '7', 'matches', buildMatchesParams(state))
  const params = new URL(url).searchParams
  assert.equal(params.get('platforms'), 'Vinted,Ebay')
  assert.equal(params.get('countries'), 'EU')
  assert.equal(params.get('shippingOnly'), 'true')
  assert.equal(params.get('zip'), '1011')
  assert.equal(params.get('zipCountry'), 'NL')
  assert.equal(params.get('maxDistance'), '50')
})

test('matches url without a filter has no query string', () => {
  assert.equal(buildProductResourceUrl('https://api', '7', 'matches', buildMatchesParams(emptyOfferFilter())), 'https://api/api/Product/7/matches')
})

test('facets drop zero counts, sort by count and tolerate the old API', () => {
  const facets = parseOfferFacets({ total: 9, platforms: { Vinted: 2, Ebay: 7, Willhaben: 0 }, countries: { de: 8, AT: 1 }, withCoordinates: 5, shippable: 3 })
  assert.deepEqual(facets.platforms, [{ name: 'Ebay', count: 7 }, { name: 'Vinted', count: 2 }])
  assert.deepEqual(facets.countries, [{ code: 'DE', count: 8 }, { code: 'AT', count: 1 }])
  assert.equal(parseOfferFacets(null), null)
  assert.equal(parseOfferFacets('Not Found'), null)
  assert.equal(parseOfferFacets({}), null)
})

test('api error messages are extracted from several shapes', () => {
  assert.equal(extractApiErrorMessage({ data: 'Zip not found' }, 'x'), 'Zip not found')
  assert.equal(extractApiErrorMessage({ data: { message: 'Zip 999 not found' } }, 'x'), 'Zip 999 not found')
  assert.equal(extractApiErrorMessage({}, 'fallback'), 'fallback')
})

test('similar search for nearby by coordinates', () => {
  const state = applyNearby(emptyOfferFilter(), { lat: 52.5, lon: 13.4 })
  assert.deepEqual(buildSimilarSearchQuery('iPhone 13', state), { q: 'iPhone 13', sort: 'relevance', lat: '52.5', lon: '13.4', max_distance: '50' })
})

test('similar search for nearby by zip carries the zip country', () => {
  const state = applyNearby(emptyOfferFilter(), { zip: '1011', zipCountry: 'nl' })
  assert.deepEqual(buildSimilarSearchQuery('iPhone 13', state), { q: 'iPhone 13', sort: 'relevance', zip: '1011', country: 'NL', max_distance: '50' })
})

test('similar search for a single country and for EU', () => {
  assert.equal(buildSimilarSearchQuery('x', { ...emptyOfferFilter(), countries: ['AT'] }).country, 'AT')
  assert.equal('country' in buildSimilarSearchQuery('x', { ...emptyOfferFilter(), countries: ['EU'], shipping: true }), false)
  assert.equal(buildSimilarSearchQuery('x', emptyOfferFilter()).sort, 'relevance')
})

test('stored position round trip and rejection of garbage', () => {
  assert.deepEqual(parseStoredPosition(serializePosition({ lat: 1.5, lon: -2 })), { lat: 1.5, lon: -2 })
  assert.equal(parseStoredPosition('nope'), null)
  assert.equal(parseStoredPosition('{"lat":"1","lon":2}'), null)
  assert.equal(parseStoredPosition('{"lat":91,"lon":2}'), null)
  assert.equal(parseStoredPosition(null), null)
})
