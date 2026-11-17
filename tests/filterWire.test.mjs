import assert from 'node:assert/strict'
import test from 'node:test'
import { buildFilters, decodePriceRange, defaultFilterState, encodePriceRange, parseFilters } from '../utils/filterWire.ts'

const ctx = { freeMarketplaces: ['Ebay', 'Kleinanzeigen'], location: ['48.1', '11.5'], attributesSupported: true }
const names = filters => filters.map(f => f.name)
const value = (filters, name) => filters.find(f => f.name === name)?.value

test('a default filter sends "any" everywhere: no PriceRange, Condition or DeliveryMethod', () => {
  const state = defaultFilterState()
  state.condition = 'all'
  state.deliveryMethod = 'all'
  const wire = buildFilters(state, ctx)
  assert.deepEqual(names(wire), ['IncludePlatforms', 'SearchTerm', 'ReferenceCurrency'])
  assert.equal(value(wire, 'IncludePlatforms'), 'Ebay,Kleinanzeigen')
  // '' (the multi select not mounted yet) is "any" too
  assert.deepEqual(names(buildFilters(defaultFilterState(), ctx)), ['IncludePlatforms', 'SearchTerm', 'ReferenceCurrency'])
})

test('price ranges: min only, max only, both, integers only', () => {
  assert.equal(encodePriceRange('', ''), undefined)
  assert.equal(encodePriceRange(0, ''), undefined)
  assert.equal(encodePriceRange(5, ''), '5-1000000')
  assert.equal(encodePriceRange('', 500), '0-500')
  assert.equal(encodePriceRange(5.7, 499.2), '5-500')
  assert.deepEqual(decodePriceRange('5-1000000'), { minPrice: 5, maxPrice: '' })
  assert.deepEqual(decodePriceRange('0-500'), { minPrice: '', maxPrice: 500 })
  assert.deepEqual(decodePriceRange('0-100'), { minPrice: '', maxPrice: 100 })
})

test('E2E order: Country, PriceRange, Condition, DeliveryMethod, IncludePlatforms, Radius, SearchTerm', () => {
  const state = { ...defaultFilterState(), country: 'EU', minPrice: 5, maxPrice: 500, condition: 'broken', deliveryMethod: 'pickup', marketplace: 'Kleinanzeigen', zipcode: '94556', searchValue: 'vw' }
  const wire = buildFilters(state, ctx)
  assert.ok(JSON.stringify(wire).startsWith('[{"name":"Country","value":"EU"},{"name":"PriceRange","value":"5-500"},{"name":"Condition","value":"broken"},{"name":"DeliveryMethod","value":"pickup"},{"name":"IncludePlatforms","value":"Kleinanzeigen"},{"name":"Radius","value"'))
  assert.equal(value(wire, 'Radius'), '48.1;11.5;100;94556')
  assert.equal(value(wire, 'SearchTerm'), 'vw')
})

test('round trip keeps every modelled value', () => {
  const saved = [
    { name: 'Fuzzyness', value: '2' }, { name: 'Country', value: 'DE' }, { name: 'Frequency', value: '0 * * * *' },
    { name: 'PriceRange', value: '10-200' }, { name: 'Condition', value: 'new,used' }, { name: 'DeliveryMethod', value: 'shipping' },
    { name: 'IncludePlatforms', value: 'Kleinanzeigen' }, { name: 'Radius', value: '48.1;11.5;40;80331' }, { name: 'SearchTerm', value: 'iphone 15' },
    { name: 'Attributes', value: 'storage=256 gb;color=blau|blue' }, { name: 'ContainsKeyWord', value: 'pro,max|mini' },
    { name: 'NotContainsKeyWord', value: 'defekt,hülle' }, { name: 'VisualSimilarityFilter', value: '{"threshold":0.7}' },
    { name: 'ReferenceUrl', value: 'https://example.com/a' }, { name: 'ReferenceTitle', value: 'A' }, { name: 'ReferenceMarketplace', value: 'Vinted' },
    { name: 'ReferencePrice', value: '105.5' }, { name: 'ReferenceCurrency', value: 'EUR' }, { name: 'ReferenceSelector', value: '//p' },
    { name: 'ReferenceAdditionalSelectors', value: '//a\n//b' }, { name: 'ReferenceLastRefreshedAt', value: '2026-01-01T00:00:00.000Z' },
    { name: 'KleinanzeigenKategorie', value: 'Handy' },
  ]
  assert.deepEqual(buildFilters(parseFilters(saved), ctx), saved)
})

