import { onScopeDispose, ref, shallowRef, watch } from 'vue'
import { offersAboveMax, withoutMaxPrice } from '../utils/overCapOffers.ts'
import type { ClientModelListingListener as ListingListener, ClientModelStoredListing as StoredListing } from '~/src/api-client'

export interface MatchingOffersOptions {
  /** Builds the preview request; null skips the run (e.g. invalid zip). */
  buildRequest: () => Promise<ListingListener | null>
  /** Calls POST /api/filters/test; null means the preview is unavailable. */
  test: (listener: ListingListener, signal: AbortSignal) => Promise<StoredListing[] | null>
  /** Also look for offers above the max price (a second `test` call with the max lifted); failures are ignored. */
  includeAboveMax?: boolean
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
  const aboveMax = shallowRef<StoredListing[]>([])
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
    // A pending input change may remove the max; a stale "raise max" must not stay clickable meanwhile.
    aboveMax.value = []
  }

  /** Offers above the max price (null when not applicable or failed: the group is simply omitted). */
  async function loadAboveMax(listener: ListingListener, signal: AbortSignal): Promise<StoredListing[] | null> {
    const uncapped = options.includeAboveMax ? withoutMaxPrice(listener) : null
    if (!uncapped) return null
    try {
      return await options.test(uncapped, signal)
    }
    catch {
      return null
    }
  }

  async function run() {
    request?.abort()
    if (!options.enabled()) return
    const current = new AbortController()
    request = current
    loading.value = true
    error.value = false
    const extra = new AbortController()
    current.signal.addEventListener('abort', () => extra.abort())
    try {
      const listener = await options.buildRequest()
      if (!listener || current.signal.aborted) {
        aboveMax.value = []
        return
      }
      const pending = loadAboveMax(listener, extra.signal)
      const result = await options.test(listener, current.signal)
      if (request !== current || current.signal.aborted) return
      if (result === null) throw new Error('Preview unavailable')
      offers.value = result
      aboveMax.value = []
      done.value = true
      loading.value = false
      void pending.then((uncapped) => {
        if (request === current && !current.signal.aborted && uncapped) aboveMax.value = offersAboveMax(result, uncapped)
      })
    }
    catch {
      extra.abort()
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

  return { offers, aboveMax, loading, error, done, run, schedule, cancel }
}
