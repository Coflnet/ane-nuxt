import assert from 'node:assert/strict'
import test from 'node:test'
import { canCreateReferralLink, REFERRAL_LINK_NAME, REFERRAL_LINK_TEXT } from '../utils/referral.ts'
import { categoryLabelLanguage } from '../utils/categoryLanguage.ts'

// Regression: every anonymous page load fired POST /api/referral/link?name=i&text=i,
// which answered 401 and logged a FetchError.
test('referral links are only created for signed-in users with a token', () => {
  assert.equal(canCreateReferralLink({ isLoggedIn: false, token: null }), false)
  assert.equal(canCreateReferralLink({ isLoggedIn: false, token: 'anonymous-firebase-token' }), false)
  assert.equal(canCreateReferralLink({ isLoggedIn: true, token: '' }), false)
  assert.equal(canCreateReferralLink({ isLoggedIn: true, token: 'jwt' }), true)
})

test('referral links carry a real name and description', () => {
  assert.ok(REFERRAL_LINK_NAME.length > 1)
  assert.ok(REFERRAL_LINK_TEXT.length > 1)
  assert.notEqual(REFERRAL_LINK_NAME, 'i')
  assert.notEqual(REFERRAL_LINK_TEXT, 'i')
})

// Regression: the English UI showed the German category labels of UnifiedCategories.json.
test('category labels are requested in the UI language, German otherwise', () => {
  assert.equal(categoryLabelLanguage('en'), 'en')
  assert.equal(categoryLabelLanguage('en-US'), 'en')
  assert.equal(categoryLabelLanguage('de'), 'de')
  assert.equal(categoryLabelLanguage(undefined), 'de')
})
