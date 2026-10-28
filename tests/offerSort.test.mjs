import assert from 'node:assert/strict'
import test from 'node:test'
import { canSortOfferPrices, sortLoadedOffers } from '../utils/offerSort.ts'

const offers = [
  { id: 'new', price: 30, currency: 'EUR', postedAt: '2026-10-28T12:00:00Z' },
  { id: 'old', price: 10, currency: 'eur', postedAt: '2026-10-27T12:00:00Z' },
  { id: 'unknown', price: 0, currency: ' EUR ', postedAt: 'invalid' },
]
const ids = rows => rows.map(row => row.id)

test('price sorting keeps unknown prices last in both directions and never mutates the page', () => {
  assert.equal(canSortOfferPrices(offers), true)
  assert.deepEqual(ids(sortLoadedOffers(offers, { field: 'price', ascending: true })), ['old', 'new', 'unknown'])
  assert.deepEqual(ids(sortLoadedOffers(offers, { field: 'price', ascending: false })), ['new', 'old', 'unknown'])
  assert.deepEqual(ids(offers), ['new', 'old', 'unknown'])
  assert.equal(sortLoadedOffers(offers, null), offers)
})

test('date sorting includes subsequently loaded rows and keeps missing dates last', () => {
  const loaded = [...offers, { id: 'older', price: 50, currency: 'EUR', postedAt: '2026-10-26T12:00:00Z' }]
  assert.deepEqual(ids(sortLoadedOffers(loaded, { field: 'date', ascending: true })), ['older', 'old', 'new', 'unknown'])
  assert.deepEqual(ids(sortLoadedOffers(loaded, { field: 'date', ascending: false })), ['new', 'old', 'older', 'unknown'])
})

test('mixed, missing or malformed currencies cannot produce a numeric price ranking', () => {
  for (const currency of ['SEK', '', null, 'EURO']) {
    const rows = [...offers, { id: 'other', price: 1, currency }]
    assert.equal(canSortOfferPrices(rows), false)
    assert.equal(sortLoadedOffers(rows, { field: 'price', ascending: true }), rows)
    assert.equal(sortLoadedOffers(rows, { field: 'date', ascending: true }).length, rows.length)
  }
})

test('invalid prices stay after real prices and ties retain API order', () => {
  const rows = [5, null, undefined, Infinity, NaN, -1, 5].map((price, id) => ({ id, price, currency: 'EUR' }))
  assert.deepEqual(ids(sortLoadedOffers(rows, { field: 'price', ascending: false })), [0, 6, 1, 2, 3, 4, 5])
})
