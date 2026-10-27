import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

const source = await readFile(new URL('../pages/flipper.vue', import.meta.url), 'utf8')
const currencyBody = source.match(/function getFlipCurrency\(item: Flip\): string \{([\s\S]*?)\n\}/)[1]
const getCurrency = new Function('item', 'legacyEuroPlatforms', currencyBody)
const legacy = new Set(['Kleinanzeigen', 'Marktplaats', 'Willhaben'])

test('actual feed currency logic preserves explicit normalized currency and only infers blank legacy EUR', () => {
  for (const platform of [...legacy, 'Ebay']) {
    assert.equal(getCurrency({ listing: { platform, currency: ' pln ' } }, legacy), 'PLN')
    assert.equal(getCurrency({ listing: { platform, currency: 'bad-code' } }, legacy), '')
    assert.equal(getCurrency({ listing: { platform, currency: '  ' } }, legacy), legacy.has(platform) ? 'EUR' : '')
    assert.equal(getCurrency({ listing: { platform, currency: ' eur ' } }, legacy), 'EUR')
  }
})

const saveSource = source.slice(source.indexOf('async function saveFlipFilter()'), source.indexOf('// --- Filters (persisted'))
const save = new Function('filterName', 'userStore', 'hasSelectedCurrency', 'filters', 'filterNotifyType', 'filterNotifyTarget', 'addFilter', 'showSaveFilterDialog', 'push', 'useI18n',
  stripTypeScriptTypes(saveSource) + '\nreturn saveFlipFilter')

test('actual save handler persists percentage threshold and selected comparison currency', async () => {
  for (const currency of ['EUR', 'PLN']) {
    let body
    const dialog = { value: true }
    const handler = save({ value: '50 percent' }, { token: 'test', user: { id: 'test' } }, { value: true },
      { platforms: [], currency, search: '', minProfit: 0, minMarginPct: 50, minRefs: 0, category: '' }, { value: 'none' }, { value: '' },
      async (request) => { body = request.body }, dialog, {
        success() {},
        error() { assert.fail('save failed') },
      }, () => ({ t: key => key }))
    await handler()
    assert.deepEqual(body.filters, [{ name: 'IsFlipNotification', value: 'true' }, { name: 'ReferenceCurrency', value: currency }, { name: 'MinMarginPct', value: '50' }])
    assert.equal(dialog.value, false)
  }
})

const comparableBody = source.match(/function hasComparableFlip\(item: Flip\): boolean \{([\s\S]*?)\n\}/)[1]
const comparable = new Function('item', 'getFlipCurrency', 'currencyKeyMarker', comparableBody)
const marker = String.fromCharCode(31) + 'currency:'
test('actual feed comparability checks the normalized source currency', () => {
  const getFlipCurrency = item => getCurrency(item, legacy)
  const item = { listing: { platform: 'Kleinanzeigen', currency: ' pln ' }, recentSells: [{ key: 'product' + marker + 'PLN' }] }
  assert.equal(comparable(item, getFlipCurrency, marker), true)
  assert.equal(comparable({ ...item, recentSells: [{ key: 'product' }] }, getFlipCurrency, marker), false)
  assert.equal(comparable({ ...item, listing: { ...item.listing, currency: 'bad-code' } }, getFlipCurrency, marker), false)
  assert.equal(comparable({ ...item, listing: { ...item.listing, currency: ' eur ' } }, getFlipCurrency, marker), true)
})

const filteredSource = stripTypeScriptTypes(source.slice(source.indexOf('const filteredItems = computed'), source.indexOf('onMounted(async () =>')))
function feedHarness(platforms = []) {
  const items = { value: [] }
  const filters = { platforms, currency: '*', search: '', minProfit: 0, minMarginPct: 0, minRefs: 0, category: '', maxDistance: 0 }
  const select = new Function('computed', 'items', 'filters', 'getFlipCurrency', 'hasSelectedCurrency', 'sortMode', 'userLocation',
    filteredSource + '\nreturn filteredItems')(
    callback => callback, items, filters, item => getCurrency(item, legacy), { value: false }, { value: 'newest' }, { value: null })
  return { items, filters, select }
}

test('candidate source selection applies to loaded and new flips without changing references', () => {
  const { items, filters, select } = feedHarness(['Ebay'])
  const references = [{ platform: 'Kleinanzeigen', price: 100 }]
  const ebay = { listing: { platform: 'Ebay', currency: 'EUR' }, recentSells: references }
  const kleinanzeigen = { listing: { platform: 'Kleinanzeigen', currency: 'EUR' } }
  items.value = [ebay, kleinanzeigen, { listing: { platform: 'Unknown', currency: 'EUR' } }, { listing: {} }]
  assert.deepEqual(select(), [ebay])
  assert.strictEqual(select()[0].recentSells, references)
  const arriving = { listing: { platform: 'Ebay', currency: 'GBP' } }
  items.value.push(arriving)
  assert.deepEqual(select(), [ebay, arriving])
  filters.platforms = ['Ebay', 'Kleinanzeigen']
  assert.deepEqual(select(), [ebay, kleinanzeigen, arriving])
  filters.currency = 'EUR'
  assert.deepEqual(select(), [ebay, kleinanzeigen])
  filters.currency = '*'
  filters.platforms = []
  assert.equal(select().length, 5, 'unknown sources require no selected source')
})

test('saved-alert handler emits canonical IncludePlatforms comma-separated values', async () => {
  let body
  const handler = save({ value: 'source alert' }, { token: 'test', user: { id: 'test' } }, { value: true },
    { platforms: ['Ebay', 'Willhaben'], currency: 'EUR', search: '', minProfit: 0, minMarginPct: 0, minRefs: 0, category: '' },
    { value: 'none' }, { value: '' }, async (request) => { body = request.body }, { value: true },
    { success() {}, error() { assert.fail('save failed') } }, () => ({ t: key => key }))
  await handler()
  assert.deepEqual(body.filters.find(filter => filter.name === 'IncludePlatforms'), { name: 'IncludePlatforms', value: 'Ebay,Willhaben' })
})

test('storage handlers preserve old defaults, restore selected sources and reset selection', () => {
  const defaults = { platforms: [], currency: 'EUR' }
  let stored = JSON.stringify({ search: 'camera' })
  const storage = {
    getItem: () => stored,
    setItem: (_key, value) => {
      stored = value
    },
  }
  const loadSource = source.slice(source.indexOf('function loadFilters()'), source.indexOf('const hasActiveFilters')).replaceAll('import.meta.server', 'false')
  const getHandlers = new Function('defaultFilters', 'localStorage', 'STORAGE_KEY_FILTERS', 'filters',
    loadSource + '\nreturn { loadFilters, saveFilters }')
  const filters = { platforms: ['Ebay'], currency: 'EUR' }
  const { loadFilters, saveFilters } = getHandlers(defaults, storage, 'filters', filters)
  assert.deepEqual(loadFilters().platforms, [])
  saveFilters()
  assert.deepEqual(loadFilters().platforms, ['Ebay'])
  const clearSource = source.match(/function clearFilters\(\) \{([\s\S]*?)\n\}/)[1]
  new Function('filters', 'defaultFilters', clearSource)(filters, defaults)
  assert.deepEqual(filters.platforms, [])
  assert.notStrictEqual(filters.platforms, defaults.platforms)
})
