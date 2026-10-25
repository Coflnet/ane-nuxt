import { useApiBaseUrl } from '~/utils/apiBaseUrl'
import type { LabelAnswer, LabelingPair, ReviewMode } from '~/utils/labelingQueue'
import { useUserStore } from '~/stores/user'

export interface LabelingMe {
  canLabel: boolean
  userId: string
}

export interface LabelingRight {
  host: string
  platform?: string | null
  status: string
  checkedAt?: string | null
  evidence?: string[] | null
}

export interface LabelingStats {
  candidates: number
  labeled: number
  byLabel: Partial<Record<LabelAnswer, number>>
  excludedByRights: number
  rights: LabelingRight[]
}

/** The labeling endpoints are not in the generated client yet, so they are called directly. */
export function useLabelingApi() {
  const userStore = useUserStore()

  function request<T>(path: string, options: { method?: 'GET' | 'POST', query?: Record<string, string | number>, body?: unknown } = {}): Promise<T> {
    return $fetch(`${useApiBaseUrl()}/api/labeling${path}`, {
      method: options.method ?? 'GET',
      query: options.query,
      body: options.body as Record<string, unknown> | undefined,
      headers: { Authorization: `Bearer ${userStore.token}` },
    }) as Promise<T>
  }

  /** Fetches an archived photo (needs the bearer, so it cannot be used as an <img src> directly). */
  function photo(url: string): Promise<Blob> {
    const absolute = /^https?:\/\//.test(url) ? url : `${useApiBaseUrl()}${url}`
    return $fetch<Blob>(absolute, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${userStore.token}` },
    })
  }

  return {
    photo,
    me: () => request<LabelingMe>('/me'),
    next: (count: number, groupKey: string) => request<LabelingPair[]>('/next', { query: { count, groupKey } }),
    label: async (pairId: string, label: LabelAnswer, reviewMode?: ReviewMode): Promise<void> => {
      await request<unknown>(`/${encodeURIComponent(pairId)}/label`, { method: 'POST', body: { label, ...(reviewMode ? { reviewMode } : {}) } })
    },
    stats: () => request<LabelingStats>('/stats'),
  }
}

export function labelingErrorStatus(error: unknown): number {
  const e = error as { statusCode?: number, status?: number, response?: { status?: number } }
  return e?.statusCode ?? e?.status ?? e?.response?.status ?? 0
}
