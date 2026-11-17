import assert from 'node:assert/strict'
import test from 'node:test'
import { parseFilterPrefillQuery, prefillFormFields } from '../utils/filterPrefill.ts'

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

test('a comma-joined marketplace list keeps each known marketplace and drops unknown ones', () => {
  const supported = ['all', 'Ebay', 'Kleinanzeigen', 'Vinted']
  assert.equal(parseFilterPrefillQuery({ marketplace: 'Ebay,Kleinanzeigen' }, supported).marketplace, 'Ebay,Kleinanzeigen')
  assert.equal(parseFilterPrefillQuery({ marketplace: 'ebay, invented ,VINTED,ebay' }, supported).marketplace, 'Ebay,Vinted')
  assert.equal(parseFilterPrefillQuery({ marketplace: 'all,Vinted' }, supported).marketplace, 'Vinted')
  assert.equal(parseFilterPrefillQuery({ marketplace: 'all' }, supported).marketplace, 'all')
  assert.equal('marketplace' in parseFilterPrefillQuery({ marketplace: 'invented,other' }, supported), false)
})

test('the search link prefills attributes, category and source exactly as sent', () => {
  const query = { searchValue: 'iphone 15', minPrice: '100', maxPrice: '655', condition: 'used', marketplace: 'Ebay', attributes: 'storage=256GB;color=Blau|Blue', category: 'Handys', source: 'search' }
  assert.deepEqual(parseFilterPrefillQuery(query, ['Ebay']), {
    searchValue: 'iphone 15', minPrice: 100, maxPrice: 655, condition: 'used', marketplace: 'Ebay',
    attributes: { storage: ['256GB'], color: ['Blau'] }, category: 'Handys', source: 'search',
  })
})

test('url behaves like a pasted listing link; only plain http(s) links count', () => {
  assert.equal(parseFilterPrefillQuery({ url: 'https://www.vinted.de/items/1' }).url, 'https://www.vinted.de/items/1')
  for (const url of ['javascript:alert(1)', 'https://user:pw@example.com/', 'not a url'])
    assert.equal('url' in parseFilterPrefillQuery({ url }), false)
})

test('unknown sources are ignored and entry=photo opens the photo entry', () => {
  assert.equal('source' in parseFilterPrefillQuery({ source: 'evil' }), false)
  assert.equal(parseFilterPrefillQuery({ source: 'Listing' }).source, 'listing')
  assert.equal(parseFilterPrefillQuery({ entry: 'photo' }).entry, 'photo')
  assert.equal('entry' in parseFilterPrefillQuery({ entry: 'video' }), false)
})

test('only form fields are assigned onto the form state', () => {
  const prefill = parseFilterPrefillQuery({ searchValue: 'a', category: 'b', source: 'search', entry: 'photo', url: 'https://example.com/x', attributes: 'color=rot' })
  assert.deepEqual(prefillFormFields(prefill), { searchValue: 'a', attributes: { color: ['rot'] } })
})
