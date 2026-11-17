import { OPEN_MAX_PRICE } from './filterWire.ts'

interface PricedOffer {
  id?: string | null
  platform?: string | null
  price?: number | null
  shipping?: string | null
}

interface FilterEntry {
  name?: string | null
  value?: unknown
}

interface WithFilters {
  filters?: FilterEntry[] | null
}

function priceRangeOf(listener: WithFilters): [number, number] | null {
  const entry = listener.filters?.find(f => f.name === 'PriceRange')
  if (!entry || typeof entry.value !== 'string') return null
  const [min = NaN, max = NaN] = entry.value.split('-').map(Number)
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  return [min, max]
}

/**
 * The same request with the max price lifted (min and every other filter kept, PriceRange stays in place
 * because it is also the backend's currency check). Null when there is nothing above a cap to find:
 * no max, or a max of 0 (free-only filters).
 */
export function withoutMaxPrice<T extends WithFilters>(listener: T): T | null {
  const range = priceRangeOf(listener)
  if (!range || range[1] <= 0 || range[1] >= OPEN_MAX_PRICE) return null
  const filters = (listener.filters ?? []).map(f => f.name === 'PriceRange' ? { ...f, value: `${range[0]}-${OPEN_MAX_PRICE}` } : f)
  return { ...listener, filters }
}

/** First amount of a shipping text, culture independent ("5.00", "5,00", "1.299,00", "1,299.00"); mirrors the backend. */
export function parseShippingAmount(shipping: string | null | undefined): number {
  const match = shipping?.match(/\d[\d.,]*/)
  if (!match) return 0
  const text = match[0].replace(/[.,]+$/, '')
  const last = Math.max(text.lastIndexOf('.'), text.lastIndexOf(','))
  const isThousands = last >= 0 && text.length - last - 1 === 3
  const integer = (last < 0 || isThousands ? text : text.slice(0, last)).replace(/[.,]/g, '')
  const fraction = last < 0 || isThousands ? '' : text.slice(last + 1)
  const amount = Number(fraction ? `${integer}.${fraction}` : integer)
  return Number.isFinite(amount) ? amount : 0
}

/** What the backend compares against the max: price plus shipping. */
export function offerTotal(offer: PricedOffer): number {
  const shipping = offer.shipping == null || offer.shipping === '0' ? 0 : parseShippingAmount(offer.shipping)
  return (offer.price ?? 0) + shipping
}

function offerKey(offer: PricedOffer): string {
  return `${offer.platform ?? ''}|${offer.id ?? ''}`
}

/** Offers of the uncapped result that the capped (backend-matched) result does not contain, deduped, cheapest total first. */
export function offersAboveMax<T extends PricedOffer>(capped: T[], uncapped: T[]): T[] {
  const seen = new Set(capped.map(offerKey))
  const above: T[] = []
  for (const offer of uncapped) {
    const key = offerKey(offer)
    if (seen.has(key)) continue
    seen.add(key)
    above.push(offer)
  }
  return above.sort((a, b) => offerTotal(a) - offerTotal(b))
}

/** New max that makes the cheapest over-cap offer match (price + shipping, rounded up); always above the current max. */
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
