import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { decideOpen, isPlainLeftClick, runAvailabilityCheck } from '../utils/listingOpen.ts'

test('decision: available, timeout and error navigate the already open tab', () => {
  assert.equal(decideOpen(true, 'available'), 'navigate-tab')
  assert.equal(decideOpen(true, 'timeout'), 'navigate-tab')
  assert.equal(decideOpen(true, 'error'), 'navigate-tab')
})

test('decision: unavailable closes the tab and marks the row', () => {
  assert.equal(decideOpen(true, 'unavailable'), 'close-tab-mark-unavailable')
})

test('decision: blocked popup lets the anchor navigate regardless of result', () => {
  for (const r of ['available', 'unavailable', 'timeout', 'error']) {
    assert.equal(decideOpen(false, r), 'anchor-navigate')
  }
})

test('only plain left clicks are intercepted', () => {
  assert.equal(isPlainLeftClick({ button: 0 }), true)
  assert.equal(isPlainLeftClick({ button: 1 }), false)
  assert.equal(isPlainLeftClick({ button: 0, ctrlKey: true }), false)
  assert.equal(isPlainLeftClick({ button: 0, metaKey: true }), false)
  assert.equal(isPlainLeftClick({ button: 0, shiftKey: true }), false)
  assert.equal(isPlainLeftClick({ button: 0, defaultPrevented: true }), false)
})

test('check results map to available / unavailable / error / timeout', async () => {
  assert.equal(await runAvailabilityCheck(async () => true, 50), 'available')
  assert.equal(await runAvailabilityCheck(async () => false, 50), 'unavailable')
  assert.equal(await runAvailabilityCheck(async () => {
    throw new Error('x')
  }, 50), 'error')
  assert.equal(await runAvailabilityCheck(() => new Promise(() => {}), 20), 'timeout')
})

// Regression: window.open ran after an awaited fetch (lost user activation, no timeout, unavailable listing opened anyway)
test('callers open the tab through the shared opener, not after an await', async () => {
  const read = f => readFile(new URL(`../${f}`, import.meta.url), 'utf8')
  for (const f of ['components/product/ProductListingTable.vue', 'components/overview/RecentMatchTable.vue', 'components/auctions/AuctionsItem.vue']) {
    const src = await read(f)
    assert.ok(!src.includes('window.open('), `${f} must not call window.open itself`)
    assert.ok(!/checkAvailability\(/.test(src), `${f} must not await the check itself`)
    assert.match(src, /openListing\(/)
  }
  const table = await read('components/product/ProductListingTable.vue')
  assert.ok(!table.includes('@click.prevent'), 'anchor must stay a real link; preventDefault only inside the opener')
  const opener = await read('composable/useListingOpener.ts')
  assert.ok(opener.indexOf('window.open(\'\', \'_blank\')') < opener.indexOf('await '), 'tab must open before any await')
  assert.match(opener, /tab\.opener = null/)
  const composable = await read('composable/useAvailabilityCheck.ts')
  assert.match(composable, /timeout: AVAILABILITY_TIMEOUT_MS/)
})
