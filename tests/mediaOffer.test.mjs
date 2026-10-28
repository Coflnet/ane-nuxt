import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import * as Vue from 'vue'
import { compileScript, parse } from '@vue/compiler-sfc'
import { renderToString } from '@vue/server-renderer'
import * as prices from '../utils/searchCurrency.ts'
import { formatHistoryPrice } from '../utils/priceHistory.ts'

const source = await readFile(new URL('../pages/product/[id].vue', import.meta.url), 'utf8')
const markers = [
  { id: 'media-offer-native-used' }, { seoId: 'media-offer-native-used' },
  { identifierType: 'media_offer' }, { attributes: { product_kind: 'media_offer' } },
  { attributes: [{ key: 'product_kind', value: 'media_offer' }] },
]

test('each partial native media marker blocks content comparisons while retaining its native asking amount', () => {
  assert.equal(typeof prices.isUnidentifiedMediaOffer, 'function', 'unknown media needs a shared explicit content-identity guard')
  for (const marker of markers) {
    const product = { ...marker, scopedMinPrice: 15, scopedPriceCurrency: 'EUR' }
    assert.equal(prices.isUnidentifiedMediaOffer(product), true, JSON.stringify(marker))
    assert.equal(prices.isIndividualOffer(product), true, 'prefix-only media is still one offer')
    assert.equal(prices.nativeScopedPrice(product, 'EUR'), 15)
    assert.equal(prices.nativeScopedPrice(product, 'SEK'), undefined)
    assert.equal(prices.nativeScopedPrice({ ...product, scopedMinPrice: null, minPrice: 999 }, 'EUR'), undefined)
  }
  for (const product of [null, undefined, {}, { id: 'locoroco-psp-used' }, { id: 'named-media-offer-game' },
    { identifierType: 'video_game' }, { identifierType: 'paper_offer' }, { attributes: { product_kind: 'vinyl_record' } }])
    assert.equal(prices.isUnidentifiedMediaOffer(product), false)
})

function compile(script, template) {
  const { descriptor } = parse(`<script setup lang="ts">${script}</script><template>${template}</template>`)
  return stripTypeScriptTypes(compileScript(descriptor, { id: 'unknown-media-test', inlineTemplate: true }).content)
    .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace('export default', 'return')
}

async function renderDetail(product, language) {
  const { descriptor } = parse(source)
  const ast = compileScript(descriptor, { id: 'media-product-state' }).scriptSetupAst
  const names = ['isUnidentifiedMediaPage', 'isBroadProductGroup', 'priceStats']
  const declarations = names.map((name) => {
    const node = ast.find(node => node.type === 'VariableDeclaration' && node.declarations.some(declaration => declaration.id.name === name))
    assert(node, `Actual product page must define ${name}`)
    return descriptor.scriptSetup.content.slice(node.start, node.end)
  }).join('\n')
  const notice = source.match(/<(p|div)\b[^>]+data-testid="unidentified-media-notice"[\s\S]*?<\/\1>/)?.[0]
  assert(notice, 'Actual product page must explain that media content is unidentified')
  const stats = source.slice(source.indexOf('<!-- Price Stats -->'), source.indexOf('<!-- Attributes Section -->'))
  const history = source.slice(source.indexOf('<!-- Price History Chart -->'), source.indexOf('<!-- No Offers:'))
  const shop = source.match(/<ProductShopReference\b[^>]*\/>/)?.[0]
  assert(stats && history && shop, 'Render the actual existing page sections rather than replacement markup')
  const code = compile(`
    const props = defineProps<{ product: any, language: string }>();
    const product = Vue.ref(props.product), productId = props.product.id;
    const currentHistory = Vue.ref({ stats: { currency: 'EUR', averagePrice: 88, medianPrice: 88, dataPoints: 2, daysOfData: 2, trendPercent: 10 } });
    const recordedCurrency = Vue.ref('EUR');
    ${declarations}
    const availableOfferCount = 1, matches = [], historyDays = 90, HISTORY_WINDOWS = [7, 30, 90, 365];
    const selectedHistoryCurrency = 'EUR', historyCurrencyOptions = ['EUR'], historyLoading = false, historyError = null, excludedHistoryRows = 0;
    const priceHistory = [{ date: '2026-10-27', currency: 'EUR', minPrice: 15, medianPrice: 15, maxPrice: 15, sampleCount: 1 }, { date: '2026-10-28', currency: 'EUR', minPrice: 7, medianPrice: 7, maxPrice: 7, sampleCount: 1 }];
    const rawPriceHistory = priceHistory, setHistoryDays = () => {}, setHistoryCurrency = () => {}, refreshHistory = () => {};
    const formatDate = value => value, formatPrice = value => __format(value ?? 0, 'EUR', props.language);
    const formatRecordedPrice = value => __format(value, recordedCurrency.value, props.language);
    const chartWidth = 600, chartHeight = 200, chartPadding = 20, chartInnerHeight = 160, chartMinPrice = 7, chartMaxPrice = 15;
    const areaPath = '', medianLinePath = '', rangePath = '';
  `, `${notice}${stats}${history}${shop}`)
  const component = new Function('Vue', 'computed', 'isIndividualOffer', 'isUnidentifiedMediaOffer', '__format', code)(
    Vue, Vue.computed, prices.isIndividualOffer, prices.isUnidentifiedMediaOffer, formatHistoryPrice)
  const labels = JSON.parse(await readFile(new URL(`../locales/${language}.json`, import.meta.url), 'utf8'))
  const t = key => key.split('.').reduce((value, part) => value?.[part], labels) ?? key
  const app = Vue.createSSRApp(component, { product, language })
  app.config.globalProperties.$t = t
  app.component('ProductShopReference', { render: () => Vue.h('aside', { 'data-testid': 'rendered-retail-reference' }) })
  app.component('Icon', { render: () => null })
  return { html: await renderToString(app), t }
}

