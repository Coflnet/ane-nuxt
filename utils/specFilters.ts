// Spec filters of the search page (operating system, release year, screen size). The URL carries
// them as attr_* params; the API receives the same names without the prefix as `attributes=key:value`
// (see ProductSearchQueryBuilder.BuildImpliedAttributeQueries / BuildAttributeRangeQueries in AneApi).

/** URL params that are ranges/"or newer" and get their own controls instead of generic attribute chips. */
export const SPEC_RANGE_PARAMS = [
  'attr_os_version_min',
  'attr_os_version_supports',
  'attr_release_year_min',
  'attr_release_year_max',
  'attr_screen_size_min',
  'attr_screen_size_max',
] as const

/** Attribute keys rendered by the dedicated spec controls (not by the generic attribute chip list). */
export const SPEC_ATTRIBUTE_KEYS = new Set(['os', 'os_version', 'release_year', 'screen_size', 'screen_size_inch'])

export interface FilterBucketLike {
  value?: string | null
  count?: number | null
}

/** Number inside a bucket value: `6.1"` and `6,1` give 6.1, anything without a number gives null. */
export function parseBucketNumber(value: string | null | undefined): number | null {
  if (!value) return null
  const match = /^(\d+(?:[.,]\d+)?)\s?(?:"|''|zoll|inch(?:es)?)?$/i.exec(value.trim())
  if (!match) return null
  const parsed = Number(match[1].replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

/** Smallest and largest number among the bucket values, or null when none is numeric. */
export function bucketNumberBounds(buckets: FilterBucketLike[] | undefined): { min: number, max: number } | null {
  const numbers = (buckets ?? []).map(b => parseBucketNumber(b.value)).filter((n): n is number => n !== null)
  if (numbers.length === 0) return null
  return { min: Math.min(...numbers), max: Math.max(...numbers) }
}

/** Version buckets as plain integers, newest first ("15" before "9"), other values dropped. */
export function sortOsVersionBuckets<T extends FilterBucketLike>(buckets: T[] | undefined): T[] {
  return (buckets ?? [])
    .filter(b => /^\d{1,2}$/.test(b.value ?? ''))
    .sort((a, b) => Number(b.value) - Number(a.value))
}

function positiveNumber(raw: unknown): number | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const parsed = Number(raw.trim().replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/**
 * The `attributes` entries for the spec range params of the current URL query. Values that are not
 * positive numbers are dropped, so a hand-edited URL never produces an API error.
 */
export function buildSpecApiFilters(query: Record<string, unknown>): string[] {
  const result: string[] = []
  for (const param of SPEC_RANGE_PARAMS) {
    const value = positiveNumber(query[param])
    if (value !== null) result.push(`${param.slice('attr_'.length)}:${value}`)
  }
  return result
}

/** Updates a `<name>_min`/`<name>_max` pair in a query: values equal to the bounds (or empty) are removed. */
export function withRangeParams(
  query: Record<string, string>,
  name: string,
  range: { min?: number | null, max?: number | null },
  bounds: { min: number, max: number } | null,
): Record<string, string> {
  const minKey = `attr_${name}_min`
  const maxKey = `attr_${name}_max`
  const result = Object.fromEntries(Object.entries(query).filter(([key]) => key !== minKey && key !== maxKey))
  if (range.min != null && Number.isFinite(range.min) && (!bounds || range.min > bounds.min)) {
    result[minKey] = String(range.min)
  }
  if (range.max != null && Number.isFinite(range.max) && (!bounds || range.max < bounds.max)) {
    result[maxKey] = String(range.max)
  }
  return result
}

export interface ImpliedOsFilter {
  os: string
  version: string | null
  /** 'supports': the device runs this version; 'min': its highest official version is at least this. */
  mode: 'supports' | 'min' | null
}

/** The OS filter the backend read from the query text (interpretation.impliedAttributes), if any. */
export function impliedOsFilter(implied: Record<string, string> | null | undefined): ImpliedOsFilter | null {
  const os = implied?.os
  if (!os) return null
  if (implied.os_version_supports) return { os, version: implied.os_version_supports, mode: 'supports' }
  if (implied.os_version_min) return { os, version: implied.os_version_min, mode: 'min' }
  // older backends: exact highest version
  return { os, version: implied.os_version ?? null, mode: implied.os_version ? 'supports' : null }
}

/** Display text of the implied filter: "Android", "Android 15" (runs it), "iOS 18+" (18 or newer). */
export function impliedOsLabel(filter: ImpliedOsFilter): string {
  if (!filter.version) return filter.os
  return `${filter.os} ${filter.version}${filter.mode === 'min' ? '+' : ''}`
}

/** Query text without the phrase the backend turned into a filter ("samsung android 15" minus "android 15"). */
export function removeImpliedPhrase(query: string, phrase: string | null | undefined): string {
  if (!phrase) return query
  const index = query.toLowerCase().indexOf(phrase.toLowerCase())
  if (index < 0) return query
  return (query.slice(0, index) + ' ' + query.slice(index + phrase.length)).replace(/\s+/g, ' ').trim()
}
