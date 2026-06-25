import type { AsyncDataOptions } from '#app'

/**
 * SSR-with-timeout fetching for dynamic pages.
 *
 * On the server the fetcher is raced against a timeout (configurable via
 * `runtimeConfig.public.ssrFetchTimeoutMs`). If the backend responds in time,
 * the data is rendered into the SSR HTML (good for SEO + fast first paint).
 * If it is too slow, the server resolves to `null` (a skeleton renders) and
 * marks the result as timed-out so the client re-fetches the real data after
 * hydration.
 *
 * On the client (initial fetch or `refresh`) there is no timeout — we always
 * wait for the full response.
 */
interface RaceResult<T> {
  data: T | null
  timedOut: boolean
}

export interface RaceableOptions<T> extends AsyncDataOptions<RaceResult<T>> {
  /** Override the server-side timeout in milliseconds. */
  timeoutMs?: number
}

async function raceWithTimeout<T>(promise: Promise<T>, ms: number): Promise<RaceResult<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<RaceResult<T>>((resolve) => {
    timer = setTimeout(() => resolve({ data: null, timedOut: true }), ms)
  })
  try {
    return await Promise.race([
      promise.then(data => ({ data, timedOut: false })),
      timeout,
    ])
  }
  finally {
    if (timer) clearTimeout(timer)
  }
}

export function useRaceableAsyncData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: RaceableOptions<T> = {},
) {
  const { timeoutMs, ...asyncOptions } = options
  const config = useRuntimeConfig()
  const ms = timeoutMs ?? (Number(config.public.ssrFetchTimeoutMs) || 2500)

  const asyncData = useAsyncData<RaceResult<T>>(
    key,
    () => {
      // Client fetches (initial or refresh) always wait for the full response.
      if (import.meta.server) {
        return raceWithTimeout(fetcher(), ms)
      }
      return fetcher().then(data => ({ data, timedOut: false }))
    },
    asyncOptions,
  )

  const data = computed(() => asyncData.data.value?.data ?? null)
  const timedOut = computed(() => asyncData.data.value?.timedOut ?? false)
  // Show the skeleton while loading, or while a timed-out SSR result waits for
  // the client re-fetch to populate it.
  const loading = computed(() => asyncData.pending.value || (timedOut.value && data.value === null))

  // After hydration, fill in any server-side timeout with a full client fetch.
  if (import.meta.client) {
    onMounted(() => {
      if (asyncData.data.value?.timedOut) {
        asyncData.refresh()
      }
    })
  }

  return {
    data,
    timedOut,
    loading,
    pending: asyncData.pending,
    error: asyncData.error,
    refresh: asyncData.refresh,
    status: asyncData.status,
  }
}
