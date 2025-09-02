import { getMatches, type FilterMatch, type Platform } from '~/src/api-client'

export const useListingStore = defineStore('listing', () => {
  const userStore = useUserStore()
  const recentMatches = ref<FilterMatch[]>([])

  async function loadMatches() {
    if (!userStore.token) {
      console.error('No token found, can not load matches')
      return
    }

    recentMatches.value = []

    const apiToken = `Bearer ${userStore.token}`

    const response = await getMatches({
      query: { limit: 6 },
      composable: '$fetch',
      headers: { Authorization: apiToken },
    })

    recentMatches.value.push(...response)

    // Handle there being no image
    // so no need to handle it when accessing the iamge in ui
    recentMatches.value.map((item) => {
      if (item.listingData?.imageUrls?.length != 0)
        return item
      item.listingData.imageUrls[0] == ''
      return item
    })

    recentMatches.value = recentMatches.value.sort((a, b) => {
      return new Date(b.matchedAt ?? '').getTime() - new Date(a.matchedAt ?? '').getTime()
    })
  }

  async function loadMoreMatches(loadedItems: FilterMatch[]): Promise<[boolean, FilterMatch[]]> {
    const apiToken = `Bearer ${userStore.token}`

    const response = await getMatches({
      query: { limit: 21, before: loadedItems.at(-1)?.matchedAt },
      composable: '$fetch',
      headers: { Authorization: apiToken },
    })

    recentMatches.value.push(...response)

    if (response.length == 0) {
      return [false, loadedItems]
    }

    return [true, loadedItems]
  }

  function constructListingUrl(listing: Listing, lang: string): string | null {
    if (!listing.platform)
      return null
    if (!listing.id)
      return null
    return getUrl(listing.platform, listing.id, lang)
  }

  function getUrl(listing: Platform, id: string, lang: string) {
    if (listing === 'Ebay') {
      if (lang == 'de') {
        return `https://www.ebay.de/itm/` + id
      }
      return `https://www.ebay.com/itm/` + id
    }
    if (listing === 'Kleinanzeigen') {
      return `https://www.kleinanzeigen.de/s-anzeige/copy/${id}-1-1`
    }
    if (listing === 'AutoScout24')
      return `https://www.autoscout24.de/angebote/${id}`
    return ''
  }

  return {
    recentMatches,
    constructListingUrl,

    loadMatches,
    loadMoreMatches,
    getUrl,
  }
})
