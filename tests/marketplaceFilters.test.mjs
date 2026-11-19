import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { compileScript, parse } from 'vue/compiler-sfc'
import * as vue from 'vue'
import { activeMarketplaces, condidtion, marketplaces, filterFreeMarketplaces } from '../constants/CreateFilterConstants.ts'
import { parseFilterPrefillQuery, prefillFormFields } from '../utils/filterPrefill.ts'
import { buildFilters, defaultFilterState, parseFilters } from '../utils/filterWire.ts'

const { computed, effectScope, nextTick, ref, toRaw, watch } = vue

// The page's initialization (defaults + prefill), edit loader and wire serializer are the
// pure utils pages/filters/create.vue calls.
async function page(query = {}, saved = []) {
  const prefill = 'id' in query ? {} : prefillFormFields(parseFilterPrefillQuery(query, marketplaces.map(m => m.value)))
  const filter = ref(defaultFilterState())
  const ctx = { freeMarketplaces: filterFreeMarketplaces(marketplaces).map(m => m.value), location: null, attributesSupported: true }
  return {
    filter,
    applyPrefillFromQuery: () => Object.assign(filter.value, prefill),
    loadEditParam: async () => {
      const entry = saved.find(item => Number(item.id) === Number(query.id))
      filter.value = { ...parseFilters(entry.filters), id: entry.id }
    },
    handleFilters: async () => buildFilters(toRaw(filter.value), ctx),
  }
}

