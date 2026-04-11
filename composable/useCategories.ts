interface UnifiedCategory {
  slug: string
  label: string
  attributeExtractionPrompt?: string | null
  subCategories?: UnifiedCategory[] | null
  attributes?: Record<string, string> | null
}

const API_BASE = 'https://ane.coflnet.com'

/** Convert a label like "Baby & Kleinkind" → "baby-kleinkind" */
function labelToUrlSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function useCategories() {
  const topLevelCategories = useState<UnifiedCategory[]>('topLevelCategories', () => [])
  const subCategories = useState<Record<string, UnifiedCategory[]>>('subCategories', () => ({}))
  const loadingCategories = useState<boolean>('loadingCategories', () => false)

  // Bidirectional mappings: numericSlug <-> urlSlug
  const numericToUrl = useState<Record<string, string>>('catNumericToUrl', () => ({}))
  const urlToNumeric = useState<Record<string, string>>('catUrlToNumeric', () => ({}))
  // Label lookup by numeric slug
  const slugToLabel = useState<Record<string, string>>('catSlugToLabel', () => ({}))

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

  /** Convert a numeric slug (e.g. "537") to a URL-friendly slug. Returns the original if no mapping exists. */
  function toUrlSlug(numericSlug: string): string {
    return numericToUrl.value[numericSlug] || numericSlug
  }

  /** Convert a URL-friendly slug back to the numeric slug the API expects. Returns the original if no mapping exists. */
  function toApiSlug(urlSlug: string): string {
    return urlToNumeric.value[urlSlug] || urlSlug
  }

  async function fetchTopLevelCategories() {
    if (topLevelCategories.value.length > 0) return topLevelCategories.value
    loadingCategories.value = true
    try {
      const data = await $fetch<UnifiedCategory[]>(`${API_BASE}/api/Categories/top-level`)
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
    if (subCategories.value[parentSlug]) return subCategories.value[parentSlug]
    try {
      const data = await $fetch<UnifiedCategory[]>(`${API_BASE}/api/Categories/${parentSlug}/subcategories`)
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
    toUrlSlug,
    toApiSlug,
  }
}
