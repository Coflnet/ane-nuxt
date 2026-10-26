import assert from 'node:assert/strict'
import test from 'node:test'
import { formatHistoryPrice, historyCurrency, historyTimeFraction } from '../utils/priceHistory.ts'

test('only a fully recorded common currency adds a currency symbol', () => {
  assert.equal(historyCurrency([]), null)
  assert.equal(historyCurrency([{}, {}]), null)
  assert.equal(historyCurrency([{ currency: 'EUR' }, {}]), null)
  assert.equal(historyCurrency([{ currency: 'EUR' }, { currency: 'GBP' }]), null)
  assert.equal(historyCurrency([{ currency: 'EUR' }, { currency: 'EUR' }]), 'EUR')
  assert.equal(formatHistoryPrice(500, null, 'en'), '500')
  assert.equal(formatHistoryPrice(500, 'EUR', 'en'), '€500.00')
})

test('oldest is left, newest is right, and missing days are not compressed', () => {
  const history = ['2026-10-01', '2026-10-02', '2026-10-11'].map(date => ({ date }))
  assert.equal(historyTimeFraction(history, 0), 0)
  assert.equal(historyTimeFraction(history, 1), 0.1)
  assert.equal(historyTimeFraction(history, 2), 1)
  assert.equal(historyTimeFraction(history.slice(0, 1), 0), 0.5)
})

test('URL history windows accept only supported whole-day selections', async () => {
  const { parseHistoryDays, HISTORY_WINDOWS } = await import('../utils/priceHistory.ts')
  for (const days of HISTORY_WINDOWS) assert.equal(parseHistoryDays(String(days)), days)
  for (const value of [undefined, null, '', '0', '366', '7.0', '7days', ['7', '30']]) {
    assert.equal(parseHistoryDays(value), 90)
  }
})

test('only known currency cohorts are plotted, chosen by availability and preserved explicit criteria', async () => {
  const { chooseHistoryCurrency, historyCurrencies, parseHistoryCurrency, selectHistoryCurrency } = await import('../utils/priceHistory.ts')
  const history = [{ date: '2026-10-20', currency: null, medianPrice: 1000 }, { date: '2026-10-21', currency: 'EUR', medianPrice: 100 }, { date: '2026-10-22', currency: 'GBP', medianPrice: 80 }, { date: '2026-10-23', currency: 'GBP', medianPrice: 90 }]
  assert.deepEqual(historyCurrencies(history), ['GBP', 'EUR'])
  assert.equal(chooseHistoryCurrency(history), 'GBP', 'default to the recorded currency with the most daily history')
  assert.equal(chooseHistoryCurrency(history, 'EUR'), 'EUR', 'a known available product currency is the editable preference')
  assert.equal(chooseHistoryCurrency(history, 'USD'), 'GBP')
  assert.equal(chooseHistoryCurrency([{ currency: null }]), null)
  assert.deepEqual(selectHistoryCurrency(history, 'EUR').map(p => p.medianPrice), [100])
  assert.deepEqual(selectHistoryCurrency(history, 'USD'), [], 'an explicit unavailable URL choice must not broaden to another currency')
  assert.deepEqual(selectHistoryCurrency(history, null), [], 'unknown is not a shared currency certificate')
  assert.equal(history[0].currency, null)
  assert.equal(parseHistoryCurrency(' eur '), 'EUR')
  for (const value of ['Euro', '', ['EUR'], null]) assert.equal(parseHistoryCurrency(value), null)
})

