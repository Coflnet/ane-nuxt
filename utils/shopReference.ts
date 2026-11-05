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
  { mpn: '7006180', gtin: '4003773033813', merchantSku: '18571', url: 'https://www.gotools.de/marken/knipex/knipex-seitenschneider-laenge-180-mm-mehrkomponenten-huellen_127573_18571' },
  { mpn: '2616200', gtin: '4003773022831', merchantSku: '18574', url: 'https://www.gotools.de/marken/knipex/knipex-flachrundzange-laenge-200-mm-gerade-vde-mehrkomponenten-huellen_127576_18574' },
  { mpn: '2626200', gtin: '4003773022855', merchantSku: '18575', url: 'https://www.gotools.de/marken/knipex/knipex-flachrundzange-laenge-200-mm-40-gewinkelt-vde-mehrkomponenten-huellen_127577_18575' },
  { mpn: '1240200', gtin: '4003773026662', merchantSku: '18578', url: 'https://www.gotools.de/marken/knipex/knipex-automatikabisolierzange-laenge-200-mm-0-03-10-awg-32-7-mm_127580_18578' },
  { mpn: '975236', gtin: '4003773051893', merchantSku: '18579', url: 'https://www.gotools.de/marken/knipex/knipex-crimpzange-preciforce-laenge-220-mm-0-5-6-awg-20-10-mm-487-g_127581_18579' },
  { mpn: '975309', gtin: '4003773044550', merchantSku: '18580', url: 'https://www.gotools.de/marken/knipex/knipex-crimpzange-gesamtlaenge-190-mm-0-08-10-0-16-awg-28-5-mm-brueniert-2-komponenten-huellen_127582_18580' },
  { mpn: '8701125', gtin: '4003773069935', merchantSku: '18583', url: 'https://www.gotools.de/marken/knipex/knipex-wasserpumpenzange-cobra-laenge-125-mm-spannweite-27-mm-poliert-kunststoffueberzug_127585_18583' },
  { mpn: '8701560', gtin: '4003773044321', merchantSku: '18585', url: 'https://www.gotools.de/marken/knipex/knipex-rohr-und-wasserpumpenzange-cobra-laenge-560-mm-spannweite-120-mm-poliert-kunststoffueberzug_127587_18585' },
  { mpn: '8701150', gtin: '4003773060116', merchantSku: '18590', url: 'https://www.gotools.de/marken/knipex/knipex-wasserpumpenzange-cobra-laenge-150-mm-spannweite-30-mm_127592_18590' },
  { mpn: '8603150', gtin: '4003773069676', merchantSku: '18660', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/sanitaerwerkzeuge/zangenschluessel/knipex-zangenschluessel-laenge-150-mm-spannweite-27-mm-verchromt-kunststoffueberzug_127662_18660' },
  { mpn: '8701400', gtin: '4003773005636', merchantSku: '18661', url: 'https://www.gotools.de/marken/knipex/knipex-rohr-und-wasserpumpenzange-cobra-laenge-400-mm-spannweite-95-mm-poliert-kunststoffueberzug_127663_18661' },
  { mpn: '8603180', gtin: '4003773035466', merchantSku: '18663', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/sanitaerwerkzeuge/zangenschluessel/knipex-zangenschluessel-laenge-180-mm-spannweite-40-mm-verchromt-kunststoffueberzug_127665_18663' },
  { mpn: '8603300', gtin: '4003773041429', merchantSku: '18664', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/sanitaerwerkzeuge/zangenschluessel/knipex-zangenschluessel-laenge-300-mm-spannweite-60-mm-verchromt-kunststoffueberzug_127666_18664' },
  { mpn: '7002160', gtin: '4003773034032', merchantSku: '18689', url: 'https://www.gotools.de/marken/knipex/knipex-seitenschneider-laenge-160-mm-kopf-poliert-mehrkomponenten-huellen-max-2mm_127691_18689' },
  { mpn: '8701180', gtin: '4003773022015', merchantSku: '18693', url: 'https://www.gotools.de/marken/knipex/knipex-wasserpumpenzange-cobra-laenge-180-mm-spannweite-36-mm_127695_18693' },
  { mpn: '9536280', gtin: '4003773026891', merchantSku: '18732', url: 'https://www.gotools.de/marken/knipex/knipex-kabelschneider-gesamtlaenge-280-mm-max-52-380-mm-mm-mehrkomponenten-huellen-vde_127734_18732' },
  { mpn: '8702250', gtin: '4003773040316', merchantSku: '18791', url: 'https://www.gotools.de/marken/knipex/knipex-wasserpumpenzange-cobra-laenge-250-mm-spannweite-46-mm-poliert-mehrkomponenten-huellen_127793_18791' },
  { mpn: '8703250', gtin: '4003773043805', merchantSku: '29360', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/wasserpumpenzange/wasserpumpenzange-cobra-knipex/knipex-wasserpumpenzange-cobra-laenge-250-mm-spannweite-46-mm-verchromt-kunststoffueberzug_138364_29360' },
  { mpn: '9721215C', gtin: '4003773019701', merchantSku: '30072', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/crimpzangen-und-zubehoer/crimpzangen/crimpzange-knipex/knipex-crimpzange-laenge-230-mm-0-5-6-awg-20-10-mm_139076_30072' },
  { mpn: '975230', gtin: '4003773051855', merchantSku: '30176', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/crimpzangen-und-zubehoer/crimpzangen/crimpzange-preciforce-knipex/knipex-crimpzange-preciforce-laenge-220-mm-1-5-10-awg-15-11-mm-477-g_139180_30176' },
  { mpn: '975233', gtin: '4003773051862', merchantSku: '30187', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/crimpzangen-und-zubehoer/crimpzangen/crimpzange-preciforce-knipex/knipex-crimpzange-preciforce-laenge-220-mm-0-5-10-awg-20-7-mm-478-g_139191_30187' },
  { mpn: '7006125', gtin: '4003773018124', merchantSku: '31064', url: 'https://www.gotools.de/werkstattbedarf/handwerkzeuge/zangen/seitenschneider/seitenschneider/seitenschneider-knipex/knipex-seitenschneider-laenge-125-mm-vde-mehrkomponenten-huellen_140068_31064' },
]

// Same fifteen-minute lifetime as ProductStoreReferencePolicy in AneCore.
export const AUTOMATIC_REFERENCE_MAX_AGE_MS = 15 * 60_000

/** The automatic source must remain a dated, exact-article store quote, separate from manual comparisons. */
export function validAutomaticReference(value: unknown, now = Date.now()): value is AutomaticShopReference {
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
        && Date.parse(quote.observedAt) <= now && Date.parse(quote.observedAt) + AUTOMATIC_REFERENCE_MAX_AGE_MS > now
  }
  catch { return false }
}
