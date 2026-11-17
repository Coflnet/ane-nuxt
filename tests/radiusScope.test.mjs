import assert from 'node:assert/strict'
import test from 'node:test'
import { buildFilters, defaultFilterState, parseFilters } from '../utils/filterWire.ts'
import { decodeRadiusScope, needsRadiusScopeChoice, radiusSummary, shippingAllowed } from '../utils/radiusScope.ts'

const ctx = { freeMarketplaces: ['Ebay'], location: ['48.1', '11.5'] }
const value = (filters, name) => filters.find(f => f.name === name)?.value

test('new filters with a zip default to scope "all" and send it right after Radius', () => {
  const state = { ...defaultFilterState(), zipcode: '80331' }
  const wire = buildFilters(state, ctx)
  assert.equal(value(wire, 'RadiusScope'), 'all')
  const names = wire.map(f => f.name)
  assert.equal(names.indexOf('RadiusScope'), names.indexOf('Radius') + 1)
})

test('RadiusScope round-trips through edit and save', () => {
  for (const scope of ['all', 'pickup']) {
    const saved = [{ name: 'Radius', value: '48.1;11.5;66;80331' }, { name: 'RadiusScope', value: scope }]
    const state = parseFilters(saved)
    assert.equal(state.radiusScope, scope)
    assert.equal(value(buildFilters(state, ctx), 'RadiusScope'), scope)
  }
})

test('legacy filters with Radius but no RadiusScope decode as pickup and keep it when re-saved', () => {
  const state = parseFilters([{ name: 'Radius', value: '48.1;11.5;66;80331' }])
  assert.equal(state.radiusScope, 'pickup')
  assert.equal(value(buildFilters(state, ctx), 'RadiusScope'), 'pickup')
})

test('a saved filter without any radius still defaults a later zip to "all"', () => {
  assert.equal(parseFilters([{ name: 'SearchTerm', value: 'x' }]).radiusScope, 'all')
})

test('shipping-only delivery keeps Radius and always sends scope pickup, whatever the stored scope', () => {
  for (const radiusScope of ['all', 'pickup']) {
    const state = { ...defaultFilterState(), zipcode: '80331', deliveryMethod: 'shipping', radiusScope }
    const wire = buildFilters(state, ctx)
    assert.equal(value(wire, 'Radius'), '48.1;11.5;100;80331')
    assert.equal(value(wire, 'RadiusScope'), 'pickup')
  }
})

test('other deliveries send the chosen scope', () => {
  const state = { ...defaultFilterState(), zipcode: '80331', deliveryMethod: 'shipping,pickup', radiusScope: 'pickup' }
  assert.equal(value(buildFilters(state, ctx), 'RadiusScope'), 'pickup')
  assert.equal(value(buildFilters({ ...state, radiusScope: 'all' }, ctx), 'RadiusScope'), 'all')
})

test('values are trimmed and case-insensitive like the backend', () => {
  assert.equal(shippingAllowed('pickup, Shipping'), true)
  assert.equal(shippingAllowed('ALL'), true)
  assert.equal(shippingAllowed(' Pickup '), false)
  assert.equal(decodeRadiusScope(' ALL '), 'all')
  assert.equal(decodeRadiusScope('Pickup'), 'pickup')
  assert.equal(radiusSummary('pickup, Shipping', '12345', 'all'), 'everything')
})

test('no zip or no location sends no RadiusScope', () => {
  assert.equal(value(buildFilters(defaultFilterState(), ctx), 'RadiusScope'), undefined)
  assert.equal(value(buildFilters({ ...defaultFilterState(), zipcode: '1' }, { ...ctx, location: null }), 'RadiusScope'), undefined)
})

test('shipping allowed mirrors the backend: empty/all or a list containing shipping/all', () => {
  for (const method of ['', 'all', 'shipping', 'shipping,pickup', 'pickup,all'])
    assert.equal(shippingAllowed(method), true, method)
  assert.equal(shippingAllowed('pickup'), false)
  assert.equal(needsRadiusScopeChoice('shipping,pickup'), true)
  assert.equal(needsRadiusScopeChoice('pickup'), false)
  assert.equal(needsRadiusScopeChoice('shipping'), false)
})

test('summary decision for the four cases', () => {
  assert.equal(radiusSummary('all', '12345', 'all'), 'everything')
  assert.equal(radiusSummary('', '12345', 'pickup'), 'pickupShippingAnywhere')
  assert.equal(radiusSummary('shipping,pickup', '12345', 'pickup'), 'pickupShippingAnywhere')
  assert.equal(radiusSummary('pickup', '12345', 'all'), 'pickupOnly')
  assert.equal(radiusSummary('shipping', '12345', 'all'), 'none')
  assert.equal(radiusSummary('all', '', 'all'), 'none')
})
