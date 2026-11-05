import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import * as Vue from 'vue'
import { parse, compileScript } from '@vue/compiler-sfc'
import { renderToString } from '@vue/server-renderer'
import { lowestSameCurrencyOffer, referenceWebUrl, validAutomaticReference } from '../utils/shopReference.ts'
import { formatHistoryPrice, parseHistoryCurrency } from '../utils/priceHistory.ts'

const source = await readFile(new URL('../components/product/ShopReference.vue', import.meta.url), 'utf8')
const fixture = { selectedReference: { selector: '/price', price: 200, currency: 'PLN' }, url: 'https://shop.example/camera', host: 'shop.example', listing: { title: 'Camera body' }, priceCandidates: [{ selector: '/price', text: '200 PLN', price: 200, currency: 'PLN' }, { selector: '/shipping', text: '10 PLN delivery', price: 10, currency: 'PLN' }] }
const offers = [{ price: 5, currency: 'EUR', title: 'Euro camera' }, { price: 100, currency: 'PLN', title: 'Used camera body', condition: 'Used', listingUrl: 'https://market.example/camera' }, { price: 120, currency: 'PLN' }]

async function componentState(respond = async () => fixture, productId) {
  const { descriptor } = parse(source)
  const script = stripTypeScriptTypes(descriptor.scriptSetup.content.replace(/^import .*$/gm, '').replace(/const props = defineProps<.*>\(\)/, ''))
  const calls = []
  const props = Vue.reactive({ offers: [...offers], productId })
  let mounted, scheduled
  const factory = new Function('ref', 'computed', 'watch', 'props', 'useI18n', 'apiClient', '$fetch', 'lowestSameCurrencyOffer', 'referenceWebUrl', 'parseHistoryCurrency', 'onMounted', 'validAutomaticReference', 'onScopeDispose', 'setTimeout', 'clearTimeout', 'AUTOMATIC_REFERENCE_MAX_AGE_MS', `
    ${script}
    return { url, loading, error, preview, observedAt, selectedSelector, currencyLabel, confirmed, selectedPrice, currency, lowestOffer, clearPreview, loadPreview, automatic, automaticLoading, loadAutomatic };
  `)
  const scope = Vue.effectScope()
  const state = scope.run(() => factory(Vue.ref, Vue.computed, Vue.watch, props, () => ({ t: key => key, locale: Vue.ref('en') }), { getConfig: () => ({ baseURL: 'https://ane.example' }) }, async (url, options) => {
    calls.push({ url, options })
    return respond()
  }, lowestSameCurrencyOffer, referenceWebUrl, parseHistoryCurrency, (callback) => { mounted = callback }, validAutomaticReference, Vue.onScopeDispose, (callback, delay) => {
    scheduled = { callback, delay }
    return 1
  }, () => { scheduled = undefined }, 15 * 60_000))
  return { state, calls, props, mount: () => mounted(), stop: () => scope.stop(), scheduled: () => scheduled, expire: () => scheduled.callback() }
}

test('comparison uses explicit same-currency loaded offers and never cached EUR or unknown amounts', () => {
  assert.equal(lowestSameCurrencyOffer([...offers, ...[0, null, -1, NaN, Infinity, -Infinity, undefined].map(price => ({ price, currency: 'PLN' })), { price: 1, currency: null }], 'PLN'), offers[1])
  assert.equal(lowestSameCurrencyOffer([0, null, -1, NaN, Infinity, -Infinity, undefined].map(price => ({ price, currency: 'PLN' })), 'PLN'), null)
  assert.equal(lowestSameCurrencyOffer(offers, 'GBP'), null)
  assert.equal(lowestSameCurrencyOffer(offers, null), null)
  assert.equal(referenceWebUrl('javascript:alert(1)'), null)
  assert.equal(referenceWebUrl('https://user:password@shop.example/item'), null)
  assert.equal(referenceWebUrl(' https://shop.example/item '), 'https://shop.example/item')
})

