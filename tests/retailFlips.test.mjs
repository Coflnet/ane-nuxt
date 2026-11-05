import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as Vue from 'vue'
import { renderToString } from '@vue/server-renderer'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { getRetailPriceGap, getRetailReferenceUrl } from '../utils/retailFlip.ts'
import { getPlatformUrl } from '../utils/flipMarketplaceUrl.ts'
import { parseHistoryCurrency } from '../utils/priceHistory.ts'

function flip(now = Date.now()) {
  return {
    referenceMode: 'retail', retailPriceGap: 40,
    listing: { id: '123', title: 'New drill', platform: 'Ebay', currency: 'EUR', price: 60, attributes: { condition: 'new' } },
    retailReference: { provider: 'Lefeld', condition: 'new', availability: 'InStock', price: 100, currency: 'EUR', url: 'https://www.lefeld.de/drill', observedAt: new Date(now - 1000).toISOString(), expiresAt: new Date(now - 1000 + 900000).toISOString() },
  }
}

test('retail comparison requires explicit matching currency, known new quote, exact fresh expiry and matching positive finite gap', () => {
  const now = Date.now()
  const item = flip(now)
  assert.equal(getRetailPriceGap(item, now), 40)
  for (const quote of [
    { condition: 'used' }, { condition: null }, { provider: 'Other' }, { currency: 'GBP' }, { currency: null },
    { observedAt: new Date(now + 1000).toISOString() }, { expiresAt: new Date(now).toISOString() },
    { expiresAt: new Date(now + 1800000).toISOString() }, { price: Infinity },
  ]) assert.equal(getRetailPriceGap({ ...item, retailReference: { ...item.retailReference, ...quote } }, now), null, JSON.stringify(quote))
  for (const gap of [0, -1, Infinity, NaN, 41]) assert.equal(getRetailPriceGap({ ...item, retailPriceGap: gap }, now), null)
  assert.equal(getRetailPriceGap({ ...item, listing: { ...item.listing, currency: '' } }, now), null)
  assert.equal(getRetailPriceGap(item, Date.parse(item.retailReference.expiresAt)), null)
})

test('retail links allow only canonical provider HTTPS URLs', () => {
  assert.equal(getRetailReferenceUrl('Lefeld', 'https://www.lefeld.de/drill'), 'https://www.lefeld.de/drill')
  assert.equal(getRetailReferenceUrl('GoTools', 'https://www.gotools.de/drill'), 'https://www.gotools.de/drill')
  for (const url of ['http://www.lefeld.de/drill', 'https://lefeld.de/drill', 'https://www.lefeld.de.evil.test/drill', 'https://user@www.lefeld.de/drill', 'https://www.lefeld.de:8443/drill', 'https://www.lefeld.de/drill?x=1', 'https://www.lefeld.de/drill#x', 'javascript:alert(1)']) assert.equal(getRetailReferenceUrl('Lefeld', url), null)
  assert.equal(getRetailReferenceUrl('GoTools', 'https://www.lefeld.de/drill'), null)
})

const source = await readFile(new URL('../components/flipper/flipItem.vue', import.meta.url), 'utf8')
const { descriptor } = parse(source)
const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'retail-card', inlineTemplate: true }).content)
  .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
  .replace(/^import .*$/gm, '').replace('export default', 'return')
async function renderCard(item) {
  const component = new Function('Vue', 'useI18n', 'useLocalePath', 'useUserStore', 'getPlatformUrl', 'parseHistoryCurrency', 'formatDistanceToNow', 'de', 'getRetailPriceGap', 'getRetailReferenceUrl', code)(
    Vue, () => ({ locale: Vue.ref('en'), t: key => key }), () => value => value.path, () => ({}), getPlatformUrl, parseHistoryCurrency, formatDistanceToNow, de, getRetailPriceGap, getRetailReferenceUrl,
  )
  const app = Vue.createSSRApp(component, { item })
  app.component('Icon', { render: () => null })
  app.component('NuxtLink', { render: () => null })
  app.config.globalProperties.$t = key => key
  return renderToString(app)
}

test('actual retail card renders retailer source, quote and gap without sold-history labels or values', async () => {
  const item = flip()
  const html = await renderCard({ ...item, medianPrice: 999, potentialProfit: 999, recentSells: [{ price: 999 }] })
  assert.match(html, /retailFlips.gap/)
  assert.match(html, /retailFlips.price/)
  assert.match(html, /retailFlips.context/)
  assert.match(html, /https:\/\/www.lefeld.de\/drill/)
  assert.match(html, /Lefeld/)
  assert.match(html, new RegExp(item.retailReference.observedAt))
  assert.doesNotMatch(html, /product.referenceMedian|product.referenceGap|product.referenceContext|999/)
  const expired = await renderCard(flip(Date.now() - 900000))
  assert.match(expired, /retailFlips.expired/)
  assert.doesNotMatch(expired, /retailFlips.gap|https:\/\/www.lefeld.de/)
})

