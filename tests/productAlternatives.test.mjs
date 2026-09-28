import assert from 'node:assert/strict'
import test from 'node:test'
import {
  alternativeReasonLabelKey,
  buildCategoryFallbackUrl,
  mostSpecificCategory,
  resolveAvailableOfferCount,
  shouldLoadAlternatives,
} from '../utils/productAlternatives.ts'

test('alternativeReasonLabelKey maps every known reason to its own i18n key', () => {
  assert.equal(alternativeReasonLabelKey('same_model'), 'product.noOffers.reason.same_model')
  assert.equal(alternativeReasonLabelKey('sibling_model'), 'product.noOffers.reason.sibling_model')
  assert.equal(alternativeReasonLabelKey('same_brand_category'), 'product.noOffers.reason.same_brand_category')
  assert.equal(alternativeReasonLabelKey('same_category'), 'product.noOffers.reason.same_category')
})

test('alternativeReasonLabelKey falls back to the generic label for an unknown/missing reason', () => {
  assert.equal(alternativeReasonLabelKey('something_new_the_api_added'), 'product.noOffers.reason.same_category')
  assert.equal(alternativeReasonLabelKey(null), 'product.noOffers.reason.same_category')
  assert.equal(alternativeReasonLabelKey(undefined), 'product.noOffers.reason.same_category')
})

test('shouldLoadAlternatives triggers on hasActiveOffers === false regardless of matches state', () => {
  assert.equal(shouldLoadAlternatives(false, null), true, 'SSR: flag false, matches not loaded yet')
  assert.equal(shouldLoadAlternatives(false, 0), true)
  assert.equal(shouldLoadAlternatives(false, 5), true, 'flag still wins even if stale matches look non-empty')
})

test('shouldLoadAlternatives does not fetch for a product that has offers, until matches prove otherwise', () => {
  assert.equal(shouldLoadAlternatives(true, null), false, 'SSR: common case, no extra request')
  assert.equal(shouldLoadAlternatives(true, 5), false)
  assert.equal(shouldLoadAlternatives(true, 0), true, 'client recheck: matches came back empty despite the flag')
})

test('shouldLoadAlternatives treats an unknown/missing flag like "has offers" until matches say otherwise', () => {
  assert.equal(shouldLoadAlternatives(undefined, null), false)
  assert.equal(shouldLoadAlternatives(null, null), false)
  assert.equal(shouldLoadAlternatives(undefined, 0), true)
})

test('mostSpecificCategory picks the last non-placeholder category (broad → specific order)', () => {
  assert.equal(mostSpecificCategory(['Elektronik', 'Handys & Telefone', 'Smartphones']), 'Smartphones')
  assert.equal(mostSpecificCategory(['Bekleidung & Accessoires']), 'Bekleidung & Accessoires')
})

test('mostSpecificCategory filters out the "general" placeholder and numeric-id-only entries', () => {
  assert.equal(mostSpecificCategory(['Elektronik', 'general']), 'Elektronik')
  assert.equal(mostSpecificCategory(['1604', 'Elektronik']), 'Elektronik')
  assert.equal(mostSpecificCategory(['general']), null)
  assert.equal(mostSpecificCategory(['1604', '1605, 2']), null)
})

test('mostSpecificCategory returns null for missing/empty categories', () => {
  assert.equal(mostSpecificCategory(null), null)
  assert.equal(mostSpecificCategory(undefined), null)
  assert.equal(mostSpecificCategory([]), null)
})

test('buildCategoryFallbackUrl points at /search?category=<most specific category>', () => {
  assert.deepEqual(
    buildCategoryFallbackUrl(['Elektronik', 'Smartphones']),
    { path: '/search', query: { category: 'Smartphones' } },
  )
})

test('buildCategoryFallbackUrl returns null when there is no usable category — always check before rendering the link', () => {
  assert.equal(buildCategoryFallbackUrl(['general']), null)
  assert.equal(buildCategoryFallbackUrl(null), null)
})

test('resolveAvailableOfferCount is always 0 once hasActiveOffers is false, no matter what else suggests otherwise', () => {
  assert.equal(resolveAvailableOfferCount({ hasActiveOffers: false, matchesCount: 5, unavailableCount: 0, fallbackListingCount: 12 }), 0)
})

test('resolveAvailableOfferCount prefers the live matches count (minus unavailable) once matches have loaded', () => {
  assert.equal(resolveAvailableOfferCount({ hasActiveOffers: true, matchesCount: 5, unavailableCount: 2, fallbackListingCount: 99 }), 3)
})

test('resolveAvailableOfferCount falls back to the SSR listingCount before matches have loaded', () => {
  assert.equal(resolveAvailableOfferCount({ hasActiveOffers: true, matchesCount: 0, unavailableCount: 0, fallbackListingCount: 7 }), 7)
})

test('resolveAvailableOfferCount never goes negative', () => {
  assert.equal(resolveAvailableOfferCount({ hasActiveOffers: true, matchesCount: 2, unavailableCount: 5, fallbackListingCount: 0 }), 0)
  assert.equal(resolveAvailableOfferCount({ hasActiveOffers: true, matchesCount: 0, unavailableCount: 0, fallbackListingCount: -3 }), 0)
})
