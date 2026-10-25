import assert from 'node:assert/strict'
import test from 'node:test'
import { formatHistoryPrice, historyCurrency, historyTimeFraction } from '../utils/priceHistory.ts'

test('only a fully recorded common currency adds a currency symbol', () => {
  assert.equal(historyCurrency([]), null)
  assert.equal(historyCurrency([{}, {}]), null)
  assert.equal(historyCurrency([{ currency: 'EUR' }, {}]), null)
  assert.equal(historyCurrency([{ currency: 'EUR' }, { currency: 'GBP' }]), null)
  assert.equal(historyCurrency([{ currency: 'EUR' }, { currency: 'EUR' }]), 'EUR')
  assert.equal(formatHistoryPrice(500, null, 'en'), '500')
  assert.equal(formatHistoryPrice(500, 'EUR', 'en'), '€500.00')
})

test('oldest is left, newest is right, and missing days are not compressed', () => {
  const history = ['2026-10-01', '2026-10-02', '2026-10-11'].map(date => ({ date }))
  assert.equal(historyTimeFraction(history, 0), 0)
  assert.equal(historyTimeFraction(history, 1), 0.1)
  assert.equal(historyTimeFraction(history, 2), 1)
  assert.equal(historyTimeFraction(history.slice(0, 1), 0), 0.5)
})

test('URL history windows accept only supported whole-day selections', async () => {
  const { parseHistoryDays, HISTORY_WINDOWS } = await import('../utils/priceHistory.ts')
  for (const days of HISTORY_WINDOWS) assert.equal(parseHistoryDays(String(days)), days)
  for (const value of [undefined, null, '', '0', '366', '7.0', '7days', ['7', '30']]) {
    assert.equal(parseHistoryDays(value), 90)
  }
})
