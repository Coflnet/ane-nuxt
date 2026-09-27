import { categoryLabelLanguage } from '~/utils/categoryLanguage'

interface UnifiedCategory {
  slug: string
  label: string
  attributeExtractionPrompt?: string | null
  subCategories?: UnifiedCategory[] | null
  attributes?: Record<string, string> | null
}

/** Convert a label like "Baby & Kleinkind" → "baby-kleinkind" */
function labelToUrlSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function useCategories() {
  // Internal Service base during SSR, public base in the browser.
  const API_BASE = useApiBaseUrl()
  // Category labels come from the API in the UI language (German fallback for untranslated nodes).
  const locale = useNuxtApp().$i18n.locale
  const lang = () => categoryLabelLanguage(locale.value)

  const topLevelCategories = useState<UnifiedCategory[]>('topLevelCategories', () => [])
  const subCategories = useState<Record<string, UnifiedCategory[]>>('subCategories', () => ({}))
  const loadingCategories = useState<boolean>('loadingCategories', () => false)

  // Bidirectional mappings: numericSlug <-> urlSlug
  const numericToUrl = useState<Record<string, string>>('catNumericToUrl', () => ({}))
  const urlToNumeric = useState<Record<string, string>>('catUrlToNumeric', () => ({}))
  // Label lookup by numeric slug
  const slugToLabel = useState<Record<string, string>>('catSlugToLabel', () => ({}))
  // Language the cached lists/labels were fetched in; a locale switch refetches them.
  const categoriesLang = useState<string>('catLang', () => '')
  // German label per numeric slug, fetched once regardless of UI language — lets counts
  // (keyed by German label, see utils/categoryCounts.ts) be resolved on any locale.
  const germanLabelBySlug = useState<Record<string, string>>('catGermanLabelBySlug', () => ({}))
  // Exact per-slug product counts from GET /api/Categories/counts-by-slug (the same category query
  // the search endpoint uses per slug), preferred over the label-based lookup in
  // utils/categoryCounts.ts. Stays null when the endpoint is missing (older API deployment) or the
  // request failed, so callers fall back to the label-based logic instead of showing no counts at all.
  const countsBySlug = useState<Record<string, number> | null>('catCountsBySlug', () => null)
  const countsBySlugFetched = useState<boolean>('catCountsBySlugFetched', () => false)

  function ensureLanguage() {
    if (categoriesLang.value === lang()) return
    categoriesLang.value = lang()
    topLevelCategories.value = []
    subCategories.value = {}
    slugToLabel.value = {}
    // url slug mappings are kept, so a category url from the other locale still resolves
  }

  function registerCategory(cat: UnifiedCategory) {
    const urlSlug = labelToUrlSlug(cat.label)
    numericToUrl.value[cat.slug] = urlSlug
    urlToNumeric.value[urlSlug] = cat.slug
    slugToLabel.value[cat.slug] = cat.label
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        registerCategory(sub)
      }
    }
  }

  function registerGermanLabel(cat: UnifiedCategory) {
    germanLabelBySlug.value[cat.slug] = cat.label
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        registerGermanLabel(sub)
      }
    }
  }

  /**
   * Fetch the German label for every category slug once, independent of the current UI
   * language. The product-counts API is keyed by German label, so this lets counts be
   * resolved correctly no matter which language the category tiles are displayed in.
   */
  async function ensureGermanLabels() {
    if (Object.keys(germanLabelBySlug.value).length > 0) return
    try {
      const data = await $fetch<UnifiedCategory[]>(`${API_BASE}/api/Categories/top-level`, { query: { lang: 'de' } })
      for (const cat of data || []) {
        registerGermanLabel(cat)
      }
    }
    catch (e) {
      console.error('Failed to fetch German category labels', e)
    }
  }

  /**
   * Fetch exact per-slug product counts once (GET /api/Categories/counts-by-slug). Leaves
   * `countsBySlug` as `null` on failure — including a 404 from an API deployment that doesn't have
   * the endpoint yet — so callers can tell "unavailable" apart from "loaded but empty" and fall
   * back to the label-based counts.
   */
  async function ensureCountsBySlug() {
    if (countsBySlugFetched.value) return countsBySlug.value
    countsBySlugFetched.value = true
    try {
      const data = await $fetch<Record<string, number>>(`${API_BASE}/api/Categories/counts-by-slug`)
      countsBySlug.value = data || {}
    }
    catch (e) {
      console.error('Failed to fetch counts-by-slug', e)
      countsBySlug.value = null
    }
    return countsBySlug.value
  }

  /** Convert a numeric slug (e.g. "537") to a URL-friendly slug. Returns the original if no mapping exists. */
  function toUrlSlug(numericSlug: string): string {
    return numericToUrl.value[numericSlug] || numericSlug
  }

  /** Convert a URL-friendly slug back to the numeric slug the API expects. Returns the original if no mapping exists. */
  function toApiSlug(urlSlug: string): string {
    return urlToNumeric.value[urlSlug] || urlSlug
  }

  async function fetchTopLevelCategories() {
    ensureLanguage()
    if (topLevelCategories.value.length > 0) return topLevelCategories.value
    loadingCategories.value = true
    try {
      const data = await $fetch<UnifiedCategory[]>(`${API_BASE}/api/Categories/top-level`, { query: { lang: lang() } })
      topLevelCategories.value = data || []
      for (const cat of topLevelCategories.value) {
        registerCategory(cat)
      }
      return topLevelCategories.value
    }
    catch (e) {
      console.error('Failed to fetch top-level categories', e)
      return []
    }
    finally {
      loadingCategories.value = false
    }
  }

  async function fetchSubCategories(parentSlug: string) {
    ensureLanguage()
    if (subCategories.value[parentSlug]) return subCategories.value[parentSlug]
    try {
      const data = await $fetch<UnifiedCategory[]>(`${API_BASE}/api/Categories/${parentSlug}/subcategories`, { query: { lang: lang() } })
      subCategories.value[parentSlug] = data || []
      for (const cat of subCategories.value[parentSlug]) {
        registerCategory(cat)
      }
      return subCategories.value[parentSlug]
    }
    catch (e) {
      console.error(`Failed to fetch subcategories for ${parentSlug}`, e)
      return []
    }
  }

  return {
    topLevelCategories,
    subCategories,
    loadingCategories,
    fetchTopLevelCategories,
    fetchSubCategories,
    numericToUrl,
    urlToNumeric,
    slugToLabel,
    germanLabelBySlug,
    ensureGermanLabels,
    countsBySlug,
    ensureCountsBySlug,
    toUrlSlug,
    toApiSlug,
  }
}
