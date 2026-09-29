/**
 * Pure logic of the product page offers filter (marketplace, country and the three quick
 * actions "My country", "EU (shipping)" and "Nearby"). The state lives in the URL query so a
 * filtered view can be shared; nothing in here touches the DOM or the router.
 */

export type QuickAction = 'country' | 'eu' | 'nearby'

export const NEARBY_DISTANCE_KM = 50

export interface OfferFilterState {
  /** Marketplace names as the API knows them (Vinted, Kleinanzeigen, ...). */
  platforms: string[]
  /** ISO codes or the special value `EU`. */
  countries: string[]
  shipping: boolean
  zip: string
  /** Country the zip belongs to, default DE on the API. */
  zipCountry: string
  lat?: number
  lon?: number
  maxDistance?: number
}

/** Fields the matches endpoint adds on top of the generated ProductMatch. */
export interface OfferMatchExtras {
  platform?: string | null
  country?: string | null
  shipping?: boolean | null
  distanceKm?: number | null
}

export interface OfferFacets {
  total: number
  platforms: { name: string, count: number }[]
  countries: { code: string, count: number }[]
  withCoordinates: number
  shippable: number
}

/** Query keys owned by the offers filter. */
export const OFFER_FILTER_QUERY_KEYS = ['platforms', 'countries', 'shipping', 'zip', 'zip_country', 'lat', 'lon', 'max_distance'] as const

type QueryValue = string | null | undefined | (string | null)[]
type QueryLike = Record<string, QueryValue>

function first(value: QueryValue): string {
  const v = Array.isArray(value) ? value[0] : value
  return typeof v === 'string' ? v : ''
}

function splitList(value: string, upper = false): string[] {
  const seen = new Set<string>()
  for (const raw of value.split(',')) {
    const item = raw.trim()
    if (item) seen.add(upper ? item.toUpperCase() : item)
  }
  return [...seen]
}

function finiteNumber(value: string): number | undefined {
  if (!value.trim()) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export function emptyOfferFilter(): OfferFilterState {
  return { platforms: [], countries: [], shipping: false, zip: '', zipCountry: '', lat: undefined, lon: undefined, maxDistance: undefined }
}

export function parseOfferFilterQuery(query: QueryLike): OfferFilterState {
  const maxDistance = finiteNumber(first(query.max_distance))
  return {
    platforms: splitList(first(query.platforms)),
    countries: splitList(first(query.countries), true),
    shipping: ['true', '1'].includes(first(query.shipping).toLowerCase()),
    zip: first(query.zip).trim(),
    zipCountry: first(query.zip_country).trim().toUpperCase(),
    lat: finiteNumber(first(query.lat)),
    lon: finiteNumber(first(query.lon)),
    maxDistance: maxDistance && maxDistance > 0 ? maxDistance : undefined,
  }
}

/** Returns `baseQuery` with the offer filter keys replaced by `state` (empty values are dropped). */
export function buildOfferFilterQuery(state: OfferFilterState, baseQuery: QueryLike = {}): Record<string, string> {
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries(baseQuery)) {
    if ((OFFER_FILTER_QUERY_KEYS as readonly string[]).includes(key)) continue
    const v = first(value)
    if (v) query[key] = v
  }
  if (state.platforms.length) query.platforms = state.platforms.join(',')
  if (state.countries.length) query.countries = state.countries.join(',')
  if (state.shipping) query.shipping = 'true'
  if (state.zip) {
    query.zip = state.zip
    if (state.zipCountry && state.zipCountry !== 'DE') query.zip_country = state.zipCountry
  }
  if (state.lat !== undefined && state.lon !== undefined) {
    query.lat = String(state.lat)
    query.lon = String(state.lon)
  }
  if (state.maxDistance) query.max_distance = String(state.maxDistance)
  return query
}

export function hasPosition(state: OfferFilterState): boolean {
  return !!state.zip || (state.lat !== undefined && state.lon !== undefined)
}

/** True when any filter narrows the offer list. */
export function hasActiveOfferFilter(state: OfferFilterState): boolean {
  return state.platforms.length > 0
    || state.countries.length > 0
    || state.shipping
    || (hasPosition(state) && !!state.maxDistance)
}

/** The quick action the current state corresponds to, derived so a shared URL highlights it too. */
export function activeQuickAction(state: OfferFilterState, myCountry: string): QuickAction | null {
  if (hasPosition(state) && state.maxDistance) return 'nearby'
  if (state.shipping && state.countries.length === 1 && state.countries[0] === 'EU') return 'eu'
  if (!state.shipping && state.countries.length === 1 && state.countries[0] === myCountry) return 'country'
  return null
}

/** Drops everything a quick action owns, keeping the marketplace selection. */
function withoutQuickFields(state: OfferFilterState): OfferFilterState {
  return { ...state, countries: [], shipping: false, zip: '', zipCountry: '', lat: undefined, lon: undefined, maxDistance: undefined }
}