test('actual media detail retains raw native history and readable identity notice while hiding model/retail aggregates', async () => {
  for (const language of ['de', 'en']) {
    for (const marker of markers) {
      const product = { id: 'fixture-used', name: 'PSP UMD Spiel', avgPrice: 999, minPrice: 999, maxPrice: 999, hasActiveOffers: true, ...marker }
      const { html, t } = await renderDetail(product, language)
      assert.match(html, /data-testid="unidentified-media-notice"/)
      assert.doesNotMatch(html, /product\.(?:unidentifiedMedia|mediaHistory)/, 'translations must resolve in both locales')
      assert.match(html, /data-testid="history-daily-table"/)
      assert.match(html, /2026-10-27/)
      assert.match(html, /2026-10-28/)
      for (const amount of [15, 7]) assert(html.includes(formatHistoryPrice(amount, 'EUR', language)))
      for (const key of ['product.averagePrice', 'product.priceRange', 'product.historicalMedian'])
        assert(!html.includes(t(key)), `${key} must not present unknown media as an exact content comparison`)
      assert.doesNotMatch(html, /rendered-retail-reference|999|88[,.]00/)
    }
    const { html, t } = await renderDetail({ id: 'locoroco-psp-used', name: 'LocoRoco PSP', avgPrice: 30, minPrice: 20, maxPrice: 40 }, language)
    assert.doesNotMatch(html, /data-testid="unidentified-media-notice"/)
    assert.match(html, /data-testid="rendered-retail-reference"/)
    assert(html.includes(t('product.averagePrice')))
    assert(html.includes(t('product.historicalMedian')))
  }
})

test('actual search card keeps the individual-offer badge and selected native asking price for unknown media', async () => {
  const search = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
  const badge = search.match(/<span\b[^>]+data-testid="individual-offer-badge"[\s\S]*?<\/span>/)?.[0]
  const amount = search.match(/<div\b[^>]+data-testid="catalogue-price"[\s\S]*?<\/div>/)?.[0]
  assert(badge && amount)
  const code = compile(`defineProps<{ product: any }>(); const isIndividualOffer = __individual, nativeScopedPrice = __native; const selectedPriceCurrency = 'EUR'; const formatPrice = value => __format(value, 'EUR', 'en');`, `${badge}${amount}`)
  const component = new Function('Vue', '__individual', '__native', '__format', code)(Vue, prices.isIndividualOffer, prices.nativeScopedPrice, formatHistoryPrice)
  for (const marker of markers) {
    const app = Vue.createSSRApp(component, { product: { ...marker, scopedMinPrice: 15, scopedPriceCurrency: 'EUR', minPrice: 999 } })
    app.config.globalProperties.$t = key => key
    const html = await renderToString(app)
    assert.match(html, /data-testid="individual-offer-badge"/)
    assert.match(html, /individualOfferPrice/)
    assert(html.includes(formatHistoryPrice(15, 'EUR', 'en')))
    assert.doesNotMatch(html, /999/)
  }
})
