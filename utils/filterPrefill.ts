/**
 * Pure parsing for prefilling the new-filter form (pages/filters/create.vue) from query
 * params — used by the "Notify me about new offers" link on a product page (see
 * utils/notifyFilterUrl.ts), but written generically so any `?searchValue=&minPrice=&
 * maxPrice=&condition=` link can prefill the form.
 *
 * Only ever applied when creating a NEW filter (no `?id=`) — editing an existing filter
 * always loads its saved values instead.
 */

import { decodeAttributes } from './attributeAlternatives.ts'

/** Matches Vue Router's `LocationQuery` value shape, so callers can pass `route.query` directly. */
export type FilterPrefillQueryValue = string | (string | null)[] | null | undefined

export interface FilterPrefillQuery {
  searchValue?: FilterPrefillQueryValue
  minPrice?: FilterPrefillQueryValue
  maxPrice?: FilterPrefillQueryValue
  condition?: FilterPrefillQueryValue
  marketplace?: FilterPrefillQueryValue
  referenceUrl?: FilterPrefillQueryValue
  referenceTitle?: FilterPrefillQueryValue
  referenceSelector?: FilterPrefillQueryValue
  referencePrice?: FilterPrefillQueryValue
  referenceAdditionalSelectors?: FilterPrefillQueryValue
  referenceCurrency?: FilterPrefillQueryValue
  /** A listing link; behaves like a link pasted into the search box. */
  url?: FilterPrefillQueryValue
  /** Attribute chips in the `Attributes` wire format (`key=alt|alt;key=alt`). */
  attributes?: FilterPrefillQueryValue
  /** Category of the originating search; context only, never saved. */
  category?: FilterPrefillQueryValue
  /** Where the link came from, for the "from …" tags: search | listing | photo. */
  source?: FilterPrefillQueryValue
  /** `photo` opens the photo entry. */
  entry?: FilterPrefillQueryValue
}

export type FilterPrefillSource = 'search' | 'listing' | 'photo'

export interface FilterPrefill {
  searchValue?: string
  minPrice?: number
  maxPrice?: number
  condition?: string
  marketplace?: string
  referenceUrl?: string
  referenceTitle?: string
  referenceSelector?: string
  referencePrice?: number
  referenceAdditionalSelectors?: string[]
  referenceCurrency?: string
  url?: string
  attributes?: Record<string, string[]>
  category?: string
  source?: FilterPrefillSource
  entry?: 'photo'
}

/** The prefill keys that are form fields (the rest only steers the page). */
export const PREFILL_FORM_FIELDS = [
  'searchValue', 'minPrice', 'maxPrice', 'condition', 'marketplace', 'attributes', 'referenceUrl', 'referenceTitle',
  'referenceSelector', 'referencePrice', 'referenceAdditionalSelectors', 'referenceCurrency',
] as const

const VALID_SOURCES = new Set<FilterPrefillSource>(['search', 'listing', 'photo'])

/**
 * The only condition values the create-filter form (and backend) understand — see
 * constants/CreateFilterConstants.ts' `condidtion`. Anything else is ignored.
 */
const VALID_CONDITIONS = new Set(['all', 'new', 'used', 'broken'])

function firstString(value: FilterPrefillQueryValue): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw : undefined
}

/** Parses a non-negative, finite price. Anything else (missing, NaN, negative, `Infinity`) is ignored. */
function parseClampedPrice(value: FilterPrefillQueryValue): number | undefined {
  const raw = firstString(value)
  if (raw === undefined || raw.trim() === '') return undefined
  const n = Number(raw)
  if (!Number.isFinite(n)) return undefined
  return Math.max(0, n)
}

/**
 * A single marketplace or a comma-joined list; each one is normalized to its supported
 * spelling, unknown ones are dropped. 'all' only counts on its own.
 */
function parseMarketplaces(value: FilterPrefillQueryValue, supported: string[]): string | undefined {
  const known = (firstString(value) ?? '').split(',')
    .map(name => supported.find(option => option.toLowerCase() === name.trim().toLowerCase()))
    .filter((name): name is string => !!name)
  const unique = [...new Set(known)]
  const explicit = unique.filter(name => name !== 'all')
  if (explicit.length) return explicit.join(',')
  return unique[0]
}

