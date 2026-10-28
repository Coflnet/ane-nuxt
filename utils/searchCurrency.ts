/** Native asking-price denomination. Existing amounts without a currency retain legacy EUR. */
export function searchCurrency(query: Record<string, unknown>, platforms: string[] = []): string {
  const explicit = typeof query.price_currency === 'string' ? query.price_currency.trim().toUpperCase() : ''
  if (/^[A-Z]{3}$/.test(explicit)) return explicit
  if (query.price_min !== undefined || query.price_max !== undefined) return 'EUR'
  if (query.country) return ({ GB: 'GBP', SE: 'SEK', PL: 'PLN' } as Record<string, string>)[String(query.country).toUpperCase()] ?? 'EUR'
  return platforms.length === 1 ? ({ Gumtree: 'GBP', Blocket: 'SEK', OLX: 'PLN' } as Record<string, string>)[platforms[0]!] ?? 'EUR' : 'EUR'
}

type SearchPriceProduct = {
  id?: string | null
  seoId?: string | null
  scopedMinPrice?: number | null
  scopedPriceCurrency?: string | null
  identifierType?: string | null
  attributes?: { key?: string | null, value?: string | null }[] | Record<string, string> | null
}

/** A native media offer does not establish which game or film it contains. */
export function isUnidentifiedMediaOffer(product: SearchPriceProduct | null | undefined): boolean {
  return !!product && (product.identifierType === 'media_offer' || productAttribute(product, 'product_kind') === 'media_offer'
    || [product.id, product.seoId].some(id => id?.trim().toLowerCase().startsWith('media-offer-')))
}

function productAttribute(product: SearchPriceProduct, key: string): string | null | undefined {
  return Array.isArray(product.attributes)
    ? product.attributes.find(attribute => attribute.key?.toLowerCase() === key)?.value
    : product.attributes?.[key]
}

/** Independent offer kinds keep their own native asking amount, even without a comparable edition. */
export function isIndividualOffer(product: SearchPriceProduct): boolean {
  const kind = productAttribute(product, 'product_kind')
  return isUnidentifiedMediaOffer(product) || product.identifierType?.endsWith('_offer') === true || kind?.endsWith('_offer') === true || kind === 'comic_lot'
}

export function isUnspecificProductGroup(product: SearchPriceProduct): boolean {
  return !isIndividualOffer(product) && productAttribute(product, 'specificity')?.toLowerCase() === 'unspecific'
}

/** An unpriced native result must never fall back to the legacy product-wide EUR field. */
export function nativeScopedPrice(product: SearchPriceProduct, currency: string): number | undefined {
  if (isUnspecificProductGroup(product)) return undefined
  return product.scopedPriceCurrency === currency && Number.isFinite(product.scopedMinPrice) && product.scopedMinPrice! > 0 ? product.scopedMinPrice! : undefined
}
