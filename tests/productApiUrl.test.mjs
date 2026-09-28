import assert from 'node:assert/strict'
import test from 'node:test'
import { buildProductResourceUrl } from '../utils/productApiUrl.ts'

// Regression: related products / matches were fetched from a bare `/api/Product/${id}/...`
// path, which the browser resolves against the Nuxt origin (ane.deals) instead of the API
// (ane.coflnet.com) and gets a 404 — https://ane.deals/product/... never loaded related
// products or matches. The URL must be built against the API base.
test('product resource url is absolute against the given API base', () => {
  const url = buildProductResourceUrl('https://ane.coflnet.com', '123', 'related')
  assert.equal(url, 'https://ane.coflnet.com/api/Product/123/related')
})

test('product resource url supports the matches resource', () => {
  const url = buildProductResourceUrl('https://ane.coflnet.com', '123', 'matches')
  assert.equal(url, 'https://ane.coflnet.com/api/Product/123/matches')
})

test('product resource url carries optional location params in the query string', () => {
  const url = buildProductResourceUrl('https://ane.coflnet.com', '123', 'related', {
    zip: '10115',
    lat: 52.5,
    lon: 13.4,
    maxDistance: 50,
  })
  assert.equal(url, 'https://ane.coflnet.com/api/Product/123/related?zip=10115&lat=52.5&lon=13.4&maxDistance=50')
})

test('product resource url omits the query string when no params are set', () => {
  const url = buildProductResourceUrl('https://ane.coflnet.com', '123', 'matches', {})
  assert.equal(url, 'https://ane.coflnet.com/api/Product/123/matches')
})

test('an internal SSR base is honored the same way as the public browser base', () => {
  const url = buildProductResourceUrl('http://aneapi:8000', '123', 'related')
  assert.equal(url, 'http://aneapi:8000/api/Product/123/related')
})

// Regression: the alternatives request (like related/matches before it, fixed above)
// must also be built against the API base, not a bare relative path.
test('product resource url supports the alternatives resource with a limit', () => {
  const url = buildProductResourceUrl('https://ane.coflnet.com', '123', 'alternatives', { limit: 3 })
  assert.equal(url, 'https://ane.coflnet.com/api/Product/123/alternatives?limit=3')
})

test('product resource url omits limit when unset or zero', () => {
  assert.equal(
    buildProductResourceUrl('https://ane.coflnet.com', '123', 'alternatives'),
    'https://ane.coflnet.com/api/Product/123/alternatives',
  )
  assert.equal(
    buildProductResourceUrl('https://ane.coflnet.com', '123', 'alternatives', { limit: 0 }),
    'https://ane.coflnet.com/api/Product/123/alternatives',
  )
})
