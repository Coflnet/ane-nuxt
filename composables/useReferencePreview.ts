import { ref, shallowRef } from 'vue'
import type { ReferenceListingPreviewResponse } from '~/types/ReferenceListing'

export interface ReferencePreviewRequest {
  url: string
  selectedSelector?: string
  additionalSelectors?: string[]
}

/** Loads a reference listing preview; a newer load supersedes an older one. */
export function useReferencePreview() {
  const apiBase = useApiBaseUrl()
  const { t, locale } = useI18n()
  const preview = shallowRef<ReferenceListingPreviewResponse | null>(null)
  const loading = ref(false)
  const error = ref('')
  let request: AbortController | undefined

  function errorMessage(e: unknown): string {
    const fetchError = e as { data?: { error?: string }, message?: string }
    const code = fetchError.data?.error ?? fetchError.message
    return code ? `${t('referenceListingFailed')}: ${code}` : t('referenceListingFailed')
  }

  async function load(input: ReferencePreviewRequest): Promise<ReferenceListingPreviewResponse | null> {
    request?.abort()
    const current = new AbortController()
    request = current
    loading.value = true
    error.value = ''
    try {
      const result = await $fetch<ReferenceListingPreviewResponse>(`${apiBase}/api/reference-listings/preview`, {
        method: 'POST',
        signal: current.signal,
        body: {
          url: input.url,
          locale: locale.value === 'de' ? 'de-DE' : 'en-US',
          selectedSelector: input.selectedSelector || undefined,
          additionalSelectors: input.additionalSelectors ?? [],
        },
      })
      if (request !== current) return null
      preview.value = result
      return result
    }
    catch (e) {
      if (request === current) error.value = errorMessage(e)
      return null
    }
    finally {
      if (request === current) loading.value = false
    }
  }

  function reset() {
    request?.abort()
    request = undefined
    preview.value = null
    loading.value = false
    error.value = ''
  }

  return { preview, loading, error, load, reset }
}
