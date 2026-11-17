/**
 * When the search page shows its "special" controls (individual offers, store
 * reference, parts suggestion). They only appear when relevant to the current search,
 * so ordinary product searches stay uncluttered.
 */

export const STORE_REFERENCE_STORES = ['Lefeld', 'GoTools'] as const

export interface StoreBucketLike {
  value?: string | null
  count?: number | null
}

export interface IndividualOffersToggleState {
  /** includeIndividualOffers or the legacy includePartOffers flag is set */
  toggleActive: boolean
  isPartQuery: boolean
  hasSearched: boolean
  totalResults: number
  pageSize: number
}

export function showIndividualOffersToggle(state: IndividualOffersToggleState): boolean {
  if (state.toggleActive || state.isPartQuery) return true
  return state.hasSearched && state.totalResults < state.pageSize
}

export function hasStoreCoverage(buckets: readonly StoreBucketLike[]): boolean {
  return buckets.some(bucket =>
    (STORE_REFERENCE_STORES as readonly string[]).includes(bucket.value ?? '') && (bucket.count ?? 0) > 0)
}

export function showStoreReference(buckets: readonly StoreBucketLike[], selectedStore: string): boolean {
  return !!selectedStore || hasStoreCoverage(buckets)
}

export function showPartsSuggestion(isPartQuery: boolean | null | undefined, dismissed: boolean): boolean {
  return !!isPartQuery && !dismissed
}
