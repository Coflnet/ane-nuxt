import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultFilterState } from '../utils/filterWire.ts'
import { applyReferenceListing, applyReferencePrices, appliedSelectors, clearReference, initialPriceSelectors, referenceTotal } from '../utils/referencePreview.ts'

const preview = {
  url: 'https://www.vinted.de/items/1-iphone',
  host: 'www.vinted.de',
  marketplace: 'Vinted',
  listing: { title: 'iPhone 15 Pro 256GB blau TOP!!!', description: '', imageUrls: [], productSearchQuery: 'iPhone 15 Pro 256GB blau TOP' },
  priceCandidates: [
    { selector: '//price', text: 'Price', price: 640, currency: 'EUR', confidence: 1, source: 'item', isAutoSelected: true },
    { selector: '//shipping', text: 'Shipping', price: 14.5, currency: 'EUR', confidence: 1, source: 'shipping', isAutoSelected: true },
    { selector: '//former', text: 'Former price', price: 800, currency: 'EUR', confidence: 0.5, source: 'former', isAutoSelected: false },
    { selector: '//usd', text: 'USD', price: 10, currency: 'USD', confidence: 0.5, source: 'other', isAutoSelected: false },
  ],
  previewElements: [],
  selectedReference: { selector: '//price', text: 'Price', price: 640, currency: 'EUR', confidence: 1, source: 'item', isAutoSelected: true },
  requiresReferencePriceSelection: false,
  suggestedFilter: { searchTerm: 'Apple iPhone 15 Pro', marketplace: 'Vinted', minPrice: 0, referenceUrl: '', referenceTitle: '', referenceMarketplace: '' },
  viewportWidth: 1, viewportHeight: 1, fullPageHeight: 1, renderedNodes: [],
}

test('the suggested search term replaces the raw page title', () => {
  const state = { ...defaultFilterState(), searchValue: 'iPhone 15 Pro 256GB blau TOP!!!' }
  applyReferenceListing(state, preview)
  assert.equal(state.searchValue, 'Apple iPhone 15 Pro')
  assert.equal(state.referenceTitle, preview.listing.title)
  assert.equal(state.referenceMarketplace, 'Vinted')
})

test('auto-selected candidates are checked and the rounded-up total sets the max price', () => {
  const state = defaultFilterState()
  applyReferencePrices(state, preview, initialPriceSelectors(preview), new Date(0))
  assert.deepEqual(appliedSelectors(state), ['//price', '//shipping'])
  assert.equal(state.referencePrice, 654.5)
  assert.equal(state.maxPrice, 655)
  assert.equal(state.referenceCurrency, 'EUR')
  assert.equal(state.referenceLastRefreshedAt, '1970-01-01T00:00:00.000Z')
})

test('parts in another currency are not summed and unselecting all clears the reference price', () => {
  assert.equal(referenceTotal(preview, ['//price', '//usd']), 640)
  const state = defaultFilterState()
  applyReferencePrices(state, preview, ['//price'])
  applyReferencePrices(state, preview, [])
  assert.equal(state.referenceSelector, '')
  assert.equal(state.referencePrice, 0)
  assert.equal(state.maxPrice, 640, 'the max price stays editable as it was')
})

test('a saved selection is kept when the preview still finds it', () => {
  assert.deepEqual(initialPriceSelectors(preview, '//price', ['//former']), ['//price', '//former'])
  assert.deepEqual(initialPriceSelectors({ ...preview, selectedReference: null }, '//gone', []), ['//price', '//shipping'])
})

test('removing the reference keeps search term and price', () => {
  const state = { ...defaultFilterState(), searchValue: 'x', maxPrice: 10, referenceUrl: 'https://a.b/c', referenceSelector: '//p', referencePrice: 9 }
  clearReference(state)
  assert.equal(state.referenceUrl, '')
  assert.equal(state.referencePrice, 0)
  assert.equal(state.searchValue, 'x')
  assert.equal(state.maxPrice, 10)
})

test('a reload keeps the search term the user saved or typed', () => {
  const state = { ...defaultFilterState(), searchValue: 'my own words' }
  applyReferenceListing(state, preview, { search: false })
  assert.equal(state.searchValue, 'my own words')
  assert.equal(state.referenceUrl, preview.url)
})