test('actual card expiry timer removes comparison when its quote expires without a feed response', () => {
  const item = flip(1000000)
  const quoteNow = Vue.ref(1000000)
  let timer
  let current = 1000000
  const schedule = stripTypeScriptTypes(source.match(/function scheduleQuoteExpiry\([\s\S]*?\n\}/)[0])
  new Function('props', 'quoteNow', 'Date', 'setTimeout', 'clearTimeout', 'getRetailPriceGap', `let expiryTimer; ${schedule}; scheduleQuoteExpiry()`)(
    { item }, quoteNow, { now: () => current, parse: Date.parse }, (callback, delay) => {
      timer = { callback, delay }
      return 1
    }, () => {}, getRetailPriceGap,
  )
  assert.equal(getRetailPriceGap(item, quoteNow.value), 40)
  assert.equal(timer.delay, 899000)
  current += timer.delay
  timer.callback()
  assert.equal(getRetailPriceGap(item, quoteNow.value), null)
})

const page = await readFile(new URL('../pages/flipper.vue', import.meta.url), 'utf8')
test('retail save handler cannot create a sold-history alert', async () => {
  const save = stripTypeScriptTypes(page.slice(page.indexOf('async function saveFlipFilter()'), page.indexOf('// --- Filters (persisted')))
  const handler = new Function('referenceMode', `${save}; return saveFlipFilter`)({ value: 'retail' })
  await handler()
})

test('actual live connect handler does not open a retail socket', async () => {
  const connect = stripTypeScriptTypes(page.match(/async function connectLiveFlips\([\s\S]*?\n\}/)[0])
  await new Function('referenceMode', `${connect}; return connectLiveFlips()`)({ value: 'retail' })
})

test('actual retail feed keeps marketplace and reference-provider scopes independent and ignores sold reference counts', () => {
  const lef = flip()
  const go = { ...flip(), listing: { ...flip().listing, id: '456', platform: 'Kleinanzeigen' }, retailReference: { ...flip().retailReference, provider: 'GoTools', url: 'https://www.gotools.de/drill' } }
  const items = Vue.ref([lef, go])
  const filters = Vue.reactive({ platforms: [], currency: 'EUR', minProfit: 0, minMarginPct: 0, minRefs: 10, search: '', category: '', maxDistance: 0 })
  const referenceProvider = Vue.ref('')
  const filtered = stripTypeScriptTypes(page.slice(page.indexOf('const filteredItems = computed'), page.indexOf('onMounted(async () =>')))
  const select = new Function('computed', 'items', 'filters', 'referenceMode', 'referenceProvider', 'getRetailPriceGap', 'getFlipCurrency', 'hasSelectedCurrency', 'hasComparableFlip', 'sortMode', 'userLocation', `${filtered}; return filteredItems`)(
    Vue.computed, items, filters, { value: 'retail' }, referenceProvider, getRetailPriceGap, item => item.listing.currency, { value: true }, item => getRetailPriceGap(item) !== null, { value: 'profit' }, { value: null },
  )
  assert.equal(select.value.length, 2)
  filters.minMarginPct = 50
  assert.equal(select.value.length, 2, '40 gap / 60 asking price clears a 50% threshold')
  filters.minMarginPct = 70
  assert.deepEqual(select.value, [], 'the same gap fails a 70% threshold')
  filters.minMarginPct = 0
  referenceProvider.value = 'GoTools'
  assert.equal(select.value[0].listing.id, '456')
  filters.platforms = ['Ebay']
  assert.deepEqual(select.value, [])
  referenceProvider.value = 'Lefeld'
  assert.equal(select.value[0].listing.id, '123')
  filters.currency = 'GBP'
  assert.deepEqual(select.value, [])
})

