import assert from 'node:assert/strict'
import test from 'node:test'
import { canLoadStats } from '../utils/stats.ts'

// Regression: opening the invite-link landing page (/overview?ref=<uuid>) as an anonymous
// visitor fired GET /api/stats, which answered 401 and logged a console error.
test('stats are only loaded for signed-in users with a token', () => {
  assert.equal(canLoadStats({ isLoggedIn: false, token: null }), false)
  assert.equal(canLoadStats({ isLoggedIn: false, token: 'anonymous-firebase-token' }), false)
  assert.equal(canLoadStats({ isLoggedIn: true, token: '' }), false)
  assert.equal(canLoadStats({ isLoggedIn: true, token: undefined }), false)
  assert.equal(canLoadStats({ isLoggedIn: true, token: 'jwt' }), true)
})