/**
 * Click on "My country" or "EU (shipping)": activates it (replacing any other quick action)
 * or, when it is already active, clears it. Nearby needs a position first, see `applyNearby`.
 */
export function toggleQuickAction(state: OfferFilterState, action: 'country' | 'eu', myCountry: string): OfferFilterState {
  const cleared = withoutQuickFields(state)
  if (activeQuickAction(state, myCountry) === action) return cleared
  return action === 'country'
    ? { ...cleared, countries: [myCountry] }
    : { ...cleared, countries: ['EU'], shipping: true }
}

export interface NearbyPosition {
  zip?: string
  zipCountry?: string
  lat?: number
  lon?: number
}

export function applyNearby(state: OfferFilterState, position: NearbyPosition, distanceKm = NEARBY_DISTANCE_KM): OfferFilterState {
  const cleared = withoutQuickFields(state)
  if (position.zip) {
    return { ...cleared, zip: position.zip.trim(), zipCountry: (position.zipCountry ?? '').toUpperCase(), maxDistance: distanceKm }
  }
  return { ...cleared, lat: position.lat, lon: position.lon, maxDistance: distanceKm }
}

export function clearOfferFilter(): OfferFilterState {
  return emptyOfferFilter()
}

/** Toggles one value of the platforms or countries multi select. */
export function toggleListValue(list: readonly string[], value: string): string[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

/** Parameters for the matches endpoint (`buildProductResourceUrl`). */
export function buildMatchesParams(state: OfferFilterState) {
  return {
    zip: state.zip || undefined,
    zipCountry: state.zip && state.zipCountry ? state.zipCountry : undefined,
    lat: state.lat,
    lon: state.lon,
    maxDistance: state.maxDistance,
    platforms: state.platforms.length ? state.platforms.join(',') : undefined,
    countries: state.countries.length ? state.countries.join(',') : undefined,
    shippingOnly: state.shipping ? true : undefined,
  }
}

/**
 * Normalizes the facets response. Returns null for anything unusable (old API answering 404,
 * or an unexpected body) so the UI can hide counts. Options with zero offers are dropped.
 */
export function parseOfferFacets(raw: unknown): OfferFacets | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  const toList = (value: unknown) => Object.entries(value && typeof value === 'object' ? value as Record<string, unknown> : {})
    .map(([key, count]) => ({ key, count: Number(count) }))
    .filter(entry => Number.isFinite(entry.count) && entry.count > 0)
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
  if (typeof data.platforms !== 'object' && typeof data.countries !== 'object') return null
  return {
    total: Number(data.total) || 0,
    platforms: toList(data.platforms).map(e => ({ name: e.key, count: e.count })),
    countries: toList(data.countries).map(e => ({ code: e.key.toUpperCase(), count: e.count })),
    withCoordinates: Number(data.withCoordinates) || 0,
    shippable: Number(data.shippable) || 0,
  }
}

/** Message of a failed $fetch (400 with a message from the matches endpoint). */
export function extractApiErrorMessage(error: unknown, fallback: string): string {
  const e = error as { data?: unknown, statusMessage?: string } | null
  const data = e?.data
  if (typeof data === 'string' && data.trim()) return data.trim()
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    for (const key of ['message', 'detail', 'title', 'error']) {
      if (typeof d[key] === 'string' && (d[key] as string).trim()) return (d[key] as string).trim()
    }
  }
  return fallback
}

/**
 * Query for the `/search` page ("Search similar offers"): the product name, sorted by relevance,
 * plus the location or country of the active filter. The search page's own parameter names apply
 * here (`q`, `max_distance`, `country`, `sort`).
 */
export function buildSimilarSearchQuery(productName: string, state: OfferFilterState): Record<string, string> {
  const query: Record<string, string> = { q: productName, sort: 'relevance' }
  if (hasPosition(state) && state.maxDistance) {
    if (state.zip) {
      query.zip = state.zip
      query.country = state.zipCountry || 'DE'
    }
    else {
      query.lat = String(state.lat)
      query.lon = String(state.lon)
      if (state.countries.length === 1 && state.countries[0] !== 'EU') query.country = state.countries[0]!
    }
    query.max_distance = String(state.maxDistance)
    return query
  }
  const single = state.countries.length === 1 ? state.countries[0]! : ''
  if (single && single !== 'EU') query.country = single
  return query
}

/**
 * The country dropdown next to "My country" changed. While that quick action is active the
 * filter follows the dropdown, otherwise the URL would keep filtering the old country.
 */
export function changeMyCountry(state: OfferFilterState, previousCountry: string, nextCountry: string): OfferFilterState {
  return activeQuickAction(state, previousCountry) === 'country' ? { ...state, countries: [nextCountry] } : state
}

/** Number shown on "More filters": selections a quick action does not already account for. */
export function moreFilterCount(state: OfferFilterState, myCountry: string): number {
  const quick = activeQuickAction(state, myCountry)
  const countries = quick === 'country' || quick === 'eu' ? 0 : state.countries.filter(c => c !== 'EU').length
  return state.platforms.length + countries
}
