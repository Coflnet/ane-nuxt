import type { Platform } from '~/src/api-client'

export const useAvailabilityCheck = () => {
  const platformMap: Record<string, Platform> = {
    kleinanzeigen: 'Kleinanzeigen',
    ebay: 'Ebay',
    marktplaats: 'Marktplaats',
    willhaben: 'Willhaben',
    shpock: 'Shpock',
    markt: 'MarktDe',
    vinted: 'Vinted',
    facebook: 'Facebook',
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

  async function checkAvailability(listingId: string | number | null | undefined, url?: string | null): Promise<boolean> {
    if (!listingId) return true

    const platform = getPlatformFromUrl(url)
    if (platform === 'Unknown') return true

    try {
      const response = await $fetch<{ isAvailable: boolean }>(`https://ane.coflnet.com/api/Product/${platform}/${listingId}/available`)
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
