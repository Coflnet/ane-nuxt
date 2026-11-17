/**
 * Turns the current /search state into a `/filters/create` link, so "Notify me about new
 * offers" on the results starts a notifier with the same query and filters.
 */

export interface SearchFilterState {
  query: string
  minPrice?: number
  maxPrice?: number
  /** search condition value, e.g. 'new', 'gebraucht', 'for_parts' */
  condition?: string
  /** active attribute filters without the `attr_` prefix */
  attributes?: Record<string, readonly string[]>
  category?: string
  platforms?: readonly string[]
}

export interface FilterCreateLink {
  path: '/filters/create'
  query: Record<string, string>
}

/** Attribute keys the notifier understands; everything else stays a search-only filter. */
export const NOTIFY_ATTRIBUTE_KEYS = [
  'storage', 'ram', 'memory', 'size', 'color', 'colour', 'screen_size',
  'model', 'edition', 'media_format', 'console_name', 'language',
] as const

/** Search condition values (see conditionMap in pages/search.vue) → filter values all|new|used|broken. */
const CONDITION_TO_FILTER: Record<string, string> = {
  'new': 'new', 'neu': 'new', 'nieuw': 'new',
  'used': 'used', 'gebraucht': 'used', 'like_new': 'used', 'like new': 'used', 'good': 'used',
  'very_good': 'used', 'very good': 'used', 'acceptable': 'used', 'refurbished': 'used',
  'broken': 'broken', 'for_parts': 'broken', 'for parts': 'broken',
}

export function filterCondition(condition?: string): string {
  return CONDITION_TO_FILTER[(condition ?? '').trim().toLowerCase()] ?? ''
}

function priceParam(price?: number): string {
  return price !== undefined && Number.isFinite(price) && price >= 0 ? String(price) : ''
}

function cleanAttributeValue(value: string): string {
  return value.replace(/[;|=]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** `key=alt|alt;key=alt` for whitelisted keys; separators are stripped from values. */
export function encodeNotifyAttributes(attributes: Record<string, readonly string[]> = {}): string {
  const allowed = NOTIFY_ATTRIBUTE_KEYS as readonly string[]
  return Object.entries(attributes)
    .filter(([key]) => allowed.includes(key))
    .map(([key, values]) => [key, values.map(cleanAttributeValue).filter(Boolean)] as const)
    .filter(([, values]) => values.length > 0)
    .map(([key, values]) => `${key}=${values.join('|')}`)
    .join(';')
}

export function searchToFilterQuery(state: SearchFilterState): FilterCreateLink {
  const params: Record<string, string> = {
    searchValue: state.query.trim(),
    minPrice: priceParam(state.minPrice),
    maxPrice: priceParam(state.maxPrice),
    condition: filterCondition(state.condition),
    attributes: encodeNotifyAttributes(state.attributes),
    category: (state.category ?? '').trim(),
    marketplace: (state.platforms ?? []).filter(Boolean).join(','),
    source: 'search',
  }
  const query = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== ''))
  return { path: '/filters/create', query }
}
