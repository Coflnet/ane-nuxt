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

export type AutomaticShopReference = { provider: string, url: string, merchantSku: string, brand: string, mpn: string, gtin?: string | null, price: number, currency: 'EUR', availability: string, condition: 'new' | 'unknown', observedAt: string }
export type AutomaticShopResult = { status: 'found' | 'not_found' | 'unsupported' | 'temporarily_unavailable', reference?: AutomaticShopReference | null, retryAt?: string | null }

/** The automatic source must remain a dated, exact-article store quote, separate from manual comparisons. */
export function validAutomaticReference(value: unknown): value is AutomaticShopReference {
  if (!value || typeof value !== 'object') return false
  const quote = value as AutomaticShopReference
  try {
    const url = new URL(quote.url)
    return quote.provider === 'Lefeld' && url.origin === 'https://www.lefeld.de' && !url.username && !url.password && !url.search && !url.hash
      && /^\/(?:knipex|bahco)-[a-zA-Z0-9%-]+$/.test(url.pathname)
      && [quote.merchantSku, quote.brand, quote.mpn].every(field => typeof field === 'string' && field.trim().length > 0)
      && typeof quote.price === 'number' && Number.isFinite(quote.price) && quote.price > 0 && quote.currency === 'EUR'
      && ['InStock', 'LimitedAvailability'].includes(quote.availability) && ['new', 'unknown'].includes(quote.condition)
      && typeof quote.observedAt === 'string' && Number.isFinite(Date.parse(quote.observedAt))
  }
  catch { return false }
}