test('actual comparison controls are absent by default and expose mode/provider only when the runtime capability is enabled', async () => {
  const end = page.indexOf('<!-- Filters -->')
  const start = page.lastIndexOf('<UiDefaultContainer', end)
  const template = page.slice(start, end)
  const config = await readFile(new URL('../nuxt.config.ts', import.meta.url), 'utf8')
  assert.match(config, /retailReferenceFlipsEnabled: false/)
  const flagSource = page.match(/const retailReferenceFlipsEnabled = [^\n]+/)[0]
  for (const flag of [undefined, false, 'false', true, 'true']) {
    const enabled = new Function('useRuntimeConfig', `${flagSource}; return retailReferenceFlipsEnabled`)(() => ({ public: { retailReferenceFlipsEnabled: flag } }))
    const app = Vue.createSSRApp({ render: Vue.compile(template), setup: () => ({ retailReferenceFlipsEnabled: enabled, referenceMode: Vue.ref('retail'), referenceProvider: Vue.ref('Lefeld') }) })
    app.component('UiDefaultContainer', { setup: (_, { slots }) => () => Vue.h('section', slots.default?.()) })
    app.config.globalProperties.$t = key => key
    const html = await renderToString(app)
    if (flag === true || flag === 'true') {
      assert.match(html, /value="sold"/)
      assert.match(html, /value="retail"/)
      assert.match(html, /value="Lefeld"/)
      assert.match(html, /value="GoTools"/)
      assert.match(html, /retailFlips.scope/)
    }
    else {
      assert.doesNotMatch(html, /retailFlips|<select|Lefeld|GoTools/)
    }
  }
})

test('actual retail append refreshes known visible and queued quotes instead of deduplicating away current evidence', async () => {
  const original = flip(Date.now() - 900000)
  const fresh = flip()
  const items = Vue.ref([original])
  const replayQueue = Vue.ref([{ ...original, listing: { ...original.listing, id: 'queued' } }])
  const queuedFresh = { ...fresh, listing: { ...fresh.listing, id: 'queued' } }
  const prepare = stripTypeScriptTypes(page.match(/function prepareIncomingFlips\([\s\S]*?\n\}/)[0])
  const append = stripTypeScriptTypes(page.match(/async function appendIncomingFlips\([\s\S]*?\n\}/)[0])
  const key = item => item.listing.id
  const known = () => new Set([...items.value, ...replayQueue.value].map(key))
  const run = new Function('referenceMode', 'items', 'replayQueue', 'getFlipKey', 'getKnownFlipKeys', 'sortByFoundAt', `${prepare}; ${append}; return appendIncomingFlips`)(
    { value: 'retail' }, items, replayQueue, key, known, items => items,
  )
  await run([fresh, queuedFresh])
  assert.equal(getRetailPriceGap(items.value[0]), 40)
  assert.equal(getRetailPriceGap(replayQueue.value[0]), 40)
  assert.equal(items.value.length, 1)
  assert.equal(replayQueue.value.length, 1)
})

test('initial retail scope rejects used or unknown listings, unavailable stock, non-EUR pairs and unsafe sources', () => {
  const item = flip()
  for (const condition of ['used', 'New', '', undefined]) {
    assert.equal(getRetailPriceGap({ ...item, listing: { ...item.listing, attributes: { condition } } }), null, `listing condition ${condition}`)
  }
  for (const availability of ['OutOfStock', 'Unknown', '', undefined]) {
    assert.equal(getRetailPriceGap({ ...item, retailReference: { ...item.retailReference, availability } }), null, `availability ${availability}`)
  }
  for (const currency of ['SEK', 'GBP', 'USD']) {
    assert.equal(getRetailPriceGap({ ...item, listing: { ...item.listing, currency }, retailReference: { ...item.retailReference, currency } }), null, `currency ${currency}`)
  }
  for (const url of ['', 'https://www.gotools.de/drill', 'https://www.lefeld.de/drill?offer=1', 'javascript:alert(1)']) {
    assert.equal(getRetailPriceGap({ ...item, retailReference: { ...item.retailReference, url } }), null, `url ${url}`)
  }
  assert.equal(getRetailPriceGap({ ...item, retailReference: { ...item.retailReference, availability: 'LimitedAvailability' } }), 40)
})

test('retail percentage label states the asking-price denominator used by the actual filter', async () => {
  const en = JSON.parse(await readFile(new URL('../locales/en.json', import.meta.url), 'utf8'))
  const de = JSON.parse(await readFile(new URL('../locales/de.json', import.meta.url), 'utf8'))
  assert.match(en.retailFlips.minGapPercent, /% of asking price/)
  assert.match(de.retailFlips.minGapPercent, /% des Angebotspreises/)
})

test('actual card suppresses a verified comparison for out-of-contract listing, currency, stock or URL', async () => {
  const item = flip()
  for (const invalid of [
    { ...item, listing: { ...item.listing, attributes: { condition: 'used' } } },
    { ...item, listing: { ...item.listing, currency: 'SEK' }, retailReference: { ...item.retailReference, currency: 'SEK' } },
    { ...item, retailReference: { ...item.retailReference, availability: 'OutOfStock' } },
    { ...item, retailReference: { ...item.retailReference, url: 'https://evil.test/drill' } },
  ]) {
    const html = await renderCard(invalid)
    assert.match(html, /retailFlips.expired/)
    assert.doesNotMatch(html, /retailFlips.gap|https:\/\/www.lefeld.de|https:\/\/evil.test/)
  }
})
