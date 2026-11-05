import type { Flip } from '../src/api-client/types.gen'

export function getRetailPriceGap(item: Flip, now = Date.now()): number | null {
  const quote = item.retailReference
  const currency = item.listing?.currency?.trim().toUpperCase()
  const observed = Date.parse(quote?.observedAt ?? '')
  const expires = Date.parse(quote?.expiresAt ?? '')
  const price = item.listing?.price ?? NaN
  const referencePrice = quote?.price ?? NaN
  const gap = item.retailPriceGap ?? NaN
  if (item.referenceMode !== 'retail' || item.listing?.attributes?.condition !== 'new' || !quote || quote.condition !== 'new'
    || !['InStock', 'LimitedAvailability'].includes(quote.availability ?? '') || !getRetailReferenceUrl(quote.provider, quote.url)
    || currency !== 'EUR' || quote.currency?.trim().toUpperCase() !== 'EUR'
    || !Number.isFinite(observed) || !Number.isFinite(expires) || observed > now || expires <= now || expires !== observed + 15 * 60 * 1000
    || !Number.isFinite(referencePrice) || !Number.isFinite(price) || !Number.isFinite(gap)
    || referencePrice <= 0 || price <= 0 || gap <= 0 || Math.abs(referencePrice - price - gap) > 0.000001) return null
  return gap
}

export function getRetailReferenceUrl(provider?: string | null, rawUrl?: string | null): string | null {
  const host = provider === 'Lefeld' ? 'www.lefeld.de' : provider === 'GoTools' ? 'www.gotools.de' : null
  if (!host || !rawUrl) return null
  try {
    const url = new URL(rawUrl)
    return url.protocol === 'https:' && url.hostname === host && !url.port && !url.username && !url.password && !url.search && !url.hash ? url.href : null
  }
  catch {
    return null
  }
}
