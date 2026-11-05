import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import * as Vue from 'vue'
import { renderToString } from 'vue/server-renderer'

const source = await readFile(process.env.FLIPPER_SOURCE || new URL('../pages/flipper.vue', import.meta.url), 'utf8')
const currencyAt = source.indexOf('v-model="filters.currency"')
const currencyTemplate = source.slice(source.lastIndexOf('<select', currencyAt), source.indexOf('</select>', currencyAt) + 9)
const currencyState = source.slice(source.indexOf('const availableCurrencies ='), source.indexOf('const hasSelectedCurrency ='))

async function renderCurrency(currency, feed = []) {
  const filters = Vue.reactive({ currency })
  const items = Vue.ref(feed)
  const getFlipCurrency = item => item.listing.currency
  const choices = new Function('computed', 'filters', 'items', 'getFlipCurrency', `${currencyState}; return { availableCurrencies, hasUnknownCurrency }`)(Vue.computed, filters, items, getFlipCurrency)
  const app = Vue.createSSRApp({ render: Vue.compile(currencyTemplate), setup: () => ({ filters, ...choices }) })
  app.config.globalProperties.$t = key => key
  return renderToString(app)
}

test('a restored currency remains selectable when no loaded flip currently uses it', async () => {
  const html = await renderCurrency('PLN', [{ listing: { currency: 'EUR' } }])
  assert.match(html, /<option[^>]*value="PLN"/)
})

test('a restored unknown-currency selection remains visible after the feed changes', async () => {
  const html = await renderCurrency('UNKNOWN', [{ listing: { currency: 'EUR' } }])
  assert.match(html, /<option[^>]*value="UNKNOWN"/)
})

