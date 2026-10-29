import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { computed, reactive, ref } from 'vue'
import * as historyUtils from '../utils/priceHistory.ts'
import { isIndividualOffer, isUnidentifiedMediaOffer } from '../utils/searchCurrency.ts'

const source = await readFile(new URL('../pages/product/[id].vue', import.meta.url), 'utf8')
const snapshots = [
  { date: '2026-10-28', currency: null, medianPrice: 99999 },
  { date: '2026-10-28', currency: 'EUR', medianPrice: 20, minPrice: 15, maxPrice: 25, sampleCount: 2 },
  { date: '2026-10-28', currency: 'SEK', medianPrice: 500, minPrice: 500, maxPrice: 500, sampleCount: 1 },
  { date: '2026-10-28', currency: 'GBP', medianPrice: 80, minPrice: 70, maxPrice: 90, sampleCount: 2 },
]

// Run the actual loader, currency/current-result computations and chart geometry; stub the API boundary.
function historyPage(query, rows = snapshots) {
  const requests = []
  const response = { rows, failure: null, statsCurrency: undefined }
  const data = ref(null), loading = ref(false), error = ref(null)
  let loader
  async function refresh() {
    loading.value = true
    error.value = null
    try {
      data.value = await loader()
    }
    catch (failure) {
      error.value = failure
    }
    finally {
      loading.value = false
    }
  }
  const route = reactive({ query: { ...query }, hash: '#price-history' })
  const state = {
    computed, ...historyUtils, isIndividualOffer, isUnidentifiedMediaOffer, route,
    productId: 'synthetic-native-tool', product: ref({ currency: 'EUR', isCatchAll: false }), locale: ref('en'),
    router: { replace(next) {
      route.query = next.query
      route.hash = next.hash
    } },
    useRaceableAsyncData(_, run) {
      loader = run
      return { data, loading, error, refresh }
    },
    getPriceHistory: async (request) => {
      requests.push({ kind: 'history', ...request })
      if (response.failure === 'history') throw new Error('Synthetic history outage')
      return response.rows
    },
    getPriceStats: async (request) => {
      requests.push({ kind: 'stats', ...request })
      if (response.failure === 'stats') throw new Error('Synthetic stats outage')
      const row = response.rows.find(row => row.currency === request.query.currency)
      return { currency: response.statsCurrency ?? row?.currency ?? null, medianPrice: row?.medianPrice ?? null, dataPoints: row?.sampleCount ?? 0 }
    },
  }
  const declarations = source.slice(source.indexOf('const historyDays ='), source.indexOf('// Localized names, case page link'))
  const chart = source.slice(source.indexOf('// Chart computations'), source.indexOf('function formatPrice('))
  const page = new Function('state', `with (state) { ${stripTypeScriptTypes(declarations + chart)}; return {
    setHistoryCurrency, setHistoryDays, historyCurrencyOptions, selectedHistoryCurrency, recordedCurrency,
    priceHistory, priceStats, excludedHistoryRows, formatRecordedPrice, medianLinePath, refreshHistory,
  } }`)(state)
  return { ...page, requests, response, route, loading, error }
}

test('actual loader discovers same-day native cohorts unfiltered and uses the selected currency for stats and chart', async () => {
  const scope = { price_currency: 'SEK', platforms: 'Blocket', countries: 'SE', history_days: '30' }
  const page = historyPage(scope)
  await page.refreshHistory()
  assert.deepEqual(page.requests.map(request => request.query), [{ days: 30 }, { days: 30, currency: 'SEK' }])
  assert.deepEqual(page.historyCurrencyOptions.value, ['SEK', 'EUR', 'GBP'])
  assert.deepEqual(page.priceHistory.value.map(row => row.medianPrice), [500])
  assert.equal(page.priceStats.value.medianPrice, 500)
  assert.equal(page.excludedHistoryRows.value, 3)
  assert.equal(page.formatRecordedPrice(500), historyUtils.formatHistoryPrice(500, 'SEK', 'en'))
  assert.equal(page.medianLinePath.value, '', 'One recorded point is available in daily details without fabricating a line')
  page.setHistoryCurrency('GBP')
  assert.deepEqual(page.priceHistory.value, [], 'Hide the old cohort immediately while the requested currency changes')
  assert.equal(page.priceStats.value, null)
  await page.refreshHistory()
  assert.deepEqual(page.requests.slice(-2).map(request => request.query), [{ days: 30 }, { days: 30, currency: 'GBP' }])
  assert.deepEqual(page.priceHistory.value.map(row => row.medianPrice), [80])
  assert.equal(page.formatRecordedPrice(80), '£80.00')
  assert.deepEqual(page.route.query, { ...scope, history_currency: 'GBP' })
  assert.equal(page.route.hash, '#price-history')
  page.setHistoryCurrency('SEK')
  page.response.rows = [...snapshots, { date: '2026-10-29', currency: 'SEK', medianPrice: 600, minPrice: 550, maxPrice: 650, sampleCount: 2 }]
  await page.refreshHistory()
  assert.deepEqual(page.priceHistory.value.map(row => row.medianPrice), [500, 600])
  assert.match(page.medianLinePath.value, /^M40,[\d.]+ L760,[\d.]+$/)
  assert.doesNotMatch(page.medianLinePath.value, /NaN|Infinity/)
})

test('unavailable, unknown and mismatched currency data never borrow another monetary cohort', async () => {
  const missing = historyPage({ history_currency: 'USD' })
  await missing.refreshHistory()
  assert.deepEqual(missing.priceHistory.value, [])
  assert.equal(missing.priceStats.value, null)
  assert.equal(missing.selectedHistoryCurrency.value, 'USD')
  assert.deepEqual(missing.requests.at(-1).query, { days: 90, currency: 'USD' })
  const unknown = historyPage({}, [{ date: '2026-10-28', currency: null, medianPrice: 99999 }])
  await unknown.refreshHistory()
  assert.deepEqual(unknown.historyCurrencyOptions.value, [])
  assert.equal(unknown.recordedCurrency.value, null)
  assert.deepEqual(unknown.priceHistory.value, [])
  assert.equal(unknown.priceStats.value, null)
  const mismatch = historyPage({ history_currency: 'SEK' })
  mismatch.response.statsCurrency = 'EUR'
  await mismatch.refreshHistory()
  assert.equal(mismatch.priceStats.value, null)
  assert.deepEqual(mismatch.priceHistory.value.map(row => row.currency), ['SEK'])
})

test('history or stats failure hides stale prices and retry preserves the selected native currency and URL scope', async () => {
  const scope = { price_currency: 'SEK', platforms: 'Blocket', countries: 'SE', history_currency: 'GBP', history_days: '7' }
  const page = historyPage(scope)
  await page.refreshHistory()
  for (const failure of ['history', 'stats']) {
    page.response.failure = failure
    await page.refreshHistory()
    assert(page.error.value)
    assert.deepEqual(page.priceHistory.value, [])
    assert.equal(page.priceStats.value, null)
    assert.deepEqual(page.route.query, scope)
    page.response.failure = null
    await page.refreshHistory()
    assert.equal(page.error.value, null)
    assert.equal(page.recordedCurrency.value, 'GBP')
    assert.deepEqual(page.priceHistory.value.map(row => row.medianPrice), [80])
    assert.deepEqual(page.requests.slice(-2).map(request => request.query), [{ days: 7 }, { days: 7, currency: 'GBP' }])
  }
})