test('actual component only fetches on explicit action, requires price selection, resets confirmation and preserves retries', async () => {
  const page = await componentState()
  try {
    assert.equal(page.calls.length, 0)
    page.state.url.value = ' https://shop.example/camera '
    await page.state.loadPreview()
    assert.equal(page.calls.length, 1)
    assert.deepEqual(page.calls[0].options, { method: 'POST', body: { url: 'https://shop.example/camera', locale: 'en-US' } })
    assert.equal(page.state.selectedPrice.value, undefined, 'even parser auto-selection must not choose a price for the user')
    assert.equal(page.state.confirmed.value, false)
    assert.match(page.state.observedAt.value, /^\d{4}-\d{2}-\d{2}T/)
    page.state.selectedSelector.value = '/price'
    await Vue.nextTick()
    assert.equal(page.state.currency.value, 'PLN')
    assert.equal(page.state.lowestOffer.value.price, 100)
    page.state.confirmed.value = true
    page.state.currencyLabel.value = 'gbp'
    await Vue.nextTick()
    assert.equal(page.state.confirmed.value, false)
    assert.equal(page.state.lowestOffer.value, null)
    assert.equal(page.state.selectedPrice.value.price, 200, 'editing the currency label never converts the amount')
    page.state.currencyLabel.value = '??'
    await Vue.nextTick()
    assert.equal(page.state.currency.value, null)
    assert.equal(page.state.currencyLabel.value, '??', 'invalid input stays editable')
    page.state.currencyLabel.value = 'PLN'
    await Vue.nextTick()
    page.state.confirmed.value = true
    page.props.offers = [{ price: 90, currency: 'PLN' }]
    await Vue.nextTick()
    assert.equal(page.state.confirmed.value, false, 'a changed comparison offer needs another identity check')
    page.state.confirmed.value = true
    page.state.selectedSelector.value = '/shipping'
    await Vue.nextTick()
    assert.equal(page.state.confirmed.value, false, 'choosing another amount requires verification again')
    page.state.url.value = 'https://shop.example/another-item'
    page.state.clearPreview()
    assert.equal(page.state.preview.value, null)
    assert.equal(page.state.selectedPrice.value, undefined)
  }
  finally { page.stop() }
  let attempt = 0
  const retry = await componentState(async () => {
    if (++attempt === 1) throw new Error('blocked')
    return fixture
  })
  try {
    retry.state.url.value = fixture.url
    await retry.state.loadPreview()
    assert.equal(retry.state.url.value, fixture.url)
    assert.equal(retry.state.loading.value, false)
    assert(retry.state.error.value)
    await retry.state.loadPreview()
    assert.equal(retry.state.error.value, '')
    assert.equal(retry.state.preview.value.url, fixture.url)
  }
  finally { retry.stop() }
})

async function renderReference(language, options = {}) {
  const seed = `automatic.value = __automatic; url.value = __fixture.url; preview.value = __fixture; observedAt.value = '2026-10-28T10:00:00Z'; selectedSelector.value = '/price'; currencyLabel.value = __currency; confirmed.value = __confirmed;`
  const { descriptor } = parse(source.replace('</script>', `${seed}\n</script>`))
  const compiled = stripTypeScriptTypes(compileScript(descriptor, { id: 'shop-reference', inlineTemplate: true }).content)
    .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace(/^import .*$/gm, '').replace('export default', 'return')
  const labels = JSON.parse(await readFile(new URL(`../locales/${language}.json`, import.meta.url), 'utf8'))
  const t = key => key.split('.').reduce((value, part) => value?.[part], labels) ?? key
  const component = new Function('Vue', 'useI18n', 'apiClient', 'formatHistoryPrice', 'parseHistoryCurrency', 'lowestSameCurrencyOffer', 'referenceWebUrl', '__fixture', '__currency', '__confirmed', '__automatic', 'validAutomaticReference', compiled)(Vue, () => ({ locale: Vue.ref(language), t }), {}, formatHistoryPrice, parseHistoryCurrency, lowestSameCurrencyOffer, referenceWebUrl, options.preview ?? fixture, options.currency ?? 'PLN', options.confirmed ?? false, options.automatic ?? null, validAutomaticReference)
  return renderToString(Vue.createSSRApp(component, { offers }))
}

