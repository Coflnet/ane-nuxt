import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { hasClothingStyleReference } from '../utils/productStyles.ts'
import { buildProductResourceUrl } from '../utils/productApiUrl.ts'
import { buildMatchesParams, buildOfferFilterQuery, emptyOfferFilter } from '../utils/offerFilters.ts'

test('style endpoint and destination keep full filters without changing exact related route', () => {
  const state = { ...emptyOfferFilter(), platforms: ['Vinted'], countries: ['EU', 'US'], shipping: true, priceCurrency: 'EUR', zip: '10115', zipCountry: 'DE', maxDistance: 50 }
  const url = new URL(buildProductResourceUrl('https://api.invalid', 'nike-shirt', 'alternatives', { ...buildMatchesParams(state), mode: 'style', limit: 3 }))
  for (const [key, value] of Object.entries({ mode: 'style', platforms: 'Vinted', countries: 'EU,US', shippingOnly: 'true', priceCurrency: 'EUR', zip: '10115', zipCountry: 'DE', maxDistance: '50' })) assert.equal(url.searchParams.get(key), value)
  assert.deepEqual(buildOfferFilterQuery(state), { price_currency: 'EUR', platforms: 'Vinted', countries: 'EU,US', shipping: 'true', zip: '10115', max_distance: '50' })
  assert.equal(buildProductResourceUrl('https://api.invalid', 'nike-shirt', 'related'), 'https://api.invalid/api/Product/nike-shirt/related')
})

test('autoload requires an identified garment and configured locale strings exist', () => {
  for (const product of [null, {}, { attributes: {} }, { attributes: { garment_type: 'unknown' } }, { attributes: { garment_type: ' ' } }, { attributes: { garment_type: 'n/a' } }]) assert.equal(hasClothingStyleReference(product), false)
  assert.equal(hasClothingStyleReference({ attributes: { garment_type: 'jacket' } }), true)
  for (const locale of ['en', 'de']) {
    const messages = JSON.parse(readFileSync(new URL(`../locales/${locale}.json`, import.meta.url), 'utf8'))
    for (const key of ['similarStyles', 'similarStyleHint', 'similarStylesFailed']) assert.ok(messages.product[key])
    assert.ok(messages.loading)
    assert.ok(messages.retry)
  }
})

test('style loader skips ineligible products, hides empty success and offers retry on actual errors', async () => {
  const page = readFileSync(new URL('../pages/product/[id].vue', import.meta.url), 'utf8')
  const loader = page.slice(page.indexOf('async function loadSimilarStyles()'), page.indexOf('onBeforeUnmount(() => stylesRequest'))
    .replace('$fetch<ProductWithOffers[]>', '$fetch')
  let calls = 0
  const scope = { stylesRequest: undefined, similarStyles: { value: [] }, stylesError: { value: false }, stylesLoading: { value: false },
    stylesEligible: { value: false }, offerFilter: { value: emptyOfferFilter() }, API_BASE: 'https://api.invalid', productId: 'product',
    buildProductResourceUrl, buildMatchesParams, $fetch: async () => { calls++; return [] } }
  const load = new Function('scope', `with (scope) { ${loader}; return loadSimilarStyles }`)(scope)
  await load()
  assert.equal(calls, 0)
  scope.stylesEligible.value = true
  await load()
  assert.equal(calls, 1)
  assert.deepEqual(scope.similarStyles.value, [])
  assert.equal(scope.stylesError.value, false)
  assert.equal(scope.stylesLoading.value, false)
  scope.$fetch = async () => { throw new Error('unavailable') }
  await load()
  assert.equal(scope.stylesError.value, true)
  assert.equal(scope.stylesLoading.value, false)
  assert.deepEqual(scope.offerFilter.value, emptyOfferFilter())
})
