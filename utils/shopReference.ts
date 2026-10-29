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

const goToolsArticles = [
  { mpn: '0301160', gtin: '4003773013235', merchantSku: '35930', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/knipex-kombizange-laenge-160-mm-poliert-kunststoffueberzug_144938_35930' },
  { mpn: '8701250', gtin: '4003773022022', merchantSku: '18450', url: 'https://www.gotools.de/marken/knipex/knipex-wasserpumpenzange-cobra-laenge-250-mm-spannweite-46-mm-poliert_127452_18450' },
  { mpn: '8603250', gtin: '4003773033837', merchantSku: '18589', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/sanitaerwerkzeuge/zangenschluessel/knipex-zangenschluessel-laenge-250-mm-spannweite-52-mm-verchromt-kunststoffueberzug_127591_18589' },
  { mpn: '2612200', gtin: '4003773023142', merchantSku: '18690', url: 'https://www.gotools.de/marken/knipex/knipex-flachrundzange-laenge-200-mm-poliert-gerade-mehrkomponenten-huellen_127692_18690' },
  { mpn: '2615200', gtin: '4003773035022', merchantSku: '51163', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/flachrundzangen-storchschnabelzangen/flachrundzange-storchschnabelzange/flachrundzange-knipex/knipex-flachrundzange-laenge-200-mm-verchromt-gerade-mehrkomponenten-huellen_160171_51163' },
  { mpn: '1106160', gtin: '4003773021933', merchantSku: '18576', url: 'https://www.gotools.de/marken/knipex/knipex-abisolierzange-laenge-160-mm-vde-verchromt-mehrkomponenten-huellen_127578_18576' },
  { mpn: '1242195', gtin: '4003773054580', merchantSku: '18691', url: 'https://www.gotools.de/marken/knipex/knipex-automatikabisolierzange-multistrip-10-laenge-195-mm-0-03-10-awg-32-7-mm_127693_18691' },
  { mpn: '975304', gtin: '4003773028017', merchantSku: '18581', url: 'https://www.gotools.de/marken/knipex/knipex-aderendhuelsenzange-gesamtlaenge-180-mm-0-08-10-0-16-0-awg-28-5-mm_127583_18581' },
  { mpn: '121202', gtin: '4003773048077', merchantSku: '52547', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/abisolierzangen/abisolierzange/praezisionsabisolierzange-knipex/knipex-praezisionsabisolierzange-laenge-195-mm-mehrkomponeten-huellen-0-03-2-08-awg-32-14-mm_161555_52547' },
  { mpn: '0301180', gtin: '4003773013242', merchantSku: '35540', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/knipex-kombizange-laenge-180-mm-poliert-kunststoffueberzug_144548_35540' },
  { mpn: '0301200', gtin: '4003773013259', merchantSku: '57238', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/knipex-kombizange-laenge-200-mm-poliert-kunststoffueberzug_166246_57238' },
  { mpn: '975314', gtin: '4003773041474', merchantSku: '18659', url: 'https://www.gotools.de/marken/knipex/knipex-aderendhuelsenzange-gesamtlaenge-180-mm-0-08-10-0-awg-28-7-mm-brueniert-mehrkomponenten-huellen_127661_18659' },
]

/** The automatic source must remain a dated, exact-article store quote, separate from manual comparisons. */
export function validAutomaticReference(value: unknown): value is AutomaticShopReference {
  if (!value || typeof value !== 'object') return false
  const quote = value as AutomaticShopReference
  try {
    const url = new URL(quote.url)
    return ((quote.provider === 'Lefeld' && url.origin === 'https://www.lefeld.de' && /^\/(?:knipex|bahco)-[a-zA-Z0-9%-]+$/.test(url.pathname))
      || (quote.provider === 'GoTools' && quote.brand?.trim().toUpperCase() === 'KNIPEX'
        && goToolsArticles.some(article => url.href === article.url && quote.mpn?.replace(/[^a-z0-9]/gi, '') === article.mpn
          && quote.gtin === article.gtin && quote.merchantSku === article.merchantSku)))
        && !url.username && !url.password && !url.search && !url.hash
        && [quote.merchantSku, quote.brand, quote.mpn].every(field => typeof field === 'string' && field.trim().length > 0)
        && typeof quote.price === 'number' && Number.isFinite(quote.price) && quote.price > 0 && quote.currency === 'EUR'
        && ['InStock', 'LimitedAvailability'].includes(quote.availability) && ['new', 'unknown'].includes(quote.condition)
        && typeof quote.observedAt === 'string' && Number.isFinite(Date.parse(quote.observedAt))
  }
  catch { return false }
}