test('unmodelled saved filters are passed through unchanged, CommercialSeller/TotalCost keep their slot', () => {
  const saved = [
    { name: 'IsFlipNotification', value: 'true' }, { name: 'MinProfit', value: '20' }, { name: 'CommercialSeller', value: 'false' },
    { name: 'TotalCost', value: '5-9' }, { name: 'SearchTerm', value: 'x' }, { name: 'Locale', value: 'de' }, { name: 'IsBlacklist', value: true },
  ]
  const wire = buildFilters(parseFilters(saved), ctx)
  assert.deepEqual(names(wire), ['IncludePlatforms', 'CommercialSeller', 'SearchTerm', 'TotalCost', 'ReferenceCurrency', 'IsFlipNotification', 'MinProfit', 'Locale', 'IsBlacklist'])
  assert.equal(value(wire, 'CommercialSeller'), 'false')
  assert.equal(value(wire, 'TotalCost'), '5-9')
  assert.equal(value(wire, 'IsBlacklist'), true)
})

test('never emits a filter name twice', () => {
  const state = parseFilters([{ name: 'MinProfit', value: '1' }, { name: 'MinProfit', value: '2' }, { name: 'SearchTerm', value: 'a' }])
  state.passthrough.push({ name: 'SearchTerm', value: 'duplicate' }, { name: 'MinProfit', value: '3' })
  const wire = buildFilters(state, ctx)
  assert.equal(new Set(names(wire)).size, wire.length)
  assert.equal(value(wire, 'SearchTerm'), 'a')
  assert.equal(value(wire, 'MinProfit'), '1')
})

test('Attributes encode after SearchTerm, strip chip words, and are only sent when supported', () => {
  const state = { ...defaultFilterState(), searchValue: 'iPhone 15 Pro 256GB', attributes: { storage: ['256GB'], color: ['Blau'] } }
  const wire = buildFilters(state, ctx)
  assert.deepEqual(names(wire).slice(1, 3), ['SearchTerm', 'Attributes'])
  assert.equal(value(wire, 'SearchTerm'), 'iPhone 15 Pro')
  assert.equal(value(wire, 'Attributes'), 'storage=256 gb;color=blau|blue')
  const unsupported = buildFilters(state, { ...ctx, attributesSupported: false })
  assert.equal(value(unsupported, 'Attributes'), undefined)
  assert.equal(value(unsupported, 'SearchTerm'), 'iPhone 15 Pro 256GB')
  assert.deepEqual(parseFilters(wire).attributes, { storage: ['256 gb'], color: ['blau'] })
})

test('condition and delivery "all" are omitted, explicit choices kept', () => {
  for (const any of ['', 'all']) {
    const wire = buildFilters({ ...defaultFilterState(), condition: any, deliveryMethod: any }, ctx)
    assert.equal(value(wire, 'Condition'), undefined)
    assert.equal(value(wire, 'DeliveryMethod'), undefined)
  }
  const wire = buildFilters({ ...defaultFilterState(), condition: 'used', deliveryMethod: 'pickup' }, ctx)
  assert.equal(value(wire, 'Condition'), 'used')
  assert.equal(value(wire, 'DeliveryMethod'), 'pickup')
})

test('KleinanzeigenKategorie is only sent for a Kleinanzeigen-only filter', () => {
  const state = { ...defaultFilterState(), kleinanzeigenCategory: 'Handy' }
  assert.equal(value(buildFilters({ ...state, marketplace: 'Kleinanzeigen' }, ctx), 'KleinanzeigenKategorie'), 'Handy')
  for (const marketplace of ['all', 'Ebay', 'Ebay,Kleinanzeigen'])
    assert.equal(value(buildFilters({ ...state, marketplace }, ctx), 'KleinanzeigenKategorie'), undefined)
})

test('Radius needs a resolved location', () => {
  const state = { ...defaultFilterState(), zipcode: '80331' }
  assert.equal(value(buildFilters(state, { ...ctx, location: null }), 'Radius'), undefined)
})

test('legacy edits: open max decodes to an empty input, old 0-100 default keeps its max', () => {
  assert.equal(parseFilters([{ name: 'PriceRange', value: '5-1000000' }]).maxPrice, '')
  assert.equal(value(buildFilters(parseFilters([{ name: 'PriceRange', value: '0-100' }]), ctx), 'PriceRange'), '0-100')
})

test('free items: max 0 encodes "0-0" and round-trips; empty fields mean any price', () => {
  assert.equal(encodePriceRange('', 0), '0-0')
  assert.equal(encodePriceRange(0, 0), '0-0')
  assert.deepEqual(decodePriceRange('0-0'), { minPrice: '', maxPrice: 0 })
  assert.equal(value(buildFilters(parseFilters([{ name: 'PriceRange', value: '0-0' }]), ctx), 'PriceRange'), '0-0')
  assert.equal(encodePriceRange('', ''), undefined)
  assert.equal(encodePriceRange('', null), undefined)
  assert.deepEqual(decodePriceRange('5-1000000'), { minPrice: 5, maxPrice: '' })
})

test('min above max does not crash', () => {
  assert.equal(encodePriceRange(5, 0), '5-0')
  assert.deepEqual(decodePriceRange('5-0'), { minPrice: 5, maxPrice: 0 })
})
