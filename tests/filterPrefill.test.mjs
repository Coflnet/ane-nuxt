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

test('browser-selected reference survives the extension create-alert link', () => {
  const query = Object.fromEntries(new URLSearchParams({ searchValue: 'Camera', referenceUrl: 'https://www.vinted.de/items/123-camera', referenceTitle: 'Camera', referenceSelector: '//*[@id=\'price\']', referenceAdditionalSelectors: '//*[@id=\'shipping\']', referencePrice: '105.50', referenceCurrency: 'eur' }))
  assert.deepEqual(parseFilterPrefillQuery(query), { searchValue: 'Camera', referenceUrl: query.referenceUrl, referenceTitle: 'Camera', referenceSelector: query.referenceSelector, referenceAdditionalSelectors: [query.referenceAdditionalSelectors], referencePrice: 105.5, referenceCurrency: 'EUR', maxPrice: 106 })
})

test('invalid reference links cannot inject an executable URL or incomplete reference', () => {
  const fields = { referenceSelector: '//*[@id=\'price\']', referencePrice: '105', referenceCurrency: 'EUR' }
  for (const referenceUrl of ['javascript:alert(1)', 'https://user:pass@example.com', 'https://example.com:8443/'])
    assert.deepEqual(parseFilterPrefillQuery({ ...fields, referenceUrl }), {})
  assert.deepEqual(parseFilterPrefillQuery({ referenceUrl: 'https://example.com', referencePrice: '100' }), {})
})

test('supported marketplace names are normalized and unknown ones ignored', () => {
  assert.equal(parseFilterPrefillQuery({ marketplace: 'ebay' }, ['Ebay', 'Kleinanzeigen']).marketplace, 'Ebay')
  assert.deepEqual(parseFilterPrefillQuery({ marketplace: 'invented' }), {})
})
