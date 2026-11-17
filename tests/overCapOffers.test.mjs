import assert from 'node:assert/strict'
import test from 'node:test'
import { emptyStateKind, offerTotal, offersAboveMax, parseShippingAmount, raiseMaxTo, withoutMaxPrice } from '../utils/overCapOffers.ts'

const listener = range => ({ name: 'x', filters: [{ name: 'SearchTerm', value: 'phone' }, ...(range ? [{ name: 'PriceRange', value: range }] : [])] })
const priceRange = l => l.filters.find(f => f.name === 'PriceRange')?.value

test('without a finite or non-zero max no second request is built', () => {
  assert.equal(withoutMaxPrice(listener()), null)
  assert.equal(withoutMaxPrice(listener('50-1000000')), null)
  assert.equal(withoutMaxPrice(listener('0-0')), null)
})

test('the max is lifted in place (PriceRange also carries the currency check), other filters are kept', () => {
  const original = listener('50-270')
  const result = withoutMaxPrice(original)
  assert.equal(priceRange(result), '50-1000000')
  assert.equal(result.filters.find(f => f.name === 'SearchTerm').value, 'phone')
  assert.equal(priceRange(original), '50-270')
  assert.equal(priceRange(withoutMaxPrice(listener('0-270'))), '0-1000000')
  const wire = { filters: [{ name: 'PriceRange', value: '0-5' }, { name: 'SearchTerm', value: 'x' }] }
  assert.deepEqual(withoutMaxPrice(wire).filters.map(f => f.name), ['PriceRange', 'SearchTerm'])
})

test('shipping amounts parse independent of separators like the backend', () => {
  for (const [text, amount] of [['5.00', 5], ['5,00', 5], ['1.299,00', 1299], ['1,299.00', 1299], ['Versand 4,99 EUR', 4.99], [null, 0]]) {
    assert.equal(parseShippingAmount(text), amount, String(text))
  }
  assert.equal(offerTotal({ price: 90, shipping: '5.00' }), 95)
  assert.equal(offerTotal({ price: 90, shipping: '0' }), 90)
})

test('offers above the max exclude capped matches, dedupe and sort cheapest first', () => {
  const capped = [{ id: 'a', platform: 'Ebay', price: 100 }]
  const uncapped = [
    { id: 'c', platform: 'Ebay', price: 400 },
    { id: 'a', platform: 'Ebay', price: 100 },
    { id: 'b', platform: 'Ebay', price: 300.2 },
    { id: 'b', platform: 'Ebay', price: 300.2 },
    { id: 'a', platform: 'Kleinanzeigen', price: 310 },
  ]
  assert.deepEqual(offersAboveMax(capped, uncapped).map(o => `${o.platform}${o.id}`), ['Ebayb', 'Kleinanzeigena', 'Ebayc'])
})

test('raise-to is the cheapest over-cap total (price + shipping) rounded up and always above the current max', () => {
  assert.equal(raiseMaxTo([{ price: 300.2 }, { price: 400 }], 270), 301)
  assert.equal(raiseMaxTo([{ price: 280, shipping: '9,90' }, { price: 295 }], 270), 290)
  assert.equal(raiseMaxTo([{ price: 270.4 }], 270), 271)
  assert.equal(raiseMaxTo([{ price: 250, shipping: '5' }], 270), null)
  assert.equal(raiseMaxTo([], 270), null)
  assert.equal(raiseMaxTo([{ price: 0 }, { price: null }], 270), null)
})

test('empty state mentions the market only when over-cap offers exist', () => {
  assert.equal(emptyStateKind(9), 'emptyAboveMax')
  assert.equal(emptyStateKind(0), 'empty')
})