test('currency discovery adds no unused choices to the default loaded feed', async () => {
  const html = await renderCurrency('EUR', [{ listing: { currency: 'GBP' } }, { listing: { currency: 'GBP' } }])
  assert.deepEqual([...html.matchAll(/<option[^>]*value="([^"]+)"/g)].map(match => match[1]), ['EUR', '*', 'GBP'])
})

const loadSource = stripTypeScriptTypes(source.match(/async function loadFlips\([\s\S]*?\n\}/)[0])
function feedState(initial = []) {
  const requests = []
  const state = {
    retailReferenceFlipsEnabled: true, referenceMode: Vue.ref('sold'), referenceProvider: Vue.ref(''),
    items: Vue.ref(initial), replayQueue: Vue.ref([]), loading: Vue.ref(false), feedError: Vue.ref(false),
    filters: { search: 'camera', currency: 'GBP', platforms: ['Gumtree'], minRefs: 2 },
    userStore: { checkAuth: async () => {} }, useFirebaseAuth: () => null,
    feedTier: { value: 'collector' }, nextFreeBackfillAt: null, FREE_BACKFILL_INTERVAL_MS: 1000,
    getAuthHeaders: () => undefined, selectedCategory: { value: '1' }, FEED_LIMIT: 100,
    getFlips: options => new Promise((resolve, reject) => requests.push({ options, resolve, reject })),
    appendIncomingFlips: async (items) => { state.items.value.push(...items) },
    console: { error() {} }, stopReplayLoop() {}, disconnectLiveFlips() {},
  }
  const sequence = source.match(/let feedRequestSeq = 0/)?.[0] || ''
  const reset = stripTypeScriptTypes(source.match(/function resetFeedState\([\s\S]*?\n\}/)[0])
  const actions = new Function('state', `with (state) { ${sequence}; ${loadSource}; ${reset}; return { loadFlips, resetFeedState } }`)(state)
  return { state, requests, run: actions.loadFlips, reset: actions.resetFeedState }
}

const feedTemplate = source.slice(source.indexOf('<!-- Feed -->'), source.indexOf('<!-- Bookmarked Flips -->')).replaceAll('item.listing!.', 'item.listing.')
async function renderFeed(state) {
  const app = Vue.createSSRApp({
    render: Vue.compile(feedTemplate),
    setup: () => ({ ...state, filteredItems: state.items, scrollContainer: null }),
  })
  app.component('UiDefaultContainer', { setup: (_, { slots }) => () => Vue.h('section', slots.default?.()) })
  app.component('FlipperFlipItem', { render: () => null })
  app.config.globalProperties.$t = key => key
  return renderToString(app)
}

test('failed feed load shows recoverable failure instead of a successful empty result and retry preserves filters', async () => {
  const { state, requests, run } = feedState()
  const filters = structuredClone(state.filters)
  const first = run()
  await Promise.resolve()
  requests[0].reject(new Error('synthetic feed outage'))
  await first
  assert.equal(state.feedError.value, true)
  assert.equal(state.loading.value, false)
  assert.deepEqual(state.filters, filters)
  const failedHtml = await renderFeed(state)
  assert.match(failedHtml, /role="alert"/)
  assert.match(failedHtml, /retry/)
  assert.doesNotMatch(failedHtml, /noFlipsFound/)
  const retry = run()
  await Promise.resolve()
  assert.deepEqual(requests[1].options, requests[0].options)
  requests[1].resolve([])
  await retry
  assert.equal(state.feedError.value, false)
  assert.deepEqual(state.filters, filters)
  const recoveredHtml = await renderFeed(state)
  assert.match(recoveredHtml, /noFlipsFound/)
  assert.doesNotMatch(recoveredHtml, /role="alert"/)
})

test('a failed feed refresh preserves loaded flips and reports the failed update', async () => {
  const item = { listing: { id: 'synthetic' } }
  const { state, requests, run } = feedState([item])
  const refreshing = run(true)
  await Promise.resolve()
  requests[0].reject(new Error('synthetic refresh outage'))
  await refreshing
  assert.deepEqual(state.items.value, [item])
  assert.equal(state.feedError.value, true)
  const retry = run()
  await Promise.resolve()
  requests[1].reject(new Error('synthetic retry outage'))
  await retry
  assert.deepEqual(state.items.value, [item], 'a failed explicit retry also keeps the last loaded feed')
})

test('a successful empty feed is an empty state rather than an error', async () => {
  const { state, requests, run } = feedState()
  const loading = run()
  await Promise.resolve()
  requests[0].resolve([])
  await loading
  assert.equal(state.feedError.value, false)
  const html = await renderFeed(state)
  assert.match(html, /noFlipsFound/)
  assert.doesNotMatch(html, /role="alert"/)
})

for (const outcome of ['success', 'empty', 'failure']) {
  test(`a superseded ${outcome} cannot alter the new category feed, queue, error or loading state`, async () => {
    const { state, requests, run, reset } = feedState()
    const old = run()
    await Promise.resolve()
    state.selectedCategory.value = '2'
    state.feedTier.value = 'flipper'
    reset()
    const current = run()
    await Promise.resolve()
    assert.equal(requests[0].options.path.category, '1')
    assert.equal(requests[1].options.path.category, '2')
    const queued = { listing: { id: 'new-queued' } }
    state.replayQueue.value = [queued]
    if (outcome === 'failure') requests[0].reject(new Error('synthetic old-category failure'))
    else requests[0].resolve(outcome === 'empty' ? [] : [{ listing: { id: 'old' } }])
    await old
    assert.deepEqual(state.items.value, [])
    assert.deepEqual(state.replayQueue.value, [queued])
    assert.equal(state.feedError.value, false)
    assert.equal(state.loading.value, true)
    const latest = { listing: { id: 'current' } }
    requests[1].resolve([latest])
    await current
    assert.deepEqual(state.items.value, [latest])
    assert.equal(state.feedError.value, false)
    assert.equal(state.loading.value, false)
  })
}

test('late old failure cannot erase a newer successful feed or its acknowledged recovery', async () => {
  const { state, requests, run, reset } = feedState()
  const old = run()
  await Promise.resolve()
  state.selectedCategory.value = '2'
  reset()
  const current = run()
  await Promise.resolve()
  const latest = { listing: { id: 'current' } }
  requests[1].resolve([latest])
  await current
  requests[0].reject(new Error('synthetic stale failure'))
  await old
  assert.deepEqual(state.items.value, [latest])
  assert.equal(state.feedError.value, false)
  assert.equal(state.loading.value, false)
})

test('a current refresh clears loading when it supersedes a still-pending initial request', async () => {
  const { state, requests, run } = feedState()
  const initial = run()
  await Promise.resolve()
  const refresh = run(true)
  await Promise.resolve()
  requests[0].resolve([{ listing: { id: 'superseded' } }])
  await initial
  assert.deepEqual(state.items.value, [])
  assert.equal(state.loading.value, true)
  const latest = { listing: { id: 'refreshed' } }
  requests[1].resolve([latest])
  await refresh
  assert.deepEqual(state.items.value, [latest])
  assert.equal(state.loading.value, false)
})

test('retail requests separate reference provider from marketplace filtering and sold wire stays unchanged', async () => {
  const { state, requests, run } = feedState()
  state.referenceMode.value = 'retail'
  state.referenceProvider.value = 'Lefeld'
  const pending = run()
  await Promise.resolve()
  assert.deepEqual(requests[0].options.query, { limit: 100, referenceMode: 'retail', referenceProvider: 'Lefeld' })
  assert.deepEqual(state.filters.platforms, ['Gumtree'])
  requests[0].resolve([])
  await pending
  state.referenceMode.value = 'sold'
  const sold = run()
  await Promise.resolve()
  assert.deepEqual(requests[1].options.query, { limit: 100 })
  requests[1].resolve([])
  await sold
})

for (const change of ['mode', 'provider']) {
  for (const outcome of ['success', 'failure']) {
    test(`in-flight retail ${outcome} cannot commit after ${change} changes before watcher refresh`, async () => {
      const { state, requests, run } = feedState()
      state.referenceMode.value = 'retail'
      state.referenceProvider.value = 'Lefeld'
      const old = run()
      await Promise.resolve()
      if (change === 'mode') state.referenceMode.value = 'sold'
      else state.referenceProvider.value = 'GoTools'
      if (outcome === 'success') requests[0].resolve([{ listing: { id: 'old' } }])
      else requests[0].reject(new Error('old request failed'))
      await old
      assert.deepEqual(state.items.value, [])
      assert.equal(state.feedError.value, false)
      assert.equal(state.loading.value, true)
      const current = run()
      await Promise.resolve()
      requests[1].resolve([{ listing: { id: 'current' } }])
      await current
      assert.equal(state.items.value[0].listing.id, 'current')
      assert.equal(state.loading.value, false)
    })
  }
}

test('disabled retail capability keeps the sold request even if an unavailable mode was selected', async () => {
  const { state, requests, run } = feedState()
  state.retailReferenceFlipsEnabled = false
  state.referenceMode.value = 'retail'
  state.referenceProvider.value = 'GoTools'
  const pending = run()
  await Promise.resolve()
  assert.equal(state.referenceMode.value, 'sold')
  assert.deepEqual(requests[0].options.query, { limit: 100 })
  requests[0].resolve([])
  await pending
  assert.equal(state.feedError.value, false)
  assert.equal(state.loading.value, false)
})
