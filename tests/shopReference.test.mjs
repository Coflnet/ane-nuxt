import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import * as Vue from 'vue'
import { parse, compileScript } from '@vue/compiler-sfc'
import { renderToString } from '@vue/server-renderer'
import { lowestSameCurrencyOffer, referenceWebUrl } from '../utils/shopReference.ts'
import { formatHistoryPrice, parseHistoryCurrency } from '../utils/priceHistory.ts'

const source = await readFile(new URL('../components/product/ShopReference.vue', import.meta.url), 'utf8')
const fixture = { selectedReference: { selector: '/price', price: 200, currency: 'PLN' }, url: 'https://shop.example/camera', host: 'shop.example', listing: { title: 'Camera body' }, priceCandidates: [{ selector: '/price', text: '200 PLN', price: 200, currency: 'PLN' }, { selector: '/shipping', text: '10 PLN delivery', price: 10, currency: 'PLN' }] }
const offers = [{ price: 5, currency: 'EUR', title: 'Euro camera' }, { price: 100, currency: 'PLN', title: 'Used camera body', condition: 'Used', listingUrl: 'https://market.example/camera' }, { price: 120, currency: 'PLN' }]

async function componentState(respond = async () => fixture) {
  const { descriptor } = parse(source)
  const script = stripTypeScriptTypes(descriptor.scriptSetup.content.replace(/^import .*$/gm, '').replace('const props = defineProps<{ offers: ShopOffer[] }>()', ''))
  const calls = []
  const props = Vue.reactive({ offers: [...offers] })
  const factory = new Function('ref', 'computed', 'watch', 'props', 'useI18n', 'apiClient', '$fetch', 'lowestSameCurrencyOffer', 'referenceWebUrl', 'parseHistoryCurrency', `
    ${script}
    return { url, loading, error, preview, observedAt, selectedSelector, currencyLabel, confirmed, selectedPrice, currency, lowestOffer, clearPreview, loadPreview };
  `)
  const scope = Vue.effectScope()
  const state = scope.run(() => factory(Vue.ref, Vue.computed, Vue.watch, props, () => ({ t: key => key, locale: Vue.ref('en') }), { getConfig: () => ({ baseURL: 'https://ane.example' }) }, async (url, options) => {
    calls.push({ url, options })
    return respond()
  }, lowestSameCurrencyOffer, referenceWebUrl, parseHistoryCurrency))
  return { state, calls, props, stop: () => scope.stop() }
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
  const seed = `url.value = __fixture.url; preview.value = __fixture; observedAt.value = '2026-10-28T10:00:00Z'; selectedSelector.value = '/price'; currencyLabel.value = __currency; confirmed.value = __confirmed;`
  const { descriptor } = parse(source.replace('</script>', `${seed}\n</script>`))
  const compiled = stripTypeScriptTypes(compileScript(descriptor, { id: 'shop-reference', inlineTemplate: true }).content)
    .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace(/^import .*$/gm, '').replace('export default', 'return')
  const labels = JSON.parse(await readFile(new URL(`../locales/${language}.json`, import.meta.url), 'utf8'))
  const t = key => key.split('.').reduce((value, part) => value?.[part], labels) ?? key
  const component = new Function('Vue', 'useI18n', 'apiClient', 'formatHistoryPrice', 'parseHistoryCurrency', 'lowestSameCurrencyOffer', 'referenceWebUrl', '__fixture', '__currency', '__confirmed', compiled)(Vue, () => ({ locale: Vue.ref(language), t }), {}, formatHistoryPrice, parseHistoryCurrency, lowestSameCurrencyOffer, referenceWebUrl, options.preview ?? fixture, options.currency ?? 'PLN', options.confirmed ?? false)
  return renderToString(Vue.createSSRApp(component, { offers }))
}

test('actual reference component SSR exposes native contextual amounts and guards numeric difference behind explicit confirmation', async () => {
  for (const language of ['en', 'de']) {
    const contextual = await renderReference(language)
    assert.match(contextual, /^<details\b/)
    assert.doesNotMatch(contextual.slice(0, contextual.indexOf('>') + 1), /\sopen[\s=>]/u, 'optional shop form is collapsed by default')
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
