import assert from 'node:assert/strict'
import test from 'node:test'
import { emptyStateKind, hasFiniteMax, offerTotal, raiseMaxTo, splitAboveMax } from '../utils/overCapOffers.ts'

const listener = range => ({ filters: [{ name: 'SearchTerm', value: 'phone' }, ...(range ? [{ name: 'PriceRange', value: range }] : [])] })

test('only a finite max above 0 asks for above-max offers', () => {
  assert.equal(hasFiniteMax(listener('50-270')), true)
  assert.equal(hasFiniteMax(listener()), false)
  assert.equal(hasFiniteMax(listener('50-1000000')), false)
  assert.equal(hasFiniteMax(listener('0-0')), false)
})

test('the response splits by the aboveMax flag, above-max cheapest total first', () => {
  const { within, above } = splitAboveMax([
    { id: 'a', price: 100 },
    { id: 'c', price: 280, totalPrice: 400, aboveMax: true },
    { id: 'b', price: 290, totalPrice: 300, aboveMax: true },
    { id: 'd', price: 90, aboveMax: false },
  ])
  assert.deepEqual(within.map(o => o.id), ['a', 'd'])
  assert.deepEqual(above.map(o => o.id), ['b', 'c'])
})

test('a response without the flag (old backend) yields no above-max group', () => {
  const { within, above } = splitAboveMax([{ id: 'a', price: 100 }, { id: 'b', price: 120 }])
  assert.equal(within.length, 2)
  assert.deepEqual(above, [])
})

test('offer total is the backend total, falling back to the price', () => {
  assert.equal(offerTotal({ price: 90, totalPrice: 95 }), 95)
  assert.equal(offerTotal({ price: 90 }), 90)
  assert.equal(offerTotal({}), 0)
})

test('raise-to is the cheapest over-cap totalPrice rounded up and always above the current max', () => {
  assert.equal(raiseMaxTo([{ price: 300.2, totalPrice: 300.2 }, { totalPrice: 400 }], 270), 301)
  assert.equal(raiseMaxTo([{ price: 280, totalPrice: 289.9 }, { price: 295 }], 270), 290)
  assert.equal(raiseMaxTo([{ totalPrice: 270.4 }], 270), 271)
  assert.equal(raiseMaxTo([{ totalPrice: 250 }], 270), null)
  assert.equal(raiseMaxTo([], 270), null)
  assert.equal(raiseMaxTo([{ price: 0 }, { price: null }], 270), null)
})

test('empty state mentions the market only when over-cap offers exist', () => {
  assert.equal(emptyStateKind(9), 'emptyAboveMax')
  assert.equal(emptyStateKind(0), 'empty')
})
