import assert from 'node:assert/strict'
import test from 'node:test'
import { buildNotifyFilterUrl, buildNotifySearchValue } from '../utils/notifyFilterUrl.ts'

// Regression: a product with brand "Realme" and name "Realme Yellow" must produce the
// search value "Realme Yellow", not "Realme Realme Yellow".
test('buildNotifySearchValue does not duplicate the brand already in the product name', () => {
  assert.equal(buildNotifySearchValue({ brand: 'Realme', name: 'Realme Yellow' }), 'Realme Yellow')
  assert.equal(buildNotifySearchValue({ brand: 'realme', name: 'Realme Yellow' }), 'Realme Yellow')
})

test('buildNotifySearchValue prefixes the brand when the name does not already include it', () => {
  assert.equal(buildNotifySearchValue({ brand: 'Apple', name: 'iPhone 13' }), 'Apple iPhone 13')
})

test('buildNotifySearchValue falls back to whichever of brand/name is present', () => {
  assert.equal(buildNotifySearchValue({ brand: null, name: 'Widget' }), 'Widget')
  assert.equal(buildNotifySearchValue({ brand: 'Acme', name: null }), 'Acme')
  assert.equal(buildNotifySearchValue({ brand: null, name: null }), '')
})

test('buildNotifyFilterUrl points at /filters/create with searchValue and rounded maxPrice', () => {
  const { path, query } = buildNotifyFilterUrl({ brand: 'Realme', name: 'Realme Yellow', avgPrice: 149.6 })

  assert.equal(path, '/filters/create')
  assert.equal(query.searchValue, 'Realme Yellow')
  assert.equal(query.maxPrice, '150')
  assert.equal('minPrice' in query, false, 'minPrice must be left empty per the task')
})

test('buildNotifyFilterUrl omits maxPrice when avgPrice is missing or not positive', () => {
  assert.equal('maxPrice' in buildNotifyFilterUrl({ name: 'Widget', avgPrice: null }).query, false)
  assert.equal('maxPrice' in buildNotifyFilterUrl({ name: 'Widget', avgPrice: 0 }).query, false)
  assert.equal('maxPrice' in buildNotifyFilterUrl({ name: 'Widget', avgPrice: -5 }).query, false)
})
