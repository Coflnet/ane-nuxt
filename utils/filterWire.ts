/**
 * Pure conversion between the create/edit form state (types/FilterType.ts `Filter`) and the
 * `filters[]` wire list of a saved filter (ListingListener).
 *
 * The push order is part of the contract (E2E asserts it and older crawlers read it in order):
 * Fuzzyness, Country, Frequency, PriceRange, Condition, DeliveryMethod, IncludePlatforms,
 * CommercialSeller, Radius, SearchTerm, Attributes, TotalCost, ContainsKeyWord,
 * NotContainsKeyWord, VisualSimilarityFilter, Reference*, KleinanzeigenKategorie, then every
 * saved entry the form does not model, unchanged. Names are never emitted twice: crawlers
 * build a dictionary by name and would crash on duplicates.
 */
import type { Filter, WireFilter } from '../types/FilterType.ts'
import { decodeAttributes, encodeAttributes, stripAttributeTokens } from './attributeAlternatives.ts'

export const DEFAULT_FILTER_COUNTRY = 'EU,US,GB'
/** Upper bound sent for "min price only" ranges; decoded back to "no upper bound". */
export const OPEN_MAX_PRICE = 1000000

export interface BuildFiltersContext {
  /** Marketplaces sent when the form says "all" (the free ones). */
  freeMarketplaces: string[]
  /** [lat, lon] of the zip code; Radius is only sent with a location. */
  location?: [string, string] | null
  /** Only send `Attributes` when the backend lists it in /api/filters/options. */
  attributesSupported?: boolean
}

/** The values a brand-new filter starts with ("any" everywhere, no notification). */
export function defaultFilterState(): Filter {
  return {
    name: '',
    marketplace: 'all',
    searchValue: '',
    zipcode: '',
    searchRadius: 100,
    seller: '',
    keywords: [[]],
    blacklist: [],
    minPrice: '',
    maxPrice: '',
    attributes: {},
    kleinanzeigenCategory: '',
    passthrough: [],
    currency: '€',
    location: '',
    id: 0,
    notificationType: 'Unknown',
    notificationTarget: '',
    country: DEFAULT_FILTER_COUNTRY,
    condition: '',
    deliveryMethod: '',
    frequency: '',
    fuzzyness: '0',
    visualSimilarity: '',
    referenceUrl: '',
    referenceTitle: '',
    referenceMarketplace: '',
    referencePrice: 0,
    referenceCurrency: '',
    referenceSelector: '',
    referenceAdditionalSelectors: [],
    referenceLastRefreshedAt: '',
  }
}

/** True for '' / 'all' / lists containing 'all' — the "any" choice of a multi select. */
export function isAnyChoice(value: string | null | undefined): boolean {
  if (!value) return true
  return value.split(',').includes('all')
}

function priceOrEmpty(value: number | '' | null | undefined): number | '' {
  if (value === '' || value == null) return ''
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : ''
}

/** Like priceOrEmpty, but an explicit 0 is kept: a max of 0 means "free items only". */
function maxPriceOrEmpty(value: number | '' | null | undefined): number | '' {
  if (value === '' || value == null) return ''
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : ''
}

/** Encodes the price inputs; undefined = "any price" (omit PriceRange). */
export function encodePriceRange(minPrice: number | '', maxPrice: number | ''): string | undefined {
  const min = priceOrEmpty(minPrice)
  const max = maxPriceOrEmpty(maxPrice)
  if (min === '' && max === '') return undefined
  const low = min === '' ? 0 : Math.floor(min)
  const high = max === '' ? OPEN_MAX_PRICE : Math.ceil(max)
  return `${low}-${high}`
}

/** Decodes a saved PriceRange; a 0 minimum and the open upper bound come back as empty inputs; a 0 maximum stays (free items). */
export function decodePriceRange(value: string): { minPrice: number | '', maxPrice: number | '' } {
  const [min, max] = value.split('-').map(Number)
  return {
    minPrice: priceOrEmpty(min),
    maxPrice: max != null && max >= OPEN_MAX_PRICE ? '' : maxPriceOrEmpty(max),
  }
}

type Encoder = (state: Filter, ctx: BuildFiltersContext) => string | boolean | undefined

function keywordGroups(state: Filter): string | undefined {
  const groups = state.keywords.map(group => group.join(',')).filter(group => group !== '')
  return groups.length ? groups.join('|') : undefined
}

function platforms(state: Filter, ctx: BuildFiltersContext): string {
  return state.marketplace === 'all' ? ctx.freeMarketplaces.join(',') : state.marketplace
}

function radius(state: Filter, ctx: BuildFiltersContext): string | undefined {
  if (!state.zipcode || !ctx.location) return undefined
  return `${ctx.location[0]};${ctx.location[1]};${state.searchRadius};${state.zipcode}`
}

function sendsAttributes(state: Filter, ctx: BuildFiltersContext): boolean {
  return !!ctx.attributesSupported && encodeAttributes(state.attributes) !== ''
}

function searchTerm(state: Filter, ctx: BuildFiltersContext): string {
  return sendsAttributes(state, ctx) ? stripAttributeTokens(state.searchValue, state.attributes) : state.searchValue
}

const orNothing = (value: string | undefined | null) => value || undefined

