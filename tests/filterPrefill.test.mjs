import assert from 'node:assert/strict'
import test from 'node:test'
import { parseFilterPrefillQuery } from '../utils/filterPrefill.ts'

test('parses searchValue, minPrice, maxPrice and condition from the query', () => {
  const result = parseFilterPrefillQuery({ searchValue: 'Realme Yellow', minPrice: '10', maxPrice: '150', condition: 'used' })

  assert.deepEqual(result, { searchValue: 'Realme Yellow', minPrice: 10, maxPrice: 150, condition: 'used' })
})

test('trims searchValue and drops it when empty', () => {
  assert.equal(parseFilterPrefillQuery({ searchValue: '  Realme Yellow  ' }).searchValue, 'Realme Yellow')
  assert.equal('searchValue' in parseFilterPrefillQuery({ searchValue: '   ' }), false)
  assert.equal('searchValue' in parseFilterPrefillQuery({}), false)
})

test('ignores an unknown condition value instead of prefilling something invalid', () => {
  assert.equal('condition' in parseFilterPrefillQuery({ condition: 'mint' }), false)
  assert.equal('condition' in parseFilterPrefillQuery({ condition: '' }), false)
  // valid values are case-insensitive
  assert.equal(parseFilterPrefillQuery({ condition: 'NEW' }).condition, 'new')
})

test('clamps a negative or non-numeric price instead of prefilling it', () => {
  assert.equal('minPrice' in parseFilterPrefillQuery({ minPrice: 'not-a-number' }), false)
  assert.equal(parseFilterPrefillQuery({ minPrice: '-50' }).minPrice, 0)
  assert.equal('maxPrice' in parseFilterPrefillQuery({ maxPrice: 'Infinity' }), false)
})

test('swaps a min/max pair that arrives reversed rather than dropping the range', () => {
  const result = parseFilterPrefillQuery({ minPrice: '200', maxPrice: '50' })
  assert.equal(result.minPrice, 50)
  assert.equal(result.maxPrice, 200)
})

test('takes the first value when a param repeats, matching Vue Router LocationQuery', () => {
  assert.equal(parseFilterPrefillQuery({ searchValue: ['first', 'second'] }).searchValue, 'first')
})

test('ignores unknown params and returns an empty prefill for an empty query', () => {
  assert.deepEqual(parseFilterPrefillQuery({}), {})
})
