import assert from 'node:assert/strict'
import test from 'node:test'
import { canCreateReferralLink, isSelfReferral, isValidReferralCode, REFERRAL_LINK_NAME, REFERRAL_LINK_TEXT } from '../utils/referral.ts'
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

// Regression: the `?ref=` query param was stored into `acceptingReferralCode` unchecked, so a
// crafted link like `/overview?ref=<script>` (or any other junk) was persisted and later sent
// to the API as-is. Invite link ids are UUIDs, so anything else must be ignored.
test('only a canonical UUID is accepted as a referral code', () => {
  assert.equal(isValidReferralCode('550e8400-e29b-41d4-a716-446655440000'), true)
  assert.equal(isValidReferralCode('550E8400-E29B-41D4-A716-446655440000'), true)
  assert.equal(isValidReferralCode('not-a-uuid'), false)
  assert.equal(isValidReferralCode('550e8400-e29b-41d4-a716-446655440000; DROP TABLE users'), false)
  assert.equal(isValidReferralCode(''), false)
  assert.equal(isValidReferralCode(undefined), false)
})

// Regression: using your own referral link is a self-invite that the API rejects with 400;
// it must not even be attempted once the user's own link id is known.
test('a referral code matching the user\'s own link id is a self-invite', () => {
  assert.equal(isSelfReferral('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'), true)
  assert.equal(isSelfReferral('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000'), false)
  // the user's own code isn't loaded yet: can't tell locally, so not treated as self here
  assert.equal(isSelfReferral('550e8400-e29b-41d4-a716-446655440000', ''), false)
})

// Regression: the English UI showed the German category labels of UnifiedCategories.json.
test('category labels are requested in the UI language, German otherwise', () => {
  assert.equal(categoryLabelLanguage('en'), 'en')
  assert.equal(categoryLabelLanguage('en-US'), 'en')
  assert.equal(categoryLabelLanguage('de'), 'de')
  assert.equal(categoryLabelLanguage(undefined), 'de')
})