test('actual reference component SSR exposes native contextual amounts and guards numeric difference behind explicit confirmation', async () => {
  for (const language of ['en', 'de']) {
    const contextual = await renderReference(language)
    assert.match(contextual, /<details\b/)
    assert.doesNotMatch(contextual.match(/<details[^>]*>/)[0], /\sopen[\s=>]/u, 'optional shop form is collapsed by default')
    assert.match(contextual, /<summary[^>]*min-h-11/)
    assert.match(contextual, /shop.example/)
    assert.match(contextual, /200,?\.?00?\s*(PLN|zł)|PLN\s*200/)
    assert.match(contextual, /Used/)
    assert.match(contextual, /Unknown|Unbekannt/)
    assert.match(contextual, /2026-10-28T10:00:00Z/)
    assert.doesNotMatch(contextual, /data-testid="shop-reference-gap"/)
    const verified = await renderReference(language, { confirmed: true })
    assert.match(verified, /data-testid="shop-reference-gap"/)
    assert.match(verified, /min-h-11/)
    assert.match(verified, /not resale profit|kein Wiederverkaufsgewinn/)
    const foreign = await renderReference(language, { currency: 'GBP', confirmed: true })
    assert.doesNotMatch(foreign, /data-testid="shop-reference-gap"/)
    assert.match(foreign, /No loaded offer|Kein geladenes Angebot/)
    const zero = await renderReference(language, { confirmed: true, preview: { ...fixture, priceCandidates: [{ ...fixture.priceCandidates[0], price: 0 }] } })
    assert.doesNotMatch(zero, /data-testid="shop-reference-gap"/)
    assert.match(zero, /No usable price found|Kein nutzbarer Preis gefunden/)
  }
})

test('actual shop selection excludes zero negative and nonfinite prices without manufacturing a price gap', async () => {
  const invalid = [0, -1, NaN, Infinity, -Infinity].map((price, index) => ({ selector: `/invalid/${index}`, text: 'No usable asking price', price, currency: 'PLN' }))
  const page = await componentState(async () => ({ ...fixture, priceCandidates: invalid }))
  try {
    page.state.url.value = fixture.url
    await page.state.loadPreview()
    assert.equal(page.state.error.value, '')
    assert.deepEqual(page.state.preview.value.priceCandidates.map(candidate => candidate.price), invalid.map(candidate => candidate.price), 'source response is kept intact')
    for (const candidate of invalid) {
      page.state.selectedSelector.value = candidate.selector
      await Vue.nextTick()
      assert.equal(page.state.selectedPrice.value, undefined)
      assert.equal(page.state.confirmed.value, false)
    }
  }
  finally { page.stop() }
})

test('malformed preview schemas use the visible retry error and preserve the entered URL', async () => {
  for (const malformed of [null, {}, { ...fixture, listing: null }, { ...fixture, priceCandidates: null }, { ...fixture, priceCandidates: [null] }, { ...fixture, priceCandidates: [{ ...fixture.priceCandidates[0], price: null }] }, { ...fixture, url: 'javascript:alert(1)' }]) {
    const page = await componentState(async () => malformed)
    try {
      page.state.url.value = fixture.url
      await page.state.loadPreview()
      assert.equal(page.state.preview.value, null)
      assert.equal(page.state.url.value, fixture.url)
      assert.equal(page.state.error.value, 'product.shopReference.error')
      assert.equal(page.state.loading.value, false)
    }
    finally { page.stop() }
  }
})

