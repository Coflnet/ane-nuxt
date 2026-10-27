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
})

test('actual response handler requires honored currency and never derives a range from legacy EUR', async () => {
  const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
  const handler = source.match(/function applySearchResponse\([\s\S]*?\n\}/)[0]
  const state = Object.fromEntries(['allProducts', 'platformBuckets', 'currencyBuckets', 'categoryBuckets', 'conditionBuckets'].map(key => [key, ref([])]))
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
