import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultFilterState } from '../utils/filterWire.ts'
import { applyReferenceListing, applyReferencePrices, appliedSelectors, cleanSearchTerm, clearReference, displayPriceCandidates, initialPriceSelectors, needsPriceChoice, referenceTotal } from '../utils/referencePreview.ts'

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
  assert.equal(state.searchValue, 'apple iphone 15 pro')
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

// Production response for https://www.kleinanzeigen.de/s-anzeige/iphone-6-16-gb/3530498571-173-9660
const candidate = (selector, text, price, source) => ({ selector, text, price, currency: 'EUR', confidence: 0.5, source, isAutoSelected: false })
const real = {
  ...preview,
  listing: { title: 'iPhone 6 - 16 GB', description: '', imageUrls: [], productSearchQuery: 'iPhone 6 - 16 GB' },
  suggestedFilter: { ...preview.suggestedFilter, searchTerm: 'iPhone 6 - 16 GB' },
  priceCandidates: [
    candidate('meta', '30.00 EUR', 30, 'meta'),
    candidate('vb1', '19 € VB', 19, 'markup'),
    candidate('vb2', '19 € VB', 19, 'markup'),
    candidate('render-19', '19 € VB', 19, 'render'),
    candidate('m30', '30 €', 30, 'markup'),
    candidate('m30vb', '30 € VB', 30, 'markup'),
  ],
  selectedReference: null,
  requiresReferencePriceSelection: true,
}

test('duplicate prices become one chip, preferring render over markup over meta', () => {
  const chips = displayPriceCandidates(real)
  assert.deepEqual(chips.map(c => [c.price, c.selector]).sort((a, b) => a[0] - b[0]), [[19, 'render-19'], [30, 'm30']])
})

test('chips put auto-selected first, then higher confidence, and stop at four', () => {
  const many = { ...real, priceCandidates: [1, 2, 3, 4, 5, 6].map(n => ({ ...candidate(`s${n}`, `${n} €`, n, 'markup'), confidence: n / 10, isAutoSelected: n === 2 })) }
  assert.deepEqual(displayPriceCandidates(many).map(c => c.selector), ['s2', 's6', 's5', 's4'])
})

test('an applied selector is kept even when it is a duplicate or beyond the cap', () => {
  assert.ok(displayPriceCandidates(real, ['meta']).some(c => c.selector === 'meta'))
  const many = { ...real, priceCandidates: [1, 2, 3, 4, 5, 6].map(n => ({ ...candidate(`s${n}`, `${n} €`, n, 'markup'), confidence: n / 10 })) }
  assert.ok(displayPriceCandidates(many, ['s1']).some(c => c.selector === 's1'))
  assert.equal(displayPriceCandidates(many, ['s1']).length, 4)
})

test('nothing is picked silently when the listing needs a price choice', () => {
  assert.deepEqual(initialPriceSelectors(real), [])
  assert.equal(needsPriceChoice(real, []), true)
  assert.equal(needsPriceChoice(real, ['m30']), false)
  assert.equal(needsPriceChoice({ ...real, requiresReferencePriceSelection: false }, []), false)
})

test('listing titles lose standalone punctuation before they become a search term', () => {
  assert.equal(cleanSearchTerm('iPhone 6 - 16 GB'), 'iphone 6 16 gb')
  assert.equal(cleanSearchTerm('  Sofa – 3er | grau / neu : TOP!!! '), 'sofa 3er grau neu top')
  assert.equal(cleanSearchTerm('USB-C Kabel 3.5 mm'), 'usb-c kabel 3.5 mm')
  assert.equal(cleanSearchTerm('- | /'), '')
  const state = defaultFilterState()
  applyReferenceListing(state, real)
  assert.equal(state.searchValue, 'iphone 6 16 gb')
})