// Compile actual SFC setup, replacing only imports and the component model boundary.
async function field(filename, model) {
  const { descriptor } = parse(await readFile(new URL(`../components/filters/${filename}.vue`, import.meta.url), 'utf8'))
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'marketplace-field' }).content)
    .replace(/import\s*\{([^}]*)\}\s*from\s*['"]vue['"]/g, (_, names) => `const {${names.replace(/\bas\b/g, ':')}} = __vue`)
    .replace(/import\s*\{([^}]*)\}\s*from\s*['"]~\/constants\/CreateFilterConstants['"]/g, (_, names) => `const {${names}} = __constants`)
    .replace('export default', 'return')
  const component = new Function('__vue', '__constants', 'ref', 'computed', 'watch', 'useUserStore', 'onMounted', code)(
    { ...vue, useModel: () => model }, { marketplaces, frequency: [], condidtion }, ref, computed, watch, () => ({ currentPlan: { product: 'collector' }, ensureEntitlements: async () => {} }), fn => fn(),
  )
  const scope = effectScope()
  const state = scope.run(() => component.setup({}, { expose() {}, emit() {} }))
  return { state, stop: () => scope.stop() }
}

const advertised = ['Ebay', 'Kleinanzeigen', 'Marktplaats', 'Willhaben', 'Vinted', 'Blocket', 'ParuVendu', 'OLX', 'Gumtree', 'Shpock', 'Wallapop', 'AutoScout24', 'Craigslist']

test('all exposes and serializes all eleven sources and legacy choices in both timezones', async () => {
  assert.deepEqual(activeMarketplaces.map(m => m.value), advertised.slice(0, 11))
  for (const zone of ['America/New_York', 'Europe/Berlin']) {
    const previous = process.env.TZ
    try {
      process.env.TZ = zone
      const p = await page()
      const ui = await field('SearchValueMarketplaceFilter', p.filter)
      assert.deepEqual(ui.state.resolvedMarketplaceOptions.value.map(m => m.value), ['all', ...advertised])
      const wire = await p.handleFilters()
      assert.equal(wire.find(f => f.name === 'IncludePlatforms').value, advertised.join(','))
      assert.equal(wire.find(f => f.name === 'ReferenceCurrency').value, 'EUR')
      ui.stop()
    }
    finally {
      if (previous === undefined) delete process.env.TZ
      else process.env.TZ = previous
    }
  }
})

test('reloaded explicit selections remain explicit, including a retired source', async () => {
  for (const value of ['Ebay,Kleinanzeigen,AutoScout24,Marktplaats,Willhaben', 'Craigslist', 'Shpock,ParuVendu']) {
    const p = await page({ id: '12' }, [{ id: 12, filters: [{ name: 'IncludePlatforms', value }] }])
    await p.loadEditParam()
    const ui = await field('SearchValueMarketplaceFilter', p.filter)
    assert.equal(p.filter.value.marketplace, value)
    assert.deepEqual(ui.state.selectedMarketplaces.value.map(m => m.value).sort(), value.split(',').sort())
    assert.equal((await p.handleFilters()).find(f => f.name === 'IncludePlatforms').value, value)
    ui.stop()
  }
})

test('new-source prefills and actual marketplace picker serialize canonical explicit selections', async () => {
  for (const source of advertised.slice(4, 11)) {
    const p = await page({ marketplace: source.toLowerCase(), searchValue: 'camera' })
    p.applyPrefillFromQuery()
    const ui = await field('SearchValueMarketplaceFilter', p.filter)
    assert.equal(p.filter.value.marketplace, source)
    ui.state.selectedMarketplaces.value = marketplaces.filter(m => ['Vinted', source].includes(m.value))
    assert.equal((await p.handleFilters()).find(f => f.name === 'IncludePlatforms').value, p.filter.value.marketplace)
    ui.stop()
  }
})

test('budget smart defaults serialize the correct currency without converting amounts', async () => {
  for (const [platform, currency] of [['Gumtree', 'GBP'], ['Blocket', 'SEK'], ['OLX', 'PLN']]) {
    const p = await page({ marketplace: platform })
    p.applyPrefillFromQuery()
    const ui = await field('PriceConditionFilter', p.filter)
    assert.equal(ui.state.budgetCurrency.value, currency)
    let wire = await p.handleFilters()
    assert.equal(wire.find(f => f.name === 'ReferenceCurrency').value, currency)
    assert.equal(wire.find(f => f.name === 'PriceRange'), undefined, 'a new filter defaults to any price')
    ui.state.budgetCurrency.value = 'EUR'
    p.filter.value.marketplace = 'Gumtree,Blocket'
    await nextTick()
    wire = await p.handleFilters()
    assert.equal(wire.find(f => f.name === 'ReferenceCurrency').value, 'EUR')
    assert.equal(wire.find(f => f.name === 'PriceRange'), undefined, 'a new filter defaults to any price')
    ui.stop()
  }
})

test('saved implicit EUR and imported reference amounts retain their original currency', async () => {
  const p = await page({ id: '12' }, [{ id: 12, filters: [{ name: 'IncludePlatforms', value: 'Gumtree' }, { name: 'PriceRange', value: '12-48' }] }])
  await p.loadEditParam()
  const ui = await field('PriceConditionFilter', p.filter)
  assert.equal(ui.state.budgetCurrency.value, 'EUR')
  p.filter.value.referenceUrl = 'https://example.com/item'
  p.filter.value.referencePrice = 40
  p.filter.value.referenceCurrency = 'GBP'
  ui.state.budgetCurrency.value = 'SEK'
  assert.equal(ui.state.budgetCurrency.value, 'GBP')
  const wire = await p.handleFilters()
  assert.equal(wire.find(f => f.name === 'ReferencePrice').value, '40')
  assert.equal(wire.find(f => f.name === 'ReferenceCurrency').value, 'GBP')
  assert.equal(wire.find(f => f.name === 'PriceRange').value, '12-48')
  ui.stop()
})

test('condition dropdown keeps a prefilled or saved choice and shows "all" for an omitted condition', async () => {
  for (const [condition, expected] of [['used', ['used']], ['broken', ['broken']], ['', ['all']], ['new,used', ['new', 'used']]]) {
    const p = await page()
    p.filter.value.condition = condition
    const ui = await field('ConditionFilter', p.filter)
    assert.deepEqual(ui.state.conditionSelected.value.map(option => option.value), expected)
    ui.stop()
  }
})
