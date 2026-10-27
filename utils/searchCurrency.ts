/** Native asking-price denomination. Existing amounts without a currency retain legacy EUR. */
export function searchCurrency(query: Record<string, unknown>, platforms: string[] = []): string {
  const explicit = typeof query.price_currency === 'string' ? query.price_currency.trim().toUpperCase() : ''
  if (/^[A-Z]{3}$/.test(explicit)) return explicit
  if (query.price_min !== undefined || query.price_max !== undefined) return 'EUR'
  if (query.country) return ({ GB: 'GBP', SE: 'SEK', PL: 'PLN' } as Record<string, string>)[String(query.country).toUpperCase()] ?? 'EUR'
  return platforms.length === 1 ? ({ Gumtree: 'GBP', Blocket: 'SEK', OLX: 'PLN' } as Record<string, string>)[platforms[0]!] ?? 'EUR' : 'EUR'
}

/** An unpriced native result must never fall back to the legacy product-wide EUR field. */
export function nativeScopedPrice(product: { scopedMinPrice?: number | null, scopedPriceCurrency?: string | null }, currency: string): number | undefined {
  return product.scopedPriceCurrency === currency && Number.isFinite(product.scopedMinPrice) && product.scopedMinPrice! > 0 ? product.scopedMinPrice! : undefined
}
