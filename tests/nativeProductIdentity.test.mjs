import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { effectScope, nextTick, reactive, ref, watch } from 'vue'
import { compileScript, parse } from 'vue/compiler-sfc'
import { nativeListingId, listingIdentityKey } from '../utils/listingIdentity.ts'
import { buildReportBody, reportErrorMessage } from '../utils/productReport.ts'

const source = await readFile(new URL('../components/product/ProductListingTable.vue', import.meta.url), 'utf8')
const fn = name => source.match(new RegExp(`(?:async )?function ${name}\\([\\s\\S]*?\\n}`))[0]
const opaque = { listingId: 6607570264169701000, nativeListingId: 'pl:ID1aZrpy/:?&+', platform: 'OLX', listingUrl: 'https://www.olx.pl/d/oferta/original-ID1aZrpy.html' }

function table(listing, options = {}) {
  const reports = [], opens = [], events = []
  const state = { nativeListingId, listingIdentityKey, buildReportBody, ref, watch,
    t: key => key, props: reactive({ productId: 'fixture-product', listings: [listing] }),
    userStore: { token: 'SYNTHETIC-NOT-A-CREDENTIAL' }, localePath: value => value, route: { fullPath: '/product/fixture-product' },
    navigateTo: () => { throw new Error('Unexpected navigation') }, labelingErrorStatus: () => options.status ?? 500, reportErrorMessage,
    emit: (...args) => events.push(args), reportProductIssue: async (request) => {
      reports.push(request)
      if (options.fail) throw new Error('SYNTHETIC report failure')
    },
    openListing: async (event, options) => opens.push(options) }
  for (const [key, value] of Object.entries({ selectedListing: listing, selectedIssueType: 'WrongMatch', submittingReport: false, reportError: '', reportDescription: 'unfinished reason', sameProductOpen: false, otherProductInput: '', showReportDialog: true, unavailableListings: new Set(), checkingAvailability: new Set() })) state[key] = ref(value)
  state.otherProductId = ref(null)
  const { descriptor } = parse(source)
  const ast = compileScript(descriptor, { id: 'identity-handlers' }).scriptSetupAst
  const refresh = ast.filter(node => node.type === 'ExpressionStatement' && descriptor.scriptSetup.content.slice(node.start, node.end).startsWith('watch(() => props.listings,'))
    .map(node => descriptor.scriptSetup.content.slice(node.start, node.end)).join('\n')
  const effects = effectScope()
  const actions = effects.run(() => new Function('state', `with (state) { ${stripTypeScriptTypes(`${refresh}\n${fn('closeReportDialog')}\n${fn('submitReport')}\n${fn('handleViewDeal')}`)}; return { submitReport, handleViewDeal }; }`)(state))
  return { ...state, ...actions, reports, opens, events, stop: () => effects.stop() }
}

test('native opaque ids and platform tuples survive hashes, prefixes and separator collisions', () => {
  assert.equal(nativeListingId(opaque), opaque.nativeListingId)
  for (const platform of ['Kleinanzeigen', 'Vinted', 'Ebay']) assert.equal(nativeListingId({ listingId: 1234, platform }), '1234')
  for (const platform of ['OLX', 'Blocket', 'Marktplaats', undefined]) assert.equal(nativeListingId({ listingId: 42, platform }), null)
  assert.equal(nativeListingId({ listingId: opaque.listingId }), null)
  assert.equal(nativeListingId({ listingId: 0 }), null)
  for (const listingId of [123, 0xFF_FFFF_FFFF + 1]) {
    assert.equal(nativeListingId({ listingId, platform: 'Kleinanzeigen' }), null)
    assert.equal(nativeListingId({ listingId, platform: 'Kleinanzeigen', nativeListingId: String(listingId) }), String(listingId))
  }
  assert.notEqual(listingIdentityKey(opaque), listingIdentityKey({ ...opaque, platform: 'Vinted' }))
  assert.notEqual(listingIdentityKey({ platform: 'A:B', nativeListingId: 'C' }), listingIdentityKey({ platform: 'A', nativeListingId: 'B:C' }))
  const keyExpression = source.match(/:key="(listingIdentityKey\(listing\)[^"]+)"/)[1]
  const actualKey = new Function('listing', 'listingIndex', 'listingIdentityKey', `return ${keyExpression}`)
  assert.equal(actualKey(opaque, 0, listingIdentityKey), listingIdentityKey(opaque))
  assert.notEqual(actualKey({ listingId: opaque.listingId }, 0, listingIdentityKey), actualKey({ listingId: opaque.listingId }, 1, listingIdentityKey))
})

test('actual report handler sends the exact opaque id and platform, never the rounded number', async () => {
  const page = table(opaque)
  try {
    await page.submitReport()
    assert.equal(page.reports.length, 1)
    assert.deepEqual(page.reports[0].body, { type: 'WrongMatch', description: 'unfinished reason', listingId: opaque.nativeListingId, listingPlatform: 'OLX', productId: 'fixture-product' })
    assert.equal(page.showReportDialog.value, false)
  }
  finally { page.stop() }
})