/** Encoders in wire order. `null` marks a slot only ever filled from the saved passthrough. */
const ENCODERS: [string, Encoder | null][] = [
  ['Fuzzyness', s => (s.fuzzyness !== '0' ? s.fuzzyness : undefined)],
  ['Country', s => (s.country !== DEFAULT_FILTER_COUNTRY ? s.country : undefined)],
  ['Frequency', s => orNothing(s.frequency)],
  ['PriceRange', s => encodePriceRange(s.minPrice, s.maxPrice)],
  ['Condition', s => (isAnyChoice(s.condition) ? undefined : s.condition)],
  ['DeliveryMethod', s => (isAnyChoice(s.deliveryMethod) ? undefined : s.deliveryMethod)],
  ['IncludePlatforms', platforms],
  ['CommercialSeller', null],
  ['Radius', radius],
  ['SearchTerm', searchTerm],
  ['Attributes', (s, ctx) => (sendsAttributes(s, ctx) ? encodeAttributes(s.attributes) : undefined)],
  ['TotalCost', null],
  ['ContainsKeyWord', keywordGroups],
  ['NotContainsKeyWord', s => orNothing(s.blacklist.join(','))],
  ['VisualSimilarityFilter', s => orNothing(s.visualSimilarity)],
  ['ReferenceUrl', s => orNothing(s.referenceUrl)],
  ['ReferenceTitle', s => orNothing(s.referenceTitle)],
  ['ReferenceMarketplace', s => orNothing(s.referenceMarketplace)],
  ['ReferencePrice', s => (s.referencePrice ? String(s.referencePrice) : undefined)],
  // Doubles as the budget currency, so it is always sent.
  ['ReferenceCurrency', s => s.referenceCurrency || 'EUR'],
  ['ReferenceSelector', s => orNothing(s.referenceSelector)],
  ['ReferenceAdditionalSelectors', s => orNothing(s.referenceAdditionalSelectors?.join('\n'))],
  ['ReferenceLastRefreshedAt', s => orNothing(s.referenceLastRefreshedAt)],
  // The backend applies it to every listing, so it is only sent for a Kleinanzeigen-only filter.
  ['KleinanzeigenKategorie', s => (s.marketplace === 'Kleinanzeigen' ? orNothing(s.kleinanzeigenCategory) : undefined)],
]

/** Names the form owns; anything else in a saved filter is passed through unchanged. */
export const MODELED_FILTER_NAMES = new Set(ENCODERS.filter(([, encode]) => encode).map(([name]) => name))

function slotValue(name: string, encode: Encoder | null, state: Filter, ctx: BuildFiltersContext) {
  if (encode) return encode(state, ctx)
  return state.passthrough.find(entry => entry.name === name)?.value
}

/** Form state → wire filters, in the fixed order, without duplicate names. */
export function buildFilters(state: Filter, ctx: BuildFiltersContext): WireFilter[] {
  const filters: WireFilter[] = []
  const seen = new Set<string>()
  const add = (name: string, value: WireFilter['value'] | undefined) => {
    if (value === undefined || seen.has(name)) return
    seen.add(name)
    filters.push({ name, value })
  }
  for (const [name, encode] of ENCODERS) add(name, slotValue(name, encode, state, ctx))
  for (const entry of state.passthrough) add(entry.name, entry.value)
  return filters
}

type Decoder = (state: Filter, value: string) => void

function decodeRadius(state: Filter, value: string) {
  const [, , distance, zipcode] = value.split(';')
  state.searchRadius = Number(distance ?? 0)
  state.zipcode = zipcode ?? ''
}

const DECODERS: Record<string, Decoder> = {
  Fuzzyness: (s, v) => { s.fuzzyness = v || '2' },
  Country: (s, v) => { s.country = v },
  Frequency: (s, v) => { s.frequency = v },
  PriceRange: (s, v) => { Object.assign(s, decodePriceRange(v)) },
  Condition: (s, v) => { s.condition = v },
  DeliveryMethod: (s, v) => { s.deliveryMethod = v },
  // A saved explicit list stays explicit as the advertised sources change.
  IncludePlatforms: (s, v) => { s.marketplace = v },
  Radius: decodeRadius,
  SearchTerm: (s, v) => { s.searchValue = v },
  Attributes: (s, v) => { s.attributes = decodeAttributes(v) },
  ContainsKeyWord: (s, v) => { if (v) s.keywords = v.split('|').map(group => group.split(',')) },
  NotContainsKeyWord: (s, v) => { if (v) s.blacklist = v.split(',') },
  VisualSimilarityFilter: (s, v) => { s.visualSimilarity = v },
  ReferenceUrl: (s, v) => { s.referenceUrl = v },
  ReferenceTitle: (s, v) => { s.referenceTitle = v },
  ReferenceMarketplace: (s, v) => { s.referenceMarketplace = v },
  ReferencePrice: (s, v) => { s.referencePrice = Number(v || 0) },
  ReferenceCurrency: (s, v) => { s.referenceCurrency = v },
  ReferenceSelector: (s, v) => { s.referenceSelector = v },
  ReferenceAdditionalSelectors: (s, v) => {
    s.referenceAdditionalSelectors = v.split('\n').map(line => line.trim()).filter(Boolean)
  },
  ReferenceLastRefreshedAt: (s, v) => { s.referenceLastRefreshedAt = v },
  KleinanzeigenKategorie: (s, v) => { s.kleinanzeigenCategory = v },
}

/** Wire filters → form state (starting from the defaults); unknown entries become passthrough. */
export function parseFilters(filters: { name?: string | null, value?: unknown }[]): Filter {
  const state = defaultFilterState()
  for (const item of filters) {
    if (!item.name) continue
    const decode = DECODERS[item.name]
    if (decode) decode(state, item.value == null ? '' : String(item.value))
    else if (!state.passthrough.some(entry => entry.name === item.name))
      state.passthrough.push({ name: item.name, value: item.value as WireFilter['value'] })
  }
  return state
}

/** Names of the wire filters a state would send, e.g. for the suggest-a-filter context. */
export function activeFilterNames(state: Filter, ctx: BuildFiltersContext): string[] {
  return buildFilters(state, ctx).map(entry => entry.name)
}
