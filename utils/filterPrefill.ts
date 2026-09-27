/**
 * Pure parsing for prefilling the new-filter form (pages/filters/create.vue) from query
 * params — used by the "Notify me about new offers" link on a product page (see
 * utils/notifyFilterUrl.ts), but written generically so any `?searchValue=&minPrice=&
 * maxPrice=&condition=` link can prefill the form.
 *
 * Only ever applied when creating a NEW filter (no `?id=`) — editing an existing filter
 * always loads its saved values instead.
 */

/** Matches Vue Router's `LocationQuery` value shape, so callers can pass `route.query` directly. */
export type FilterPrefillQueryValue = string | (string | null)[] | null | undefined

export interface FilterPrefillQuery {
  searchValue?: FilterPrefillQueryValue
  minPrice?: FilterPrefillQueryValue
  maxPrice?: FilterPrefillQueryValue
  condition?: FilterPrefillQueryValue
}

export interface FilterPrefill {
  searchValue?: string
  minPrice?: number
  maxPrice?: number
  condition?: string
}

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
 * Parse and validate the prefill query params. Unknown/malformed values are dropped
 * rather than surfaced as errors — the fields stay editable and simply keep the form's
 * own defaults for anything that doesn't parse.
 */
export function parseFilterPrefillQuery(query: FilterPrefillQuery): FilterPrefill {
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

  return result
}
