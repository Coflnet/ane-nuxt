import { onScopeDispose, ref, shallowRef, watch } from 'vue'
import type { ClientModelListingListener as ListingListener, ClientModelStoredListing as StoredListing } from '~/src/api-client'

export interface MatchingOffersOptions {
  /** Builds the preview request; null skips the run (e.g. invalid zip). */
  buildRequest: () => Promise<ListingListener | null>
  /** Calls POST /api/filters/test; null means the preview is unavailable. */
  test: (listener: ListingListener, signal: AbortSignal) => Promise<StoredListing[] | null>
  /** Match-relevant inputs only, so notification edits never refetch. */
  signature: () => string
  /** False while there is nothing to match yet (no SearchTerm and no style photo, image not ready). */
  enabled: () => boolean
  /** Debounce in ms (longer while a photo is attached). */
  delay: () => number
}

/** Live "Matching offers" preview: debounced, aborts superseded calls, keeps the last result on errors. */
export function useMatchingOffers(options: MatchingOffersOptions) {
  const offers = shallowRef<StoredListing[]>([])
  const loading = ref(false)
  const error = ref(false)
  const done = ref(false)
  let request: AbortController | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  function cancel() {
    clearTimeout(timer)
    timer = undefined
    request?.abort()
    request = undefined
    loading.value = false
  }

  async function run() {
    request?.abort()
    if (!options.enabled()) return
    const current = new AbortController()
    request = current
    loading.value = true
    error.value = false
    try {
      const listener = await options.buildRequest()
      if (!listener || current.signal.aborted) return
      const result = await options.test(listener, current.signal)
      if (request !== current || current.signal.aborted) return
      if (result === null) throw new Error('Preview unavailable')
      offers.value = result
      done.value = true
    }
    catch {
      if (request === current && !current.signal.aborted) error.value = true
    }
    finally {
      if (request === current) loading.value = false
    }
  }

  function schedule() {
    cancel()
    if (!options.enabled()) return
    timer = setTimeout(() => void run(), options.delay())
  }

  // Separate sources: each is compared by value, so reads that do not change them never refetch.
  watch([() => options.signature(), () => options.enabled()], schedule)
  onScopeDispose(cancel)

  return { offers, loading, error, done, run, schedule, cancel }
}
