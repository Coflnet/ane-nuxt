import assert from 'node:assert/strict'
import test from 'node:test'
import { buildReportBody, extractProductId, reportErrorMessage } from '../utils/productReport.ts'

test('extracts the id from product URLs and bare ids', () => {
  assert.equal(extractProductId('https://ane.deals/product/iphone-13-128gb'), 'iphone-13-128gb')
  assert.equal(extractProductId('https://ane.deals/de/product/abc123?zip=10115#x'), 'abc123')
  assert.equal(extractProductId('/product/abc'), 'abc')
  assert.equal(extractProductId('  abc123  '), 'abc123')
  assert.equal(extractProductId('https://ane.deals/search?q=x'), null)
  assert.equal(extractProductId(''), null)
})

test('report body carries ids, caps the comment and only sets otherProductId for SameProductAs', () => {
  const same = buildReportBody({ type: 'SameProductAs', listingId: 'l1', productId: 'p1', otherProductId: 'p2', comment: ' hi ' })
  assert.deepEqual(same, { type: 'SameProductAs', description: 'hi', listingId: 'l1', productId: 'p1', otherProductId: 'p2' })
  const wrong = buildReportBody({ type: 'WrongMatch', listingId: 'l1', productId: 'p1', otherProductId: 'p2', comment: 'x'.repeat(600) })
  assert.equal(wrong.otherProductId, undefined)
  assert.equal(wrong.description.length, 500)
})

test('error messages are friendly for 429', () => {
  assert.match(reportErrorMessage(429), /too many reports/)
})
