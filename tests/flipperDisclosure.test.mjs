import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { parse } from '@vue/compiler-dom'
import * as Vue from 'vue'
import { renderToString } from 'vue/server-renderer'

const source = await readFile(process.env.FLIPPER_DISCLOSURE_SOURCE || new URL('../pages/flipper.vue', import.meta.url), 'utf8')
const paidStart = source.indexOf('<!-- Flipper Tier Banner')
const comparisonStart = source.indexOf('<UiDefaultContainer\n      v-if="retailReferenceFlipsEnabled"', paidStart)
const paidTemplate = source.slice(paidStart, comparisonStart)
const filterTemplate = source.slice(source.indexOf('<!-- Filters -->'), source.indexOf('<!-- Feed -->'))
function nodes(node, predicate) {
  return [...(predicate(node) ? [node] : []), ...(node.children || []).flatMap(child => nodes(child, predicate))]
}
const elements = (node, tag) => nodes(node, entry => entry.type === 1 && entry.tag === tag)
const text = node => node.type === 2 ? node.content : (node.children || []).map(text).join('').trim()
async function render(template, state) {
  const app = Vue.createSSRApp({ render: Vue.compile(template), setup: () => state })
  app.component('UiDefaultContainer', { setup: (_, { slots }) => () => Vue.h('section', slots.default?.()) })
  app.component('UiLinkButton', { setup: (_, { slots }) => () => Vue.h('a', slots.default?.()) })
  app.component('Icon', { render: () => null })
  app.config.globalProperties.$t = key => key
  return parse(await renderToString(app))
}
function state(isFlipperTier = false, mode = 'sold') {
  return {
    isFlipperTier, sortMode: 'newest', hasSelectedCurrency: true, locationZip: '10115', userLocation: null,
    locationLabel: '', locationError: '', referenceMode: mode, availableCurrencies: ['GBP'], hasUnknownCurrency: false,
    availablePlatforms: ['Ebay', 'Kleinanzeigen'], hasActiveFilters: true, autoScroll: false, filteredItems: [], items: [],
    filters: Vue.reactive({ currency: 'GBP', platforms: ['Ebay'], search: 'Synthetic', minProfit: 10, minMarginPct: 25, minRefs: 3, category: 'tools', maxDistance: 25 }),
    localePath: path => path, clearFilters() {}, geocodeZip() {}, useDeviceLocation() {}, showSaveFilterDialog: false,
  }
}
function field(root, label) {
  return elements(root, 'div').find(node => (node.children || []).some(child => child.tag === 'label' && text(child) === label))
}

test('free feed keeps its upgrade destination without rendering unusable paid sort and location controls', async () => {
  const free = await render(paidTemplate, state(false))
  assert.equal(elements(free, 'select').length, 0)
  assert.equal(elements(free, 'input').length, 0)
  assert.equal(elements(free, 'a').length, 1)
  assert(elements(free, 'a')[0].props.some(prop => prop.name === 'to' && prop.value?.content === '/subscriptions?discount=EARLY'))
  assert.match(text(free), /flipperTierPromo/)
  const paid = await render(paidTemplate, state(true))
  assert.equal(elements(paid, 'select').length, 1)
  assert.equal(elements(paid, 'input').length, 2, 'ZIP and active radius stay editable for paid users')
  assert.doesNotMatch(text(paid), /flipperTierPromo/)
})

test('marketplace, search and absolute gap stay outside a closed More filters disclosure', async () => {
  const rendered = await render(filterTemplate, state())
  const more = elements(rendered, 'details').find(node => elements(node, 'summary').some(summary => text(summary) === 'product.filters.moreFilters'))
  assert(more, 'secondary controls need an explicit useful destination')
  assert(!more.props.some(prop => prop.name === 'open'), 'secondary controls start collapsed')
  assert(field(more, 'currency'))
  assert(field(more, 'product.minReferenceGapPercent'))
  assert(field(more, 'minRefs'))
  assert(field(more, 'category'))
  assert(field(rendered, 'product.minReferenceGap(GBP)'))
  assert.equal(field(more, 'product.minReferenceGap(GBP)'), undefined)
  assert(elements(rendered, 'input').some(input => input.props.some(prop => prop.name === 'placeholder' && prop.value?.content === 'searchFlips')))
  assert.equal(elements(more, 'input').some(input => input.props.some(prop => prop.name === 'placeholder' && prop.value?.content === 'searchFlips')), false)
  assert(elements(rendered, 'summary').some(summary => text(summary).startsWith('product.filters.marketplaces')))
})

test('disclosure and sold/retail presentation preserve existing filter values and mode-specific controls', async () => {
  const s = state(), before = JSON.stringify(s.filters)
  const sold = await render(filterTemplate, s)
  const soldRefs = field(sold, 'minRefs')
  assert(elements(soldRefs, 'input').some(input => input.props.some(prop => prop.name === 'value' && prop.value?.content === '3')))
  s.referenceMode = 'retail'
  const retail = await render(filterTemplate, s)
  assert.equal(field(retail, 'minRefs'), undefined)
  assert(!text(retail).includes('saveFilterNotify'))
  assert.equal(JSON.stringify(s.filters), before)
  s.referenceMode = 'sold'
  const restored = await render(filterTemplate, s)
  assert(field(restored, 'minRefs'))
  assert(text(restored).includes('saveFilterNotify'))
  assert.equal(JSON.stringify(s.filters), before)
})
