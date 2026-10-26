import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as Vue from 'vue'
import { renderToString } from '@vue/server-renderer'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { getPlatformUrl } from '../utils/flipMarketplaceUrl.ts'
import { parseHistoryCurrency } from '../utils/priceHistory.ts'

const source = await readFile(new URL('../components/flipper/flipItem.vue', import.meta.url), 'utf8')
const { descriptor } = parse(source)
const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'flip-history', inlineTemplate: true }).content)
  .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
  .replace(/^import .*$/gm, '').replace('export default', 'return')

async function renderCard(listing, recentSells = []) {
  const localePath = ({ path, query, hash }) => '/de' + path + (Object.keys(query).length ? '?' + new URLSearchParams(query) : '') + hash
  const component = new Function('Vue', 'useI18n', 'useLocalePath', 'useUserStore', 'getPlatformUrl', 'parseHistoryCurrency', 'formatDistanceToNow', 'de', code)(
    Vue, () => ({ locale: Vue.ref('de'), t: key => key }), () => localePath, () => ({}), getPlatformUrl, parseHistoryCurrency, formatDistanceToNow, de,
  )
  const app = Vue.createSSRApp(component, { item: { listing, recentSells } })
  app.component('Icon', { render: () => null })
  app.component('NuxtLink', { props: ['to'], setup: (props, { slots }) => () => Vue.h('a', { href: props.to }, slots.default?.()) })
  app.config.globalProperties.$t = key => key
  return renderToString(app)
}

function historyHref(html) {
  const link = html.match(/<a\s[^>]*data-testid="flip-history"[^>]*>/)?.[0]
  return link?.match(/href="([^"]+)"/)?.[1].replaceAll('&amp;', '&') ?? null
}

test('actual bargain card links its exact product and recorded currency to the history anchor', async () => {
  const html = await renderCard({ id: '10539648861', platform: 'Vinted', title: 'PlayStation4', seoId: 'sony-playstation-4-used', currency: 'EUR', price: 60 }, [{ key: 'other-edition-used' }])
  assert.equal(historyHref(html), '/de/product/sony-playstation-4-used?history_currency=EUR#price-history')
  assert.match(html, /https:\/\/www\.vinted\.de\/items\/10539648861/, 'the external offer remains reachable')
  assert.match(html, /product\.referenceContext/, 'references retain their existing asking-price context')
})

test('unknown currency is not inferred for history and a missing source product never borrows a reference edition', async () => {
  assert.equal(historyHref(await renderCard({ id: '1', platform: 'Kleinanzeigen', seoId: 'unknown-edition-used' })), '/de/product/unknown-edition-used#price-history')
  assert.equal(historyHref(await renderCard({ id: '1', platform: 'Vinted', currency: 'EUR' }, [{ key: 'other-edition-used' }])), null)
  assert.equal(historyHref(await renderCard({ id: '1', platform: 'Vinted', seoId: ' ', currency: 'EUR' })), null)
})

test('other recorded currencies and unusual product IDs remain scoped to their exact source', async () => {
  const html = await renderCard({ id: '1', platform: 'Ebay', seoId: 'edition/limited?used', currency: ' gbp ' })
  assert.equal(historyHref(html), '/de/product/edition%2Flimited%3Fused?history_currency=GBP#price-history')
})
