/**
 * Pure helpers for the "no active offers" fallback on a product page: deciding
 * when to load alternative products, labelling each alternative by why it was
 * suggested, picking a category to fall back to, and keeping the "N offers" text
 * truthful once a product has no active offers.
 *
 * A product page must never be a dead end — see pages/product/[id].vue for how
 * these are wired into the SSR fetch and the client-side recheck.
 */

import type { Product } from '~/src/api-client/types.gen'

/**
 * `Product` extended with the `hasActiveOffers` flag the API added to
 * `GET /api/Product/{seoId}` — not yet present in the generated client (see
 * utils/productApiUrl.ts for why the generated client can lag production).
 */
export interface ProductWithOffers extends Product {
  hasActiveOffers?: boolean | null
}

export type AlternativeReason = 'same_model' | 'sibling_model' | 'same_brand_category' | 'same_category'

/** An alternative product suggestion returned by `GET /api/Product/{id}/alternatives`. */
export interface ProductAlternative extends ProductWithOffers {
  reason: AlternativeReason
}

const REASON_LABEL_KEYS: Record<AlternativeReason, string> = {
  same_model: 'product.noOffers.reason.same_model',
  sibling_model: 'product.noOffers.reason.sibling_model',
  same_brand_category: 'product.noOffers.reason.same_brand_category',
  same_category: 'product.noOffers.reason.same_category',
}

/**
 * i18n key for the small label shown on an alternative's card. Falls back to the
 * generic "similar product" label for a reason the frontend doesn't know about
 * yet, so an API addition never renders a blank or raw key.
 */
export function alternativeReasonLabelKey(reason: string | null | undefined): string {
  if (reason && reason in REASON_LABEL_KEYS) return REASON_LABEL_KEYS[reason as AlternativeReason]
  return REASON_LABEL_KEYS.same_category
}

/**
 * Decide whether the product page should load alternative products.
 *
 * `matchesCount` is `null` for the SSR decision (the offers/matches list hasn't
 * loaded yet — matches load client-side only — so only the product's
 * `hasActiveOffers` flag can drive it) and a number for the client-side recheck
 * once matches have loaded, which also covers `hasActiveOffers` drifting from the
 * actual listings (e.g. a stale flag on cached product data).
 */
export function shouldLoadAlternatives(hasActiveOffers: boolean | null | undefined, matchesCount: number | null): boolean {
  if (hasActiveOffers === false) return true
  if (matchesCount != null && matchesCount === 0) return true
  return false
}

/**
 * Most specific category to fall back to when a product has neither active
 * offers nor alternatives — the last non-placeholder entry in `categories`
 * (breadcrumb order goes broad → specific; mirrors the filter already used for
 * the breadcrumb in pages/product/[id].vue).
 */
export function mostSpecificCategory(categories: (string | null | undefined)[] | null | undefined): string | null {
  if (!categories) return null
  const filtered = categories.filter((c): c is string => !!c && c !== 'general' && !/^[\d,\s]+$/.test(c))
  return filtered.length ? filtered[filtered.length - 1]! : null
}

/**
 * Build the `{ path, query }` for the "browse this category" fallback link shown
 * when a product has no active offers AND no alternatives — every dead end must
 * have a way forward. Returns `null` when the product has no usable category.
 */
export function buildCategoryFallbackUrl(categories: (string | null | undefined)[] | null | undefined): { path: string, query: Record<string, string> } | null {
  const category = mostSpecificCategory(categories)
  if (!category) return null
  return { path: '/search', query: { category } }
}

export interface AvailableOfferCountParams {
  hasActiveOffers: boolean | null | undefined
  matchesCount: number
  unavailableCount: number
  fallbackListingCount: number
}

/**
 * The truthful "N offers" count for the page's stat box, SEO description, etc.
 * Once `hasActiveOffers` is false this is always 0, regardless of what a stale
 * `listingCount` or a leftover `matchesCount` from before the flag flipped would
 * otherwise suggest — the page must never show a positive offer count next to a
 * "no offers" product.
 */
export function resolveAvailableOfferCount(params: AvailableOfferCountParams): number {
  if (params.hasActiveOffers === false) return 0
  if (params.matchesCount > 0) return Math.max(0, params.matchesCount - params.unavailableCount)
  return Math.max(0, params.fallbackListingCount)
}
