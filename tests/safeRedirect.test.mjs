import assert from 'node:assert/strict'
import test from 'node:test'
import { safeRedirect } from '../utils/safeRedirect.ts'

// Regression: `redirectTo`/`next` query params from login links were passed straight into
// navigateTo(), so a crafted `/login?redirectTo=https://evil.example` sent a freshly
// authenticated user straight to an attacker-controlled site (open redirect).
test('same-origin relative paths are passed through unchanged', () => {
  assert.equal(safeRedirect('/subscriptions'), '/subscriptions')
  assert.equal(safeRedirect('/subscriptions?discount=ABC'), '/subscriptions?discount=ABC')
  assert.equal(safeRedirect('/'), '/')
})

test('protocol-relative and backslash-prefixed targets fall back (browsers treat both as a different host)', () => {
  assert.equal(safeRedirect('//evil.example'), '/')
  assert.equal(safeRedirect('/\\evil.example'), '/')
  assert.equal(safeRedirect('\\\\evil.example'), '/')
})

test('absolute URLs on allowlisted Ane hosts are passed through unchanged', () => {
  assert.equal(safeRedirect('https://ane.deals/overview'), 'https://ane.deals/overview')
  assert.equal(safeRedirect('https://www.ane.deals/overview'), 'https://www.ane.deals/overview')
  assert.equal(safeRedirect('https://ane.coflnet.com/api/x'), 'https://ane.coflnet.com/api/x')
})

test('absolute URLs on any other host fall back', () => {
  assert.equal(safeRedirect('https://evil.example'), '/')
  assert.equal(safeRedirect('http://evil.example/ane.deals'), '/')
  // subdomain / userinfo tricks must not slip through an allowlist check
  assert.equal(safeRedirect('https://ane.deals.evil.example'), '/')
  assert.equal(safeRedirect('https://ane.deals@evil.example'), '/')
})

test('non-URL schemes and junk input fall back', () => {
  assert.equal(safeRedirect('javascript:alert(1)'), '/')
  assert.equal(safeRedirect('mailto:a@b.com'), '/')
  assert.equal(safeRedirect(''), '/')
  assert.equal(safeRedirect(undefined), '/')
  assert.equal(safeRedirect(null), '/')
})

test('a custom fallback is honored', () => {
  assert.equal(safeRedirect(undefined, '/overview'), '/overview')
  assert.equal(safeRedirect('https://evil.example', '/filters/create'), '/filters/create')
})
