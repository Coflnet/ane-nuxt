export interface ListingIdentitySource {
  nativeListingId?: string | null
  listingId?: number | null
  platform?: string | null
}

// These catalogued providers use numeric native ids; prefixed/opaque providers expose derived hashes.
const LEGACY_NUMERIC_PLATFORMS = new Set(['Kleinanzeigen', 'Vinted', 'Ebay'])

/** Exact native ids are authoritative; legacy fallback is bounded numeric-provider compatibility only. */
export function nativeListingId(listing: ListingIdentitySource | null | undefined): string | null {
  if (listing?.nativeListingId?.trim()) return listing.nativeListingId
  return LEGACY_NUMERIC_PLATFORMS.has(listing?.platform ?? '') && typeof listing?.listingId === 'number' && Number.isSafeInteger(listing.listingId) && listing.listingId >= 1000 && listing.listingId <= 0xFF_FFFF_FFFF ? String(listing.listingId) : null
}

/** JSON tuples keep platform/id boundaries intact even when an opaque id contains separators. */
export function listingIdentityKey(listing: ListingIdentitySource): string | null {
  const id = nativeListingId(listing)
  return id && listing.platform ? JSON.stringify([listing.platform, id]) : null
}
