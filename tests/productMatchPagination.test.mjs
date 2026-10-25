import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { ref } from 'vue'
import { buildProductResourceUrl } from '../utils/productApiUrl.ts'
import { buildMatchesParams, emptyOfferFilter } from '../utils/offerFilters.ts'

const source = await readFile(new URL('../pages/product/[id].vue', import.meta.url), 'utf8')
const fn = name => source.match(new RegExp(`(?:async )?function ${name}\\([\\s\\S]*?\\n}`))[0]
function state() {
  const calls = []
  const pending = []
  const scope = { ref, buildProductResourceUrl, buildMatchesParams, API_BASE: 'https://local.invalid', productId: 'sony-playstation-5-used', t: key => key, extractApiErrorMessage: () => 'invalid zip' }
  for (const [key, value] of Object.entries({ matches: [], matchesLoading: false, matchesLoaded: false, matchesBefore: undefined, matchesHasMore: false, matchesError: null, zipError: '', offerFilter: emptyOfferFilter() })) scope[key] = ref(value)
  scope.$fetch = (url) => {
    calls.push(new URL(url))
    return new Promise((resolve, reject) => pending.push({ resolve, reject }))
  }
  const code = `${fn('buildMatchesUrl')}\nlet matchesSeq=0;${fn('loadMatches')}\nreturn {loadMatches}`
  return { ...scope, ...new Function('scope', `with(scope){${stripTypeScriptTypes(`function setup(){${code}}`)};return setup()}`)(scope), calls, pending }
}
const row = (id, time) => ({ listingId: id, platform: 'Kleinanzeigen', postedAt: `2026-10-25T${time}:00Z` })

test('short pages remain pageable; cursor retains filters, append deduplicates, empty page finishes', async () => {
  const s = state()
  s.offerFilter.value = { ...emptyOfferFilter(), countries: ['DE'], platforms: ['Kleinanzeigen'], shipping: true, zip: '10115', zipCountry: 'DE' }
  const first = s.loadMatches()
  s.pending.shift().resolve([row(1, '12:00'), row(2, '11:00')])
  await first
  assert.equal(s.matchesHasMore.value, true, 'a short nonempty page may reach the bounded API scan')
  const more = s.loadMatches(true)
  assert.equal(s.calls.at(-1).searchParams.get('before'), '2026-10-25T11:00:00Z')
  for (const [key, value] of Object.entries({ countries: 'DE', platforms: 'Kleinanzeigen', shippingOnly: 'true', zip: '10115', zipCountry: 'DE', limit: '50' })) assert.equal(s.calls.at(-1).searchParams.get(key), value)
  s.pending.shift().resolve([row(2, '11:00'), row(3, '10:00')])
  await more
  assert.deepEqual(s.matches.value.map(m => m.listingId), [1, 2, 3])
  const end = s.loadMatches(true)
  s.pending.shift().resolve([])
  await end
  assert.equal(s.matchesHasMore.value, false)
  await s.loadMatches(true)
  assert.equal(s.calls.length, 3)
})

test('append errors preserve offers and cursor for retry; filter reload supersedes late append', async () => {
  const s = state()
  let request = s.loadMatches()
  s.pending.shift().resolve([row(1, '12:00')])
  await request
  request = s.loadMatches(true)
  s.pending.shift().reject(new Error('local503'))
  await request
  assert.equal(s.matches.value.length, 1)
  assert.equal(s.matchesError.value, 'more')
  const failedUrl = s.calls.at(-1).href
  const retry = s.loadMatches(true)
  assert.equal(s.calls.at(-1).href, failedUrl)
  const late = s.pending.shift()
  s.offerFilter.value = { ...emptyOfferFilter(), countries: ['NL'] }
  const fresh = s.loadMatches()
  assert.equal(s.calls.at(-1).searchParams.has('before'), false)
  s.pending.shift().resolve([row(4, '09:00')])
  await fresh
  late.resolve([row(2, '11:00')])
  await retry
  assert.deepEqual(s.matches.value.map(m => m.listingId), [4])
  assert.equal(s.matchesError.value, null)
  assert.equal(s.matchesBefore.value, '2026-10-25T09:00:00Z')
})

test('cursor is preserved exactly when two timestamps differ below JavaScript millisecond precision', async () => {
  const s = state()
  const firstCursor = '2026-10-25T12:00:00.0001000Z'
  const nextCursor = '2026-10-25T12:00:00.0000001Z'
  let request = s.loadMatches()
  s.pending.shift().resolve([{ ...row(1, '12:00'), postedAt: firstCursor }])
  await request
  request = s.loadMatches(true)
  assert.equal(s.calls.at(-1).searchParams.get('before'), firstCursor)
  s.pending.shift().resolve([{ ...row(2, '12:00'), postedAt: nextCursor }])
  await request
  assert.equal(s.matchesBefore.value, nextCursor)
  assert.equal(s.matchesHasMore.value, true)
})
