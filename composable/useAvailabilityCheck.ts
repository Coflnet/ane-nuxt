import type { Platform } from '~/src/api-client'
import { nativeListingId } from '~/utils/listingIdentity'
import { AVAILABILITY_TIMEOUT_MS } from '~/utils/listingOpen'

export const useAvailabilityCheck = () => {
  const apiBase = useApiBaseUrl()
  const platformMap: Record<string, Platform> = {
    kleinanzeigen: 'Kleinanzeigen',
    marktplaats: 'Marktplaats',
    willhaben: 'Willhaben',
    shpock: 'Shpock',
    markt: 'MarktDe',
    vinted: 'Vinted',
    poshmark: 'Poshmark',
    mercari: 'Mercari',
    depop: 'Depop',
    mobile: 'Mobile',
    autoscout24: 'AutoScout24',
    craigslist: 'Craigslist',
    offerup: 'OfferUp',
    olx: 'OLX',
    quoka: 'Quoka',
    gumtree: 'Gumtree',
    wallapop: 'Wallapop',
  }

  function getMarketplaceName(url?: string | null): string {
    if (!url) return 'Unknown'
    try {
      const hostname = new URL(url).hostname
      return hostname.replace('www.', '').split('.')[0] ?? 'Unknown'
    }
    catch {
      return 'Web'
    }
  }

  function getPlatformFromUrl(url?: string | null): Platform {
    if (!url) return 'Unknown'
    const hostname = getMarketplaceName(url).toLowerCase()
    return platformMap[hostname] || 'Unknown'
  }

  async function checkAvailability(listingId: string | number | null | undefined, url?: string | null, listingPlatform?: string | null): Promise<boolean> {
    if (!listingId) return true

    const platform = listingPlatform || getPlatformFromUrl(url)
    if (platform === 'Unknown') return true
    const id = typeof listingId === 'number' ? nativeListingId({ listingId, platform }) : listingId
    if (!id) return true

    try {
      const response = await $fetch<{ isAvailable: boolean }>(`${apiBase.replace(/\/$/, '')}/api/Product/availability`, { query: { platform, id }, timeout: AVAILABILITY_TIMEOUT_MS })
      return response.isAvailable
    }
    catch (error) {
      console.error('Failed to check availability:', error)
      // If check fails, assume available
      return true
    }
  }

  return {
    getMarketplaceName,
    getPlatformFromUrl,
    checkAvailability,
  }
}
