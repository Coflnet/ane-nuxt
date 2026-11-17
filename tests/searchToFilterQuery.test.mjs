import assert from 'node:assert/strict'
import test from 'node:test'
import { encodeNotifyAttributes, filterCondition, searchToFilterQuery } from '../utils/searchToFilterQuery.ts'

test('carries query, prices, condition, attributes, category and marketplaces to /filters/create', () => {
  const link = searchToFilterQuery({
    query: '  iPhone 13  ',
    minPrice: 100,
    maxPrice: 400,
    condition: 'gebraucht',
    attributes: { storage: ['128 GB', '256 GB'], color: ['Blue'], os_version: ['15'] },
    category: 'smartphones',
    platforms: ['Ebay', 'Kleinanzeigen'],
  })
  assert.deepEqual(link, {
    path: '/filters/create',
    query: {
      searchValue: 'iPhone 13',
      minPrice: '100',
      maxPrice: '400',
      condition: 'used',
      attributes: 'storage=128 GB|256 GB;color=Blue',
      category: 'smartphones',
      marketplace: 'Ebay,Kleinanzeigen',
      source: 'search',
    },
  })
})

test('omits empty params and keeps a zero minimum price', () => {
  assert.deepEqual(searchToFilterQuery({ query: 'lego' }), { path: '/filters/create', query: { searchValue: 'lego', source: 'search' } })
  assert.deepEqual(searchToFilterQuery({ query: '', minPrice: 0, maxPrice: Number.NaN, condition: 'mint', attributes: {}, category: ' ', platforms: [] }).query,
    { minPrice: '0', source: 'search' })
})

test('maps search condition values to notifier conditions', () => {
  assert.equal(filterCondition('new'), 'new')
  assert.equal(filterCondition('Neu'), 'new')
  assert.equal(filterCondition('like_new'), 'used')
  assert.equal(filterCondition('refurbished'), 'used')
  assert.equal(filterCondition('for_parts'), 'broken')
  assert.equal(filterCondition('broken'), 'broken')
  assert.equal(filterCondition(''), '')
  assert.equal(filterCondition('unknown'), '')
})

test('attribute encoding whitelists keys and strips separator characters from values', () => {
  assert.equal(encodeNotifyAttributes({ model: ['A;B', 'C|D=E'], language: [';|='], series: ['Tintin'] }), 'model=A B|C D E')
  assert.equal(encodeNotifyAttributes(), '')
})
