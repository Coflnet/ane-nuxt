interface UnifiedCategory {
  slug: string
  label: string
  attributeExtractionPrompt?: string | null
  subCategories?: UnifiedCategory[] | null
  attributes?: Record<string, string> | null
}

const API_BASE = 'https://ane.coflnet.com'

export function useCategories() {
  const topLevelCategories = useState<UnifiedCategory[]>('topLevelCategories', () => [])
  const subCategories = useState<Record<string, UnifiedCategory[]>>('subCategories', () => ({}))
  const loadingCategories = useState<boolean>('loadingCategories', () => false)

  async function fetchTopLevelCategories() {
    if (topLevelCategories.value.length > 0) return topLevelCategories.value
    loadingCategories.value = true
    try {
      const data = await $fetch<UnifiedCategory[]>(`${API_BASE}/api/Categories/top-level`)
      topLevelCategories.value = data || []
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
  }
}
