import type { Platform } from '../src/api-client/types.gen'

const canonicalMarketplaceHosts: Record<string, string[]> = {
  OLX: ['olx.pl', 'www.olx.pl'],
  Gumtree: ['www.gumtree.com'],
  Wallapop: ['es.wallapop.com'],
  Blocket: ['www.blocket.se'],
  ParuVendu: ['www.paruvendu.fr'],
}

function getCanonicalMarketplaceUrl(platform: Platform | undefined, rawUrl: string | undefined): string | null {
  const allowedHosts = platform ? canonicalMarketplaceHosts[platform] : undefined
  if (!allowedHosts || !rawUrl) return null

  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'https:' || url.port || url.username || url.password || !allowedHosts.includes(url.hostname.toLowerCase())) return null
    return url.href
  }
  catch {
    return null
  }
}

export function getPlatformUrl(platform: Platform | undefined, id: string | undefined, canonicalUrl?: string): string | null {
  if (!id) return null
  const validatedCanonicalUrl = getCanonicalMarketplaceUrl(platform, canonicalUrl)
  if (validatedCanonicalUrl) return validatedCanonicalUrl

  switch (platform) {
    case 'Kleinanzeigen':
      return `https://www.kleinanzeigen.de/s-anzeige/copy/${id}-1-1`
    case 'Ebay':
      return `https://ebay.de/itm/${id}`
    case 'Facebook':
      return `https://www.facebook.com/marketplace/item/${id}`
    case 'Willhaben':
      return `https://www.willhaben.at/iad/${id.replace(/^\//, '')}`
    case 'Shpock':
      return `https://www.shpock.com/de-de/i/${id}`
    case 'Marktplaats':
      return id.includes('/')
        ? `https://www.marktplaats.nl${id}`
        : `https://www.marktplaats.nl/v/redirect/redirect/${id}-test`
    case 'Vinted':
      return `https://www.vinted.de/items/${id}`
    case 'Gumtree':
      return /^\d+$/.test(id) ? `https://www.gumtree.com/p/redirect/redirect/${id}` : null
    case 'Blocket':
      return /^\d+$/.test(id) ? `https://www.blocket.se/recommerce/forsale/item/${id}` : null
    default:
      return null
  }
}
