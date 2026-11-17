import { computed, ref, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import type { ClientModelStoredListing as StoredListing } from '~/src/api-client'

interface StyleExample {
  emb: number[]
  provenance: Record<string, unknown>
  sourceListingId: string
  sourcePlatform: string
  sourceImageUrl: string
  positive: boolean
}

type ExampleResponse = Omit<StyleExample, 'positive'>
type Fetcher = <T>(url: string, options: Record<string, unknown>) => Promise<T>

export interface StyleFeedbackOptions {
  /** Serialized VisualSimilarityFilter payload of the style lane. */
  visual: Ref<string>
  saving: Ref<boolean>
  /** False while the reference photo is still being prepared. */
  ready: Ref<boolean>
  apiBase: string
  token: () => string | null | undefined
  fetcher: Fetcher
}

const MAX_EXAMPLES = 4

function parseExamples(raw: string): StyleExample[] {
  try {
    return JSON.parse(raw || '{}').examples ?? []
  }
  catch { return [] }
}

function isTrustedExample(example: ExampleResponse, listing: StoredListing): boolean {
  const sourceImage = new URL(example.sourceImageUrl)
  return !!example.emb?.length && !!example.provenance
    && example.sourceListingId === listing.id && example.sourcePlatform === listing.platform
    && example.sourceImageUrl.length <= 2048 && sourceImage.protocol === 'https:'
    && !sourceImage.username && !sourceImage.password
}

function withExample(reference: string, preference: StyleExample): string {
  const payload = JSON.parse(reference)
  const examples: StyleExample[] = payload.examples ?? []
  const existing = examples.findIndex(item => item.sourceListingId === preference.sourceListingId && item.sourcePlatform === preference.sourcePlatform)
  if (existing >= 0) examples[existing] = preference
  else if (examples.length < MAX_EXAMPLES) examples.push(preference)
  payload.examples = examples
  return JSON.stringify(payload)
}

/** Thumbs up/down on matching offers refine the style reference with up to four examples. */
export function useStyleFeedback(options: StyleFeedbackOptions) {
  const { visual, saving, ready } = options
  const pending = ref(false)
  const failure = shallowRef<{ listing: StoredListing, positive: boolean } | null>(null)
  let request: AbortController | undefined

  const examples = computed(() => parseExamples(visual.value))
  const exampleCount = computed(() => examples.value.length)

  function feedbackChoice(listing: StoredListing | undefined) {
    return examples.value.find(example => example.sourceListingId === listing?.id && example.sourcePlatform === listing?.platform)?.positive
  }

  function canGiveFeedback(listing: StoredListing) {
    if (saving.value || !ready.value || pending.value) return false
    if (exampleCount.value >= MAX_EXAMPLES && feedbackChoice(listing) === undefined) return false
    return !!listing.id && !!listing.platform
  }

  function clearFeedback() {
    if (saving.value) return
    const payload = JSON.parse(visual.value)
    delete payload.examples
    visual.value = JSON.stringify(payload)
  }

  async function addFeedback(listing: StoredListing, positive: boolean) {
    if (!canGiveFeedback(listing)) return
    const reference = visual.value
    const current = new AbortController()
    request = current
    pending.value = true
    failure.value = null
    try {
      const token = options.token()
      const example = await options.fetcher<ExampleResponse>(`${options.apiBase}/api/filters/visual-similarity/example`, {
        method: 'POST',
        signal: current.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: { listingId: listing.id, platform: listing.platform, photoIndex: 0 },
      })
      if (request !== current || current.signal.aborted || reference !== visual.value) return
      if (!isTrustedExample(example, listing)) throw new Error('Invalid example')
      const { emb, provenance, sourceListingId, sourcePlatform, sourceImageUrl } = example
      visual.value = withExample(reference, { emb, provenance, sourceListingId, sourcePlatform, sourceImageUrl, positive })
    }
    catch {
      if (request === current && !current.signal.aborted) failure.value = { listing, positive }
    }
    finally {
      if (request === current) pending.value = false
    }
  }

  function retry() {
    if (failure.value) void addFeedback(failure.value.listing, failure.value.positive)
  }

  // A new or removed reference invalidates any feedback still in flight.
  watch(visual, () => {
    request?.abort()
    request = undefined
    pending.value = false
    failure.value = null
  })

  return { pending, failure, exampleCount, feedbackChoice, canGiveFeedback, addFeedback, clearFeedback, retry, maxExamples: MAX_EXAMPLES }
}
