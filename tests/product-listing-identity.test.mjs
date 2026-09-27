import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

// ProductListingTable.vue is a Vue SFC that relies on Nuxt's ambient auto-imports, so it can't
// be imported directly in plain Node; assert on its source text instead, matching the pattern
// already used by i18n-config.test.mjs for nuxt.config.ts.

// Regression: the template used `listing.listingId || listing.id` as the row key and as the
// identifier for the availability/unavailable Sets, but `ProductMatch` has no `id` field (only
// `listingId` and `productId`) — `listing.id` was always `undefined`, so every listing missing
// a `listingId` (i.e. not sourced from kleinanzeigen.de) silently collapsed onto the same
// `undefined` key/identity for Vue's `:key`, `checkingAvailability` and `unavailableListings`.
// The script side already falls back to the real `productId` field; the template must match.
test('product listing rows fall back to the real productId field, not a nonexistent id', async () => {
  const source = await readFile(new URL('../components/product/ProductListingTable.vue', import.meta.url), 'utf8')

  assert.ok(!source.includes('listing.id'), 'ProductMatch has no `id` field')

  const fallbackOccurrences = source.match(/listing\.listingId \|\| listing\.productId/g) ?? []
  assert.ok(fallbackOccurrences.length >= 5, 'expected the listingId-or-productId fallback in the key, both Set membership checks, and both :class bindings')
})