test('actual history-window options server-render the same window as the URL-backed data scope', async () => {
  const { readFile } = await import('node:fs/promises')
  const { stripTypeScriptTypes } = await import('node:module')
  const { parse, compileScript } = await import('@vue/compiler-sfc')
  const Vue = await import('vue')
  const { renderToString } = await import('@vue/server-renderer')
  const { HISTORY_WINDOWS } = await import('../utils/priceHistory.ts')
  const source = await readFile(new URL('../pages/product/[id].vue', import.meta.url), 'utf8')
  const select = [...source.matchAll(/<select\b[\s\S]*?<\/select>/g)].map(m => m[0]).find(html => html.includes('data-testid="history-window"'))
  assert(select)
  const { descriptor } = parse(`<script setup lang="ts">defineProps<{ historyDays: number }>(); const HISTORY_WINDOWS = __windows; const setHistoryDays = () => {};</script><template>${select}</template>`)
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'history-window', inlineTemplate: true }).content)
    .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace('export default', 'return')
  const component = new Function('Vue', '__windows', code)(Vue, HISTORY_WINDOWS)
  for (const days of HISTORY_WINDOWS) {
    const app = Vue.createSSRApp(component, { historyDays: days })
    app.config.globalProperties.$t = key => key
    const html = await renderToString(app)
    const selected = [...html.matchAll(/<option\b[^>]*>/g)].filter(m => /\bselected[\s=>]/.test(m[0]))
    assert.equal(selected.length, 1, html)
    assert.match(selected[0][0], new RegExp(`value="${days}"`))
  }
})

test('daily history table exposes exact selected-currency snapshots with closed accessible details', async () => {
  const { readFile } = await import('node:fs/promises')
  const { stripTypeScriptTypes } = await import('node:module')
  const { parse, compileScript } = await import('@vue/compiler-sfc')
  const Vue = await import('vue')
  const { renderToString } = await import('@vue/server-renderer')
  const { selectHistoryCurrency } = await import('../utils/priceHistory.ts')
  const source = await readFile(new URL('../pages/product/[id].vue', import.meta.url), 'utf8')
  const details = source.match(/<details[^>]+data-testid="history-daily-details"[\s\S]*?<\/details>/)?.[0]
  assert(details, 'Actual product page must provide the daily history details')
  const dateFunction = source.match(/function formatDate\([\s\S]*?\n\}/)?.[0]
  assert(dateFunction)
  const { descriptor } = parse(`<script setup lang="ts">const props = defineProps<{ priceHistory: any[], recordedCurrency: string | null, language: string }>(); const locale = { value: props.language }; const formatRecordedPrice = (amount: number) => __format(amount, props.recordedCurrency, props.language); ${dateFunction}</script><template>${details}</template>`)
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'daily-history', inlineTemplate: true }).content)
    .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace('export default', 'return')
  const component = new Function('Vue', '__format', code)(Vue, formatHistoryPrice)
  const history = [{ date: '2026-10-25T00:00:00.0000000', currency: 'EUR', medianPrice: 210, minPrice: 0, maxPrice: 420, sampleCount: 16 }, { date: '2026-10-26', currency: null, medianPrice: 9999 }, { date: '2026-10-26', currency: 'GBP', medianPrice: 8888 }]
  for (const language of ['en', 'de']) {
    const app = Vue.createSSRApp(component, { priceHistory: selectHistoryCurrency(history, 'EUR'), recordedCurrency: 'EUR', language })
    const labels = JSON.parse(await readFile(new URL(`../locales/${language}.json`, import.meta.url), 'utf8'))
    app.config.globalProperties.$t = key => labels.product[key.split('.')[1]]
    const html = await renderToString(app)
    assert.match(html, /<summary[^>]*>/)
    assert.doesNotMatch(html.slice(0, html.indexOf('>') + 1), /\sopen[\s=>]/)
    assert.match(html, /overflow-x-auto/)
    assert.match(html, /<caption[^>]*>[^<]+\(EUR\)\s*<\/caption>/)
    assert.equal((html.match(/scope="col"/g) ?? []).length, 5)
    assert.equal((html.match(/scope="row"/g) ?? []).length, 1)
    assert(html.includes(new Date('2026-10-25').toLocaleDateString(language, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })))
    for (const amount of [0, 210, 420]) assert(html.includes(formatHistoryPrice(amount, 'EUR', language)))
    assert.match(html, />16<\/td>/)
    assert.doesNotMatch(html, /9999|8888|GBP/)
  }
})
