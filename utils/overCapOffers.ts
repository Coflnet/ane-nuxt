import { OPEN_MAX_PRICE } from './filterWire.ts'

interface PricedOffer {
  price?: number | null
  aboveMax?: boolean | null
  totalPrice?: number | null
}

interface WithFilters {
  filters?: { name?: string | null, value?: unknown }[] | null
}

/** How far above the max the backend looks for offers that would match with a raised max. */
export const ABOVE_MAX_FACTOR = 1.5

/** True when the filter has a finite max above 0 (open max and free-only filters have nothing above a cap to find). */
export function hasFiniteMax(listener: WithFilters): boolean {
  const entry = listener.filters?.find(f => f.name === 'PriceRange')
  if (!entry || typeof entry.value !== 'string') return false
  const max = Number(entry.value.split('-')[1])
  return Number.isFinite(max) && max > 0 && max < OPEN_MAX_PRICE
}

/** Price plus shipping as the backend compared it with the max; falls back to the plain price. */
export function offerTotal(offer: PricedOffer): number {
  return offer.totalPrice ?? offer.price ?? 0
}

/** Splits a test response into within-cap matches and above-max matches (cheapest total first); old backends send no flag. */
export function splitAboveMax<T extends PricedOffer>(response: T[]): { within: T[], above: T[] } {
  const within = response.filter(offer => !offer.aboveMax)
  const above = response.filter(offer => offer.aboveMax).sort((a, b) => offerTotal(a) - offerTotal(b))
  return { within, above }
}

/** New max that makes the cheapest over-cap offer match (backend total, rounded up); always above the current max. */
export function raiseMaxTo(above: PricedOffer[], currentMax: number | ''): number | null {
  const floor = currentMax === '' ? 0 : currentMax
  const totals = above.map(offerTotal).filter(total => total > 0 && Math.ceil(total) > floor)
  return totals.length ? Math.ceil(Math.min(...totals)) : null
}

export type EmptyStateKind = 'empty' | 'emptyAboveMax'

/** Headline when nothing is within the cap: plain empty, or "empty, but N are above your max". */
export function emptyStateKind(aboveMax: number): EmptyStateKind {
  return aboveMax > 0 ? 'emptyAboveMax' : 'empty'
}
