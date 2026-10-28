type Offer = { price?: number | null, currency?: string | null, postedAt?: string | null }
export type OfferSort = { field: 'price' | 'date', ascending: boolean }

/** A numeric price comparison needs one explicit currency across the loaded offers. */
export function canSortOfferPrices(offers: readonly Offer[]): boolean {
  const currency = offers[0]?.currency?.trim().toUpperCase()
  return !!currency && /^[A-Z]{3}$/.test(currency)
    && offers.every(offer => offer.currency?.trim().toUpperCase() === currency)
}

export function sortLoadedOffers<T extends Offer>(offers: readonly T[], sort: OfferSort | null): readonly T[] {
  if (!sort || (sort.field === 'price' && !canSortOfferPrices(offers))) return offers
  const value = (offer: Offer) => sort.field === 'price'
    ? typeof offer.price === 'number' && Number.isFinite(offer.price) && offer.price > 0 ? offer.price : NaN
    : Date.parse(offer.postedAt ?? '')
  return [...offers].sort((a, b) => {
    const left = value(a), right = value(b)
    if (!Number.isFinite(left)) return Number.isFinite(right) ? 1 : 0
    if (!Number.isFinite(right)) return -1
    return (left - right) * (sort.ascending ? 1 : -1)
  })
}