const automaticQuote = { provider: 'Lefeld', url: 'https://www.lefeld.de/knipex-kombizange-03-01-160-160mm', merchantSku: '10024102;12433', brand: 'KNIPEX', mpn: '03 01 160', gtin: '4003773013235', price: 10.07, currency: 'EUR', availability: 'LimitedAvailability', condition: 'unknown', observedAt: new Date().toISOString() }
const goToolsQuote = { ...automaticQuote, provider: 'GoTools', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/knipex-kombizange-laenge-160-mm-poliert-kunststoffueberzug_144938_35930', merchantSku: '35930', price: 10.99 }
const goToolsQuotes = [goToolsQuote,
  { ...goToolsQuote, mpn: '87 01 250', merchantSku: '18450', gtin: '4003773022022', url: 'https://www.gotools.de/marken/knipex/knipex-wasserpumpenzange-cobra-laenge-250-mm-spannweite-46-mm-poliert_127452_18450' },
  { ...goToolsQuote, mpn: '86 03 250', merchantSku: '18589', gtin: '4003773033837', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/sanitaerwerkzeuge/zangenschluessel/knipex-zangenschluessel-laenge-250-mm-spannweite-52-mm-verchromt-kunststoffueberzug_127591_18589' },
  { ...goToolsQuote, mpn: '26 12 200', merchantSku: '18690', gtin: '4003773023142', url: 'https://www.gotools.de/marken/knipex/knipex-flachrundzange-laenge-200-mm-poliert-gerade-mehrkomponenten-huellen_127692_18690' },
  { ...goToolsQuote, mpn: '26 15 200', merchantSku: '51163', gtin: '4003773035022', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/flachrundzangen-storchschnabelzangen/flachrundzange-storchschnabelzange/flachrundzange-knipex/knipex-flachrundzange-laenge-200-mm-verchromt-gerade-mehrkomponenten-huellen_160171_51163' },
  { ...goToolsQuote, mpn: '11 06 160', merchantSku: '18576', gtin: '4003773021933', url: 'https://www.gotools.de/marken/knipex/knipex-abisolierzange-laenge-160-mm-vde-verchromt-mehrkomponenten-huellen_127578_18576' },
  { ...goToolsQuote, mpn: '12 42 195', merchantSku: '18691', gtin: '4003773054580', url: 'https://www.gotools.de/marken/knipex/knipex-automatikabisolierzange-multistrip-10-laenge-195-mm-0-03-10-awg-32-7-mm_127693_18691' },
  { ...goToolsQuote, mpn: '97 53 04', merchantSku: '18581', gtin: '4003773028017', url: 'https://www.gotools.de/marken/knipex/knipex-aderendhuelsenzange-gesamtlaenge-180-mm-0-08-10-0-16-0-awg-28-5-mm_127583_18581' },
  { ...goToolsQuote, mpn: '12 12 02', merchantSku: '52547', gtin: '4003773048077', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/abisolierzangen/abisolierzange/praezisionsabisolierzange-knipex/knipex-praezisionsabisolierzange-laenge-195-mm-mehrkomponeten-huellen-0-03-2-08-awg-32-14-mm_161555_52547' },
  { ...goToolsQuote, mpn: '03 01 180', merchantSku: '35540', gtin: '4003773013242', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/knipex-kombizange-laenge-180-mm-poliert-kunststoffueberzug_144548_35540' },
  { ...goToolsQuote, mpn: '03 01 200', merchantSku: '57238', gtin: '4003773013259', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/knipex-kombizange-laenge-200-mm-poliert-kunststoffueberzug_166246_57238' },
  { ...goToolsQuote, mpn: '97 53 14', merchantSku: '18659', gtin: '4003773041474', url: 'https://www.gotools.de/marken/knipex/knipex-aderendhuelsenzange-gesamtlaenge-180-mm-0-08-10-0-awg-28-7-mm-brueniert-mehrkomponenten-huellen_127661_18659' },
  { ...goToolsQuote, mpn: '70 06 180', merchantSku: '18571', gtin: '4003773033813', url: 'https://www.gotools.de/marken/knipex/knipex-seitenschneider-laenge-180-mm-mehrkomponenten-huellen_127573_18571' },
  { ...goToolsQuote, mpn: '26 16 200', merchantSku: '18574', gtin: '4003773022831', url: 'https://www.gotools.de/marken/knipex/knipex-flachrundzange-laenge-200-mm-gerade-vde-mehrkomponenten-huellen_127576_18574' },
  { ...goToolsQuote, mpn: '26 26 200', merchantSku: '18575', gtin: '4003773022855', url: 'https://www.gotools.de/marken/knipex/knipex-flachrundzange-laenge-200-mm-40-gewinkelt-vde-mehrkomponenten-huellen_127577_18575' },
  { ...goToolsQuote, mpn: '12 40 200', merchantSku: '18578', gtin: '4003773026662', url: 'https://www.gotools.de/marken/knipex/knipex-automatikabisolierzange-laenge-200-mm-0-03-10-awg-32-7-mm_127580_18578' },
  { ...goToolsQuote, mpn: '97 52 36', merchantSku: '18579', gtin: '4003773051893', url: 'https://www.gotools.de/marken/knipex/knipex-crimpzange-preciforce-laenge-220-mm-0-5-6-awg-20-10-mm-487-g_127581_18579' },
  { ...goToolsQuote, mpn: '97 53 09', merchantSku: '18580', gtin: '4003773044550', url: 'https://www.gotools.de/marken/knipex/knipex-crimpzange-gesamtlaenge-190-mm-0-08-10-0-16-awg-28-5-mm-brueniert-2-komponenten-huellen_127582_18580' },
  { ...goToolsQuote, mpn: '87 01 125', merchantSku: '18583', gtin: '4003773069935', url: 'https://www.gotools.de/marken/knipex/knipex-wasserpumpenzange-cobra-laenge-125-mm-spannweite-27-mm-poliert-kunststoffueberzug_127585_18583' },
  { ...goToolsQuote, mpn: '87 01 560', merchantSku: '18585', gtin: '4003773044321', url: 'https://www.gotools.de/marken/knipex/knipex-rohr-und-wasserpumpenzange-cobra-laenge-560-mm-spannweite-120-mm-poliert-kunststoffueberzug_127587_18585' },
  { ...goToolsQuote, mpn: '87 01 150', merchantSku: '18590', gtin: '4003773060116', url: 'https://www.gotools.de/marken/knipex/knipex-wasserpumpenzange-cobra-laenge-150-mm-spannweite-30-mm_127592_18590' },
  { ...goToolsQuote, mpn: '86 03 150', merchantSku: '18660', gtin: '4003773069676', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/sanitaerwerkzeuge/zangenschluessel/knipex-zangenschluessel-laenge-150-mm-spannweite-27-mm-verchromt-kunststoffueberzug_127662_18660' },
  { ...goToolsQuote, mpn: '87 01 400', merchantSku: '18661', gtin: '4003773005636', url: 'https://www.gotools.de/marken/knipex/knipex-rohr-und-wasserpumpenzange-cobra-laenge-400-mm-spannweite-95-mm-poliert-kunststoffueberzug_127663_18661' },
  { ...goToolsQuote, mpn: '86 03 180', merchantSku: '18663', gtin: '4003773035466', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/sanitaerwerkzeuge/zangenschluessel/knipex-zangenschluessel-laenge-180-mm-spannweite-40-mm-verchromt-kunststoffueberzug_127665_18663' },
  { ...goToolsQuote, mpn: '86 03 300', merchantSku: '18664', gtin: '4003773041429', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/sanitaerwerkzeuge/zangenschluessel/knipex-zangenschluessel-laenge-300-mm-spannweite-60-mm-verchromt-kunststoffueberzug_127666_18664' },
  { ...goToolsQuote, mpn: '70 02 160', merchantSku: '18689', gtin: '4003773034032', url: 'https://www.gotools.de/marken/knipex/knipex-seitenschneider-laenge-160-mm-kopf-poliert-mehrkomponenten-huellen-max-2mm_127691_18689' },
  { ...goToolsQuote, mpn: '87 01 180', merchantSku: '18693', gtin: '4003773022015', url: 'https://www.gotools.de/marken/knipex/knipex-wasserpumpenzange-cobra-laenge-180-mm-spannweite-36-mm_127695_18693' },
  { ...goToolsQuote, mpn: '95 36 280', merchantSku: '18732', gtin: '4003773026891', url: 'https://www.gotools.de/marken/knipex/knipex-kabelschneider-gesamtlaenge-280-mm-max-52-380-mm-mm-mehrkomponenten-huellen-vde_127734_18732' },
  { ...goToolsQuote, mpn: '87 02 250', merchantSku: '18791', gtin: '4003773040316', url: 'https://www.gotools.de/marken/knipex/knipex-wasserpumpenzange-cobra-laenge-250-mm-spannweite-46-mm-poliert-mehrkomponenten-huellen_127793_18791' },
  { ...goToolsQuote, mpn: '87 03 250', merchantSku: '29360', gtin: '4003773043805', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/wasserpumpenzange/wasserpumpenzange-cobra-knipex/knipex-wasserpumpenzange-cobra-laenge-250-mm-spannweite-46-mm-verchromt-kunststoffueberzug_138364_29360' },
  { ...goToolsQuote, mpn: '97 21 215 C', merchantSku: '30072', gtin: '4003773019701', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/crimpzangen-und-zubehoer/crimpzangen/crimpzange-knipex/knipex-crimpzange-laenge-230-mm-0-5-6-awg-20-10-mm_139076_30072' },
  { ...goToolsQuote, mpn: '97 52 30', merchantSku: '30176', gtin: '4003773051855', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/crimpzangen-und-zubehoer/crimpzangen/crimpzange-preciforce-knipex/knipex-crimpzange-preciforce-laenge-220-mm-1-5-10-awg-15-11-mm-477-g_139180_30176' },
  { ...goToolsQuote, mpn: '97 52 33', merchantSku: '30187', gtin: '4003773051862', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/crimpzangen-und-zubehoer/crimpzangen/crimpzange-preciforce-knipex/knipex-crimpzange-preciforce-laenge-220-mm-0-5-10-awg-20-7-mm-478-g_139191_30187' },
  { ...goToolsQuote, mpn: '70 06 125', merchantSku: '31064', gtin: '4003773018124', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/seitenschneider/seitenschneider/seitenschneider-knipex/knipex-seitenschneider-laenge-125-mm-vde-mehrkomponenten-huellen_140068_31064' },
]

test('every reviewed GoTools article binds its own URL, manufacturer number, GTIN and merchant SKU', async () => {
  for (const reference of goToolsQuotes) {
    assert.equal(validAutomaticReference(reference), true, reference.mpn)
    assert.equal(validAutomaticReference({ ...reference, mpn: reference.mpn.replaceAll(' ', '-') }), true)
    for (const other of goToolsQuotes.filter(quote => quote !== reference)) {
      for (const field of ['url', 'mpn', 'gtin', 'merchantSku']) {
        assert.equal(validAutomaticReference({ ...reference, [field]: other[field] }), false, `${reference.mpn}: cross-article ${field}`)
      }
    }
    for (const change of [{ provider: 'Lefeld' }, { brand: 'Bahco' }, { url: reference.url + '?ref=other' },
      { url: reference.url + '#price' }, { url: reference.url.replace('www.gotools.de', 'www.gotools.de.evil.example') },
      { url: reference.url.replace('https:', 'http:') }, { url: reference.url.replace('www.gotools.de', 'user:password@www.gotools.de') }]) {
      assert.equal(validAutomaticReference({ ...reference, ...change }), false)
    }
    const page = await componentState(async () => ({ status: 'found', reference }), 'knipex-' + reference.mpn.replaceAll(' ', ''))
    try {
      await page.mount()
      assert.deepEqual(page.state.automatic.value.reference, reference)
      assert.equal(page.state.confirmed.value, false)
    }
    finally { page.stop() }
  }
})

test('GoTools automatic reference accepts only its reviewed URL paired with its provider', async () => {
  assert.equal(validAutomaticReference(goToolsQuote), true)
  assert.equal(validAutomaticReference({ ...goToolsQuote, brand: 'knipex', mpn: '03-01-160' }), true)
  for (const change of [
    { provider: 'Lefeld' }, { provider: 'Other' }, { url: automaticQuote.url },
    { url: goToolsQuote.url.replace('www.gotools.de', 'www.gotools.de.evil.example') },
    { url: goToolsQuote.url.replace('www.gotools.de', 'user:password@www.gotools.de') },
    { url: goToolsQuote.url.replace('https:', 'http:') }, { url: goToolsQuote.url + '?ref=other' },
    { url: goToolsQuote.url + '#price' }, { url: goToolsQuote.url.replace('_35930', '_35931') },
    { currency: 'SEK' }, { availability: 'OutOfStock' }, { condition: 'used' },
    { merchantSku: '144938' }, { brand: 'Bahco' }, { mpn: '03 01 180' },
    { gtin: '4003773013242' }, { gtin: null },
  ]) assert.equal(validAutomaticReference({ ...goToolsQuote, ...change }), false)
  const page = await componentState(async () => ({ status: 'found', reference: goToolsQuote }), 'knipex-0301160')
  try {
    await page.mount()
    assert.deepEqual(page.state.automatic.value.reference, goToolsQuote)
    assert.equal(page.state.confirmed.value, false)
  }
  finally { page.stop() }
})

test('actual automatic handler loads by exact product ID on mount using GET, without manual input or confirmation', async () => {
  const page = await componentState(async () => ({ status: 'found', reference: automaticQuote }), 'knipex/03 01 160')
  try {
    await page.mount()
    assert.equal(page.calls.length, 1)
    assert.equal(page.calls[0].url, 'https://ane.example/api/Product/knipex%2F03%2001%20160/shop-reference')
    assert.deepEqual(page.calls[0].options, { method: 'GET' })
    assert.deepEqual(page.state.automatic.value.reference, automaticQuote)
    assert.equal(page.state.preview.value, null)
    assert.equal(page.state.selectedPrice.value, undefined)
    assert.equal(page.state.confirmed.value, false)
    assert.equal(page.state.url.value, '')
  }
  finally { page.stop() }
  const manualOnly = await componentState()
  try {
    await manualOnly.mount()
    assert.equal(manualOnly.calls.length, 0)
  }
  finally { manualOnly.stop() }
})

test('automatic reference rejects invalid source/price/condition and permits a useful GET retry without losing manual input', async () => {
  for (const change of [{ url: 'https://wrong.example/knipex-03-01-160' }, { currency: 'USD' }, { price: 0 }, { price: Infinity }, { condition: 'used' }, { availability: 'OutOfStock' }, { observedAt: 'invalid' }, { brand: '' }]) {
    assert.equal(validAutomaticReference({ ...automaticQuote, ...change }), false)
  }
  let attempt = 0
  const page = await componentState(async () => ++attempt === 1 ? { status: 'found', reference: { ...automaticQuote, currency: 'USD' } } : { status: 'found', reference: automaticQuote }, 'knipex-0301160')
  try {
    page.state.url.value = fixture.url
    await page.mount()
    assert.equal(page.state.automatic.value.status, 'temporarily_unavailable')
    assert.equal(page.state.url.value, fixture.url)
    await page.state.loadAutomatic()
    assert.equal(page.state.automatic.value.status, 'found')
    assert.equal(page.calls.length, 2)
    assert(page.calls.every(call => call.options.method === 'GET'))
    assert.equal(page.state.url.value, fixture.url)
  }
  finally { page.stop() }
})

test('actual automatic markup labels unknown condition, source, currency and freshness without an automatic profit calculation', async () => {
  for (const language of ['en', 'de']) for (const reference of [automaticQuote, ...goToolsQuotes]) {
    const html = await renderReference(language, { automatic: { status: 'found', reference } })
    const automatic = html.slice(html.indexOf('<section'), html.indexOf('</section>'))
    assert.ok(automatic.includes(reference.provider))
    assert.ok(automatic.includes(reference.url))
    assert.ok(automatic.includes(reference.mpn))
    assert.match(automatic, /Condition unspecified|Zustand nicht angegeben/)
    assert.ok(automatic.includes(reference.observedAt))
    assert.match(automatic, reference.provider === 'Lefeld' ? /10[.,]07/ : /10[.,]99/)
    assert.match(automatic, /EUR/)
    assert.match(automatic, /not resale profit|kein Wiederverkaufsgewinn/)
    assert.match(automatic, /shipping cost unknown|Versandkosten unbekannt/)
    assert.doesNotMatch(automatic, /shop-reference-gap/)
    for (const amount of [200, 100]) assert(!automatic.includes(formatHistoryPrice(amount, 'PLN', language)))
    const unavailable = await renderReference(language, { automatic: { status: 'temporarily_unavailable' } })
    assert.match(unavailable, /Retry store reference|Shop-Referenz erneut laden/)
    assert.match(unavailable, /role="status"/)
  }
})

test('automatic quote rejects future and fifteen-minute-old observations at exact boundaries', () => {
  const now = Date.now()
  for (const age of [-1, 15 * 60_000, 16 * 60_000]) {
    assert.equal(validAutomaticReference({ ...automaticQuote, observedAt: new Date(now - age).toISOString() }, now), false)
  }
  for (const age of [0, 15 * 60_000 - 1]) {
    assert.equal(validAutomaticReference({ ...automaticQuote, observedAt: new Date(now - age).toISOString() }, now), true)
  }
})

test('mounted automatic quote expires after remaining lifetime without losing manual input and releases timer on stop', async () => {
  const reference = { ...automaticQuote, observedAt: new Date(Date.now() - 14 * 60_000).toISOString() }
  const page = await componentState(async () => ({ status: 'found', reference }), 'knipex-0301160')
  try {
    page.state.url.value = fixture.url
    await page.mount()
    assert.equal(page.state.automatic.value.status, 'found')
    assert(page.scheduled()?.delay > 59_000 && page.scheduled()?.delay <= 60_000)
    page.expire()
    assert.equal(page.state.automatic.value.status, 'temporarily_unavailable')
    assert.equal(page.state.automatic.value.reference, undefined)
    assert.equal(page.state.url.value, fixture.url)
    assert.equal(page.calls.length, 1, 'expiry offers an explicit retry instead of background retailer requests')
  }
  finally { page.stop() }
  assert.equal(page.scheduled(), undefined)
})

test('automatic reference resolving after unmount creates no timer or visible state', async () => {
  let resolve
  const response = new Promise((done) => {
    resolve = done
  })
  const page = await componentState(() => response, 'knipex-0301160')
  const pending = page.mount()
  page.stop()
  resolve({ status: 'found', reference: automaticQuote })
  await pending
  assert.equal(page.scheduled(), undefined)
  assert.equal(page.state.automatic.value, null)
})
