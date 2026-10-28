import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { ref } from 'vue'
import assert from 'node:assert/strict'
import test from 'node:test'
import { searchCurrency, nativeScopedPrice } from '../utils/searchCurrency.ts'
import { parseOfferFilterQuery, buildOfferFilterQuery, buildMatchesParams, buildSimilarSearchQuery } from '../utils/offerFilters.ts'

test('only unambiguous scope supplies a smart default, and existing budgets retain EUR', () => {
  assert.equal(searchCurrency({}), 'EUR')
  for (const [market, country, currency] of [['Gumtree', 'GB', 'GBP'], ['Blocket', 'SE', 'SEK'], ['OLX', 'PL', 'PLN']]) {
    assert.equal(searchCurrency({}, [market]), currency)
    assert.equal(searchCurrency({ country }), currency)
    assert.equal(searchCurrency({ price_max: '100' }, [market]), 'EUR')
    assert.equal(searchCurrency({ price_min: '0', country }), 'EUR')
    assert.equal(searchCurrency({ price_currency: 'usd', country }, [market]), 'USD')
  }
  assert.equal(searchCurrency({}, ['Blocket', 'OLX']), 'EUR')
  assert.equal(searchCurrency({ country: 'DE' }, ['Blocket']), 'EUR')
  assert.equal(nativeScopedPrice({ minPrice: 100 }, 'EUR'), undefined)
})

test('currency survives offer URL edits, matches requests and similar search', () => {
  const state = parseOfferFilterQuery({ price_currency: 'sek', platforms: 'Blocket', countries: 'SE' })
  assert.equal(state.priceCurrency, 'SEK')
  assert.equal(buildOfferFilterQuery(state).price_currency, 'SEK')
  assert.equal(buildMatchesParams(state).priceCurrency, 'SEK')
  assert.equal(buildSimilarSearchQuery('camera', state).price_currency, 'SEK')
  assert.equal(buildSimilarSearchQuery('camera', state).platforms, 'Blocket')
})

test('actual response handler requires honored currency and never derives a range from legacy EUR', async () => {
  const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
  const handler = source.match(/function applySearchResponse\([\s\S]*?\n\}/)[0]
  const state = Object.fromEntries(['allProducts', 'storeBuckets', 'platformBuckets', 'currencyBuckets', 'categoryBuckets', 'conditionBuckets'].map(key => [key, ref([])]))
  for (const key of ['interpretation', 'totalResults', 'batteryRangeMin', 'batteryRangeMax', 'batteryFilterMin', 'batteryFilterMax', 'priceRangeMin', 'priceRangeMax', 'priceFilterMin', 'priceFilterMax']) state[key] = ref(0)
  for (const key of ['selectedBatteryMin', 'selectedBatteryMax', 'selectedMinPrice', 'selectedMaxPrice']) state[key] = ref(undefined)
  state.attributeBuckets = ref({})
  state.selectedPriceCurrency = ref('SEK')
  const apply = new Function('state', 'nativeScopedPrice', `with (state) { ${stripTypeScriptTypes(handler)}; return applySearchResponse }`)(state, nativeScopedPrice)
  const product = { minPrice: 999, scopedMinPrice: 100, scopedPriceCurrency: 'SEK' }
  apply({ products: [product], priceCurrency: 'SEK', priceMin: 90, priceMax: 120 }, false)
  assert.equal(state.priceRangeMin.value, 90)
  assert.equal(state.priceRangeMax.value, 120)
  assert.equal(state.allProducts.value[0].scopedMinPrice, 100)
  apply({ products: [product], priceMin: 999, priceMax: 999 }, false)
  assert.equal(state.priceRangeMin.value, 0)
  assert.equal(state.priceRangeMax.value, 0)
  assert.equal(state.allProducts.value[0].scopedMinPrice, null)
  apply({ products: [{ minPrice: 999 }], priceCurrency: 'SEK' }, false)
  assert.equal(state.priceRangeMax.value, 0)
  apply({ products: [product], priceCurrency: 'SEK' }, false)
  assert.equal(state.priceRangeMin.value, 100)
  assert.equal(state.priceRangeMax.value, 100)
})

test('similar-offer links retain source currency country and nearby scope across reloads', () => {
  for (const query of [
    { price_currency: 'PLN', platforms: 'OLX,Ebay', countries: 'PL' },
    { price_currency: 'GBP', platforms: 'Gumtree', countries: 'GB', zip: 'SW1A 1AA', zip_country: 'GB', max_distance: '25' },
    { price_currency: 'SEK', platforms: 'Blocket', countries: 'SE', lat: '59.3', lon: '18.1', max_distance: '50' },
  ]) {
    const state = parseOfferFilterQuery(query)
    const destination = buildSimilarSearchQuery('camera', state)
    const reloaded = Object.fromEntries(new URLSearchParams(destination))
    assert.equal(reloaded.platforms, query.platforms)
    assert.equal(reloaded.price_currency, query.price_currency)
    assert.equal(reloaded.country, query.countries)
    assert.equal(reloaded.max_distance, query.max_distance)
    assert.equal(reloaded.zip, query.zip)
    assert.equal(reloaded.lat, query.lat)
    assert.equal(reloaded.lon, query.lon)
  }
})

test('unspecific groups suppress product prices while independent native asking amounts remain available', () => {
  const price = { scopedMinPrice: 100, scopedPriceCurrency: 'PLN', minPrice: 9999, averagePrice: 9999 }
  for (const attributes of [[{ key: 'specificity', value: 'unspecific' }], { specificity: 'unspecific' }]) {
    assert.equal(nativeScopedPrice({ ...price, attributes }, 'PLN'), undefined)
    for (const identifierType of ['mechanical_part_offer', 'equipment_offer', 'vinyl_offer', 'comic_offer', 'lego_offer', 'paper_offer', 'furniture_offer', 'pokemon_card_offer']) {
      assert.equal(nativeScopedPrice({ ...price, attributes, identifierType }, 'PLN'), 100)
      assert.equal(nativeScopedPrice({ ...price, attributes, identifierType }, 'EUR'), undefined)
    }
  }
  for (const kind of ['book_offer', 'stationery_offer', 'audio_equipment_offer', 'hand_tool_offer', 'comic_lot', 'pokemon_card_offer']) {
    assert.equal(nativeScopedPrice({ ...price, attributes: { specificity: 'unspecific', product_kind: kind } }, 'PLN'), 100)
  }
  assert.equal(nativeScopedPrice(price, 'PLN'), 100, 'unmarked exact product keeps its scoped native amount')
  assert.equal(nativeScopedPrice(price, 'EUR'), undefined)
  assert.equal(nativeScopedPrice({ minPrice: 9999, averagePrice: 9999 }, 'EUR'), undefined, 'legacy aggregate never replaces a missing native amount')
  for (const scopedMinPrice of [0, -1, null, undefined, NaN, Infinity]) {
    assert.equal(nativeScopedPrice({ ...price, scopedMinPrice }, 'PLN'), undefined)
  }
})
