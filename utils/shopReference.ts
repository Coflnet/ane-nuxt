import { parseHistoryCurrency } from './priceHistory.ts'

export type ShopPriceCandidate = { selector: string, text: string, price: number, currency: string }
export type ShopPreview = { url: string, host: string, listing: { title: string, condition?: string | null }, priceCandidates: ShopPriceCandidate[] }
export type ShopOffer = { price?: number, currency?: string | null, title?: string | null, condition?: string | null, listingUrl?: string | null }

/** Link validation only; the existing preview endpoint enforces public-address and fetch limits. */
export function referenceWebUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null
  }
  catch { return null }
}

/** Only loaded offers with an explicit matching native currency; never cached product estimates. */
export function lowestSameCurrencyOffer(offers: ShopOffer[], currency: string | null): ShopOffer | null {
  if (!currency) return null
  return offers.filter(offer => Number.isFinite(offer.price) && offer.price! > 0 && parseHistoryCurrency(offer.currency) === currency)
    .reduce<ShopOffer | null>((lowest, offer) => !lowest || offer.price! < lowest.price! ? offer : lowest, null)
}