test('unknown unsafe identity blocks reports and refresh preserves unfinished fields for retry', async () => {
  const page = table({ ...opaque, nativeListingId: undefined })
  try {
    await page.submitReport()
    assert.equal(page.reports.length, 0)
    assert.equal(page.reportError.value, 'product.listingIdentityUnavailable')
    assert.equal(page.reportDescription.value, 'unfinished reason')
    assert.equal(page.showReportDialog.value, true)
    assert.equal(page.submittingReport.value, false)
    page.props.listings = [{ ...opaque }]
    await nextTick()
    assert.equal(page.selectedListing.value.nativeListingId, opaque.nativeListingId)
    assert.equal(page.reportDescription.value, 'unfinished reason')
    assert.equal(page.selectedIssueType.value, 'WrongMatch')
    await page.submitReport()
    assert.equal(page.reports[0].body.listingId, opaque.nativeListingId)
    const legacy = table({ listingId: 1234, platform: 'Kleinanzeigen' })
    try {
      await legacy.submitReport()
      assert.equal(legacy.reports[0].body.listingId, '1234')
    }
    finally { legacy.stop() }
  }
  finally { page.stop() }
})

test('safe integers from hashed/prefixed providers never become report listing ids', async () => {
  for (const platform of ['OLX', 'Blocket', 'Marktplaats', undefined]) {
    const page = table({ listingId: 42, platform })
    try {
      await page.submitReport()
      assert.equal(page.reports.length, 0, `${platform}: stable hash cannot stand in for native id`)
      assert.equal(page.reportDescription.value, 'unfinished reason')
      assert.equal(page.showReportDialog.value, true)
      assert.equal(page.reportError.value, 'product.listingIdentityUnavailable')
    }
    finally { page.stop() }
  }
})

test('actual deal handler preserves original URL, exact availability identity and platform-scoped state', async () => {
  const page = table(opaque)
  try {
    await page.handleViewDeal({}, opaque)
    const opened = page.opens[0]
    assert.equal(opened.listingId, opaque.nativeListingId)
    assert.equal(opened.platform, 'OLX')
    assert.equal(opened.url, opaque.listingUrl)
    opened.onUnavailable()
    assert.equal(page.unavailableListings.value.has(listingIdentityKey(opaque)), true)
    assert.equal(page.unavailableListings.value.has(listingIdentityKey({ ...opaque, platform: 'Vinted' })), false)
    await page.handleViewDeal({}, { ...opaque, nativeListingId: undefined })
    assert.equal(page.opens[1].listingId, null, 'unknown identity skips checking but keeps the real href')
    assert.equal(page.opens[1].url, opaque.listingUrl)
  }
  finally { page.stop() }
})

test('actual availability composable sends opaque id in query and rejects unsafe numeric fallback', async () => {
  const module = await readFile(new URL('../composable/useAvailabilityCheck.ts', import.meta.url), 'utf8')
  const code = stripTypeScriptTypes(module).replace(/^import[^\n]+\n/gm, '').replace('export const useAvailabilityCheck', 'const useAvailabilityCheck')
  const calls = []
  const useCheck = new Function('useApiBaseUrl', '$fetch', 'AVAILABILITY_TIMEOUT_MS', 'nativeListingId', `${code}; return useAvailabilityCheck`)(
    () => 'http://127.0.0.1:3024', async (url, options) => {
      calls.push({ url, options })
      return { isAvailable: true }
    }, 2500, nativeListingId,
  )()
  await useCheck.checkAvailability(opaque.nativeListingId, opaque.listingUrl, 'OLX')
  assert.equal(calls[0].url, 'http://127.0.0.1:3024/api/Product/availability')
  assert.deepEqual(calls[0].options.query, { platform: 'OLX', id: opaque.nativeListingId })
  await useCheck.checkAvailability(opaque.listingId, opaque.listingUrl, 'OLX')
  assert.equal(calls.length, 1)
  for (const platform of ['OLX', 'Blocket', 'Marktplaats']) await useCheck.checkAvailability(42, opaque.listingUrl, platform)
  assert.equal(calls.length, 1, 'safe hashed-provider numbers also skip availability')
  await useCheck.checkAvailability(1234, 'https://www.kleinanzeigen.de/s-anzeige/fixture/1234')
  assert.deepEqual(calls[1].options.query, { platform: 'Kleinanzeigen', id: '1234' })
})

test('actual listing report400 keeps draft and refreshes stale native identity for retry; SameProductAs retains link advice', async () => {
  for (const type of ['WrongMatch', 'WrongListing']) {
    const options = { fail: true, status: 400 }
    const page = table(opaque, options)
    page.selectedIssueType.value = type
    try {
      await page.submitReport()
      assert.equal(page.reportError.value, 'product.listingIdentityUnavailable')
      assert.equal(page.showReportDialog.value, true)
      assert.equal(page.reportDescription.value, 'unfinished reason')
      const updated = { ...opaque, nativeListingId: 'pl:ID-refreshed' }
      page.props.listings = [updated]
      await nextTick()
      assert.equal(page.selectedListing.value.nativeListingId, updated.nativeListingId)
      assert.equal(page.reportDescription.value, 'unfinished reason')
      options.fail = false
      await page.submitReport()
      assert.equal(page.reports.at(-1).body.listingId, updated.nativeListingId)
      assert.equal(page.showReportDialog.value, false)
    }
    finally { page.stop() }
  }
  const same = table(opaque, { fail: true, status: 400 })
  try {
    same.selectedIssueType.value = 'SameProductAs'
    same.otherProductId.value = 'other-product'
    await same.submitReport()
    assert.match(same.reportError.value, /other product link/)
    assert.equal(same.reportDescription.value, 'unfinished reason')
  }
  finally { same.stop() }
})
