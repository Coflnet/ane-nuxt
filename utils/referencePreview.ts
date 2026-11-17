/**
 * Pure helpers that apply a reference listing preview (POST /api/reference-listings/preview)
 * to the filter form: search term, reference fields and the price chips of the Price branch.
 */
import type { Filter } from '../types/FilterType.ts'
import type { ReferenceListingPreviewResponse, ReferencePriceCandidate } from '../types/ReferenceListing.ts'

interface PricedPart { price: number, currency: string }

const WORD_CHARACTER = /[\p{L}\p{N}]/u
const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu

/**
 * Listing titles become search terms: "iPhone 6 - 16 GB" → "iphone 6 16 gb". Standalone punctuation
 * ("-", "|", "/") and edge punctuation ("TOP!!!") go; the backend tokenizes on punctuation anyway and
 * treats "|" as an alternative, so a pipe in a title would silently split the search in two.
 */
export function cleanSearchTerm(raw: string): string {
  return raw.replace(/\|/g, ' ').split(/\s+/)
    .map(token => token.replace(EDGE_PUNCTUATION, ''))
    .filter(token => WORD_CHARACTER.test(token))
    .join(' ').toLowerCase()
}

/** The search term the backend suggests (cleaned); raw page titles match almost nothing. */
export function suggestedSearchTerm(preview: ReferenceListingPreviewResponse): string {
  return cleanSearchTerm(preview.suggestedFilter?.searchTerm || preview.listing?.productSearchQuery || '')
}

const SOURCE_RANK: Record<string, number> = { render: 0, markup: 1, meta: 2 }
export const MAX_PRICE_CHIPS = 4

function sourceRank(candidate: ReferencePriceCandidate): number {
  return SOURCE_RANK[candidate.source] ?? 3
}

/** Better duplicate first: a kept (applied) selector, then render > markup > meta, confidence, shortest text. */
function compareDuplicates(keep: Set<string>) {
  return (a: ReferencePriceCandidate, b: ReferencePriceCandidate) =>
    Number(keep.has(b.selector)) - Number(keep.has(a.selector))
    || sourceRank(a) - sourceRank(b)
    || b.confidence - a.confidence
    || a.text.length - b.text.length
}

function bestPerPrice(candidates: ReferencePriceCandidate[], keep: Set<string>): ReferencePriceCandidate[] {
  const groups = new Map<string, ReferencePriceCandidate[]>()
  for (const candidate of candidates) {
    const key = `${candidate.currency}:${candidate.price}`
    groups.set(key, [...(groups.get(key) ?? []), candidate])
  }
  return [...groups.values()].map(group => [...group].sort(compareDuplicates(keep))[0]!)
}

/**
 * Price chips to show: one per price and currency, auto-selected first, then by confidence, at most
 * four. Candidates in `keep` (already applied to the form) are never dropped or hidden by the cap.
 */
export function displayPriceCandidates(preview: ReferenceListingPreviewResponse, keep: string[] = []): ReferencePriceCandidate[] {
  const kept = new Set(keep)
  const sorted = bestPerPrice(preview.priceCandidates, kept)
    .sort((a, b) => Number(b.isAutoSelected) - Number(a.isAutoSelected) || b.confidence - a.confidence)
  const mustShow = sorted.filter(c => kept.has(c.selector) || c.isAutoSelected)
  const room = Math.max(MAX_PRICE_CHIPS - mustShow.length, 0)
  const optional = sorted.filter(c => !mustShow.includes(c)).slice(0, room)
  return sorted.filter(c => mustShow.includes(c) || optional.includes(c))
}

/** The listing has prices but none was chosen: the user has to say which one is the price. */
export function needsPriceChoice(preview: ReferenceListingPreviewResponse, applied: string[]): boolean {
  return preview.requiresReferencePriceSelection && !applied.length && preview.priceCandidates.length > 0
}

function pricedPart(preview: ReferenceListingPreviewResponse, selector: string): PricedPart | undefined {
  const candidate = preview.priceCandidates.find(c => c.selector === selector)
  if (candidate) return candidate
  const node = preview.renderedNodes?.find(n => n.xpath === selector || n.css === selector)
  return node?.price != null ? { price: node.price, currency: node.currency || 'EUR' } : undefined
}

/** Selectors whose parts share the first one's currency, in order; unknown ones dropped. */
export function compatibleSelectors(preview: ReferenceListingPreviewResponse, selectors: string[]): string[] {
  const parts = [...new Set(selectors)].map(selector => ({ selector, part: pricedPart(preview, selector) }))
    .filter(entry => entry.part)
  const currency = parts[0]?.part?.currency
  return parts.filter(entry => entry.part!.currency === currency).map(entry => entry.selector)
}

/** Sum of the selected price parts, rounded to cents. */
export function referenceTotal(preview: ReferenceListingPreviewResponse, selectors: string[]): number {
  const total = compatibleSelectors(preview, selectors).reduce((sum, selector) => sum + pricedPart(preview, selector)!.price, 0)
  return Math.round(total * 100) / 100
}

/** Saved choice when the preview still finds it, otherwise the auto-selected candidates. */
export function initialPriceSelectors(preview: ReferenceListingPreviewResponse, savedSelector?: string, savedExtras: string[] = []): string[] {
  if (savedSelector && preview.selectedReference?.selector === savedSelector)
    return compatibleSelectors(preview, [savedSelector, ...savedExtras])
  const auto = preview.priceCandidates.filter(c => c.isAutoSelected).map(c => c.selector)
  if (auto.length) return compatibleSelectors(preview, auto)
  return preview.selectedReference ? [preview.selectedReference.selector] : []
}

/** Reference identity (and, unless `search` is false, the suggested search term) from the listing. */
export function applyReferenceListing(state: Filter, preview: ReferenceListingPreviewResponse, options = { search: true }): void {
  const term = suggestedSearchTerm(preview)
  if (term && options.search) state.searchValue = term
  state.referenceUrl = preview.url
  state.referenceTitle = preview.listing.title
  state.referenceMarketplace = preview.marketplace
}

/** Selected price parts → reference price, its currency and the max price (total rounded up). */
export function applyReferencePrices(state: Filter, preview: ReferenceListingPreviewResponse, selectors: string[], now = new Date()): void {
  const chosen = compatibleSelectors(preview, selectors)
  if (!chosen.length) {
    state.referenceSelector = ''
    state.referenceAdditionalSelectors = []
    state.referencePrice = 0
    return
  }
  const total = referenceTotal(preview, chosen)
  const currency = pricedPart(preview, chosen[0]!)!.currency
  state.maxPrice = Math.max(1, Math.ceil(total))
  state.currency = currency
  state.referencePrice = total
  state.referenceCurrency = currency
  state.referenceSelector = chosen[0]!
  state.referenceAdditionalSelectors = chosen.slice(1)
  state.referenceLastRefreshedAt = now.toISOString()
}

/** Selectors currently applied to the form (primary first). */
export function appliedSelectors(state: Filter): string[] {
  return state.referenceSelector ? [state.referenceSelector, ...(state.referenceAdditionalSelectors ?? [])] : []
}

/** Removes the reference; the search term and price stay editable as they are. */
export function clearReference(state: Filter): void {
  state.referenceUrl = ''
  state.referenceTitle = ''
  state.referenceMarketplace = ''
  state.referencePrice = 0
  state.referenceSelector = ''
  state.referenceAdditionalSelectors = []
  state.referenceLastRefreshedAt = ''
}

/** Host name of a saved reference link, for the reference card. */
export function referenceHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  }
  catch { return '' }
}
