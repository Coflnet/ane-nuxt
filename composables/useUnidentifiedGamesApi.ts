import { useApiBaseUrl } from '~/utils/apiBaseUrl'
import { useUserStore } from '~/stores/user'

export interface UnidentifiedSeries {
  platform: string
  series: string
  count: number
}

export interface UnidentifiedListing {
  platform: string
  series: string
  listingPlatform: string
  listingId: string
  listingUrl: string
  title: string
  price: number
  currency: string
  imageUrl?: string | null
  foundAt: string
  identifyStage: string
  evidence?: string | null
}

export interface UnidentifiedPage {
  items: UnidentifiedListing[]
  nextPagingState?: string | null
}

/** Review endpoints of the not identified game listings (signed in, labeler allow list); not in the generated client. */
export function useUnidentifiedGamesApi() {
  const userStore = useUserStore()
  const request = <T>(path: string, query?: Record<string, string | number>) =>
    $fetch<T>(`${useApiBaseUrl()}/api/Product/unidentified-games${path}`, {
      query,
      headers: { Authorization: `Bearer ${userStore.token}` },
    })
  return {
    series: (platform?: string) => request<UnidentifiedSeries[]>('/series', platform ? { platform } : undefined),
    listings: (platform: string, series: string, pagingState?: string | null) =>
      request<UnidentifiedPage>('', { platform, series, limit: 50, ...(pagingState ? { pagingState } : {}) }),
  }
}
