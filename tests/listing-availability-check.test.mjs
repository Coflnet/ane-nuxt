import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

// RecentMatchTable.vue is a Vue SFC that relies on Nuxt's ambient auto-imports
// (useListingStore, useAvailabilityCheck, navigateTo), so it can't be imported directly in
// plain Node; assert on its source text instead, matching the pattern already used by
// i18n-config.test.mjs for nuxt.config.ts.

// Regression: `tableClicked` checked availability with `auction.listingData?.url`, a field
// that doesn't exist on `StoredListing` (it's always `undefined`), so `getPlatformFromUrl`
// always resolved to 'Unknown' and the availability check was a permanent no-op — silently
// skipping the check it claimed to perform. The real listing URL is only available via
// `listingStore.constructListingUrl(...)`, which must be computed once and reused for both
// the availability check and the actual navigation.
test('recent-match availability check uses the real listing URL, not a nonexistent field', async () => {
  const source = await readFile(new URL('../components/overview/RecentMatchTable.vue', import.meta.url), 'utf8')

  const fnMatch = source.match(/async function tableClicked\(auction: FilterMatch\) \{([\s\S]*?)\n\}/)
  assert.ok(fnMatch, 'tableClicked function not found in RecentMatchTable.vue')
  const body = fnMatch[1]

  assert.ok(!body.includes('listingData?.url'), 'listingData.url does not exist on StoredListing')

  const urlAssignment = body.match(/const url = listingStore\.constructListingUrl\(([^)]*)\)/)
  assert.ok(urlAssignment, 'expected the listing URL to be computed via listingStore.constructListingUrl')

  assert.match(body, /checkAvailability\(listingId, url\)/, 'availability check must use the computed url')
  assert.match(body, /navigateTo\(url,/, 'navigation must reuse the same computed url')
})
