import { onScopeDispose, ref, shallowRef, watch } from 'vue'
import type { ServicesProductServiceFilterBucket as FilterBucket, ServicesProductServiceSearchProductsResult as SearchResult } from '~/src/api-client/types.gen'
import { titleVisibleKeys } from '~/utils/attributeAlternatives'
import { parseListingUrl } from '~/utils/filterPrefill'

export interface FilterInterpretation {
  /** Known product name or the cleaned query. */
  name: string
  /** Top catalogue category; context only, never saved. */
  category: string
  /** Whitelisted, title-visible attribute buckets with products. */
  buckets: Record<string, FilterBucket[]>
  priceMin: number | null
  priceMax: number | null
  currency: string
}

const DEBOUNCE_MS = 300
const MAX_BUCKET_VALUES = 8

function visibleBuckets(all: SearchResult['attributeBuckets']): Record<string, FilterBucket[]> {
  const buckets: Record<string, FilterBucket[]> = {}
  for (const key of titleVisibleKeys(Object.keys(all ?? {}))) {
    const values = (all?.[key] ?? []).filter(bucket => bucket.value && (bucket.count ?? 0) > 0)
    if (values.length) buckets[key] = values.slice(0, MAX_BUCKET_VALUES)
  }
  return buckets
}

function toInterpretation(term: string, result: SearchResult): FilterInterpretation {
  const info = result.interpretation
  return {
    name: info?.knownProduct?.name || info?.query || term,
    category: result.categoryBuckets?.[0]?.value || result.categories?.[0] || '',
    buckets: visibleBuckets(result.attributeBuckets),
    priceMin: result.priceMin ?? null,
    priceMax: result.priceMax ?? null,
    currency: result.priceCurrency || 'EUR',
  }
}

/** "Understood as … in …" plus attribute chips for the typed search term (not for links). */
export function useFilterInterpretation(term: () => string) {
  const apiBase = useApiBaseUrl()
  const interpretation = shallowRef<FilterInterpretation | null>(null)
  const loading = ref(false)
  let request: AbortController | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  function cancel() {
    clearTimeout(timer)
    request?.abort()
    request = undefined
    loading.value = false
  }

  async function load(query: string) {
    const current = new AbortController()
    request = current
    loading.value = true
    try {
      const result = await $fetch<SearchResult>(`${apiBase}/api/Product/search`, {
        query: { query, limit: 1, includePriceBounds: false },
        signal: current.signal,
        retry: 0,
      })
      if (request === current) interpretation.value = toInterpretation(query, result)
    }
    catch {
      if (request === current) interpretation.value = null
    }
    finally {
      if (request === current) loading.value = false
    }
  }

  function schedule() {
    cancel()
    const query = term().trim()
    if (import.meta.server || query.length < 2 || parseListingUrl(query)) {
      interpretation.value = null
      return
    }
    timer = setTimeout(() => void load(query), DEBOUNCE_MS)
  }

  watch(term, schedule)
  onScopeDispose(cancel)

  return { interpretation, loading, refresh: schedule }
}