/** Only plain http(s) links without credentials are accepted as a listing link. */
export function parseListingUrl(value: string | undefined): string | undefined {
  try {
    const url = new URL(value?.trim() ?? '')
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.href.length > 2048) return undefined
    return url.href
  }
  catch {
    return undefined
  }
}

function parseContext(query: FilterPrefillQuery): Partial<FilterPrefill> {
  const context: Partial<FilterPrefill> = {}
  const url = parseListingUrl(firstString(query.url))
  if (url) context.url = url
  const attributes = decodeAttributes(firstString(query.attributes)?.slice(0, 2000))
  if (Object.keys(attributes).length) context.attributes = attributes
  const category = firstString(query.category)?.trim().slice(0, 120)
  if (category) context.category = category
  const source = firstString(query.source)?.toLowerCase() as FilterPrefillSource | undefined
  if (source && VALID_SOURCES.has(source)) context.source = source
  if (firstString(query.entry) === 'photo') context.entry = 'photo'
  return context
}

/** The form-field part of a prefill, ready to assign onto the form state. */
export function prefillFormFields(prefill: FilterPrefill): Partial<Pick<FilterPrefill, typeof PREFILL_FORM_FIELDS[number]>> {
  return Object.fromEntries(PREFILL_FORM_FIELDS.filter(key => prefill[key] !== undefined).map(key => [key, prefill[key]]))
}

/**
 * Parse and validate the prefill query params. Unknown/malformed values are dropped
 * rather than surfaced as errors — the fields stay editable and simply keep the form's
 * own defaults for anything that doesn't parse.
 */
export function parseFilterPrefillQuery(query: FilterPrefillQuery, supportedMarketplaces: string[] = []): FilterPrefill {
  const result: FilterPrefill = {}

  const searchValue = firstString(query.searchValue)?.trim()
  if (searchValue) result.searchValue = searchValue

  let minPrice = parseClampedPrice(query.minPrice)
  let maxPrice = parseClampedPrice(query.maxPrice)
  // A malformed pair (min > max) is more likely a mixed-up link than an intentional empty
  // range — swap rather than silently dropping the range the caller asked to prefill.
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice]
  }
  if (minPrice !== undefined) result.minPrice = minPrice
  if (maxPrice !== undefined) result.maxPrice = maxPrice

  const condition = firstString(query.condition)?.trim().toLowerCase()
  if (condition && VALID_CONDITIONS.has(condition)) result.condition = condition

  const marketplace = parseMarketplaces(query.marketplace, supportedMarketplaces)
  if (marketplace) result.marketplace = marketplace

  Object.assign(result, parseContext(query))

  const referenceUrl = firstString(query.referenceUrl)
  const referenceSelector = firstString(query.referenceSelector)
  const referencePrice = parseClampedPrice(query.referencePrice)
  const referenceCurrency = firstString(query.referenceCurrency)?.toUpperCase()
  try {
    const url = new URL(referenceUrl ?? '')
    if (url.protocol === 'https:' && !url.username && !url.password && !url.port && url.href.length <= 2048
      && referenceSelector?.startsWith('/') && referenceSelector.length <= 2048
      && referencePrice !== undefined && referencePrice > 0 && /^[A-Z]{3}$/.test(referenceCurrency ?? '')) {
      result.referenceUrl = url.href
      result.referenceSelector = referenceSelector
      result.referencePrice = referencePrice
      result.referenceCurrency = referenceCurrency
      result.referenceTitle = firstString(query.referenceTitle)?.slice(0, 300) ?? ''
      const extras = firstString(query.referenceAdditionalSelectors)?.split('\n').filter(Boolean) ?? []
      if (extras.length <= 11 && extras.every(s => s.startsWith('/') && s.length <= 2048))
        result.referenceAdditionalSelectors = [...new Set(extras)].filter(s => s !== referenceSelector)
      result.maxPrice = Math.ceil(referencePrice)
    }
  }
  catch { /* An invalid reference leaves the editable search and price prefill intact. */ }

  return result
}
