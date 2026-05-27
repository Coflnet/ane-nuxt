<template>
  <div class="w-full max-w-2xl mx-auto">
    <div
      ref="containerRef"
      class="relative group"
    >
      <div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
      <div class="relative flex items-center bg-slate-800 rounded-lg shadow-xl ring-1 ring-slate-700/50">
        <div class="pl-4 text-slate-400">
          <Icon
            name="tabler:search"
            class="w-6 h-6"
          />
        </div>
        <input
          v-model="query"
          type="text"
          :placeholder="$t('searchProductsPlaceholder', 'Search for products (e.g. iPhone 15, MacBook)...')"
          class="w-full p-4 bg-transparent border-none text-slate-100 placeholder-slate-500 focus:ring-0 text-lg"
          data-testid="search-input"
          autocomplete="off"
          @keyup.enter="handleSearch"
          @input="onInput"
          @focus="onFocus"
          @keydown.down.prevent="moveHighlight(1)"
          @keydown.up.prevent="moveHighlight(-1)"
          @keydown.escape="showDropdown = false"
        >
        <div
          v-if="isLoading"
          class="pr-2"
        >
          <Icon
            name="tabler:loader-2"
            class="w-5 h-5 text-slate-400 animate-spin"
          />
        </div>
        <div class="pr-2">
          <button
            class="p-2 text-slate-400 hover:text-white transition-colors"
            @click="handleSearch"
          >
            <Icon
              name="tabler:arrow-right"
              class="w-6 h-6"
            />
          </button>
        </div>
      </div>

      <!-- Suggestions dropdown -->
      <div
        v-if="showDropdown && (suggestions.length > 0 || categorySuggestions.length > 0)"
        class="absolute z-50 mt-2 w-full bg-slate-800 rounded-lg shadow-2xl ring-1 ring-slate-700/50 overflow-hidden"
      >
        <!-- Category suggestions -->
        <div v-if="categorySuggestions.length > 0">
          <div class="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {{ $t('categories', 'Categories') }}
          </div>
          <button
            v-for="(cat, i) in categorySuggestions"
            :key="'cat-' + i"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
            :class="highlightIndex === i ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'"
            @mouseenter="highlightIndex = i"
            @click="selectCategory(cat)"
          >
            <Icon
              name="tabler:category"
              class="w-4 h-4 text-blue-400 shrink-0"
            />
            <span class="truncate">{{ cat.label }}</span>
            <span class="hidden sm:block ml-auto text-xs text-slate-500 truncate max-w-[45%]">{{ cat.path }}</span>
          </button>
        </div>

        <!-- Product suggestions -->
        <div v-if="suggestions.length > 0">
          <div
            class="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider"
            :class="{ 'border-t border-slate-700': categorySuggestions.length > 0 }"
          >
            {{ $t('products', 'Products') }}
          </div>
          <button
            v-for="(s, i) in suggestions"
            :key="'prod-' + i"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
            :class="highlightIndex === (i + categorySuggestions.length) ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'"
            @mouseenter="highlightIndex = i + categorySuggestions.length"
            @click="selectSuggestion(s)"
          >
            <img
              v-if="s.imageUrl"
              :src="s.imageUrl"
              class="w-8 h-8 rounded object-cover shrink-0"
              loading="lazy"
              onerror="this.style.display='none'"
            >
            <Icon
              v-else
              name="tabler:package"
              class="w-5 h-5 text-slate-500 shrink-0"
            />
            <div class="min-w-0 flex-1">
              <div class="truncate font-medium">
                {{ s.text }}
              </div>
              <div
                v-if="s.category"
                class="text-xs text-slate-500 truncate"
              >
                {{ s.category }}
              </div>
            </div>
            <span
              v-if="s.minPrice"
              class="text-sm text-emerald-400 shrink-0"
            >
              ab {{ formatPrice(s.minPrice) }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCategories } from '~/composable/useCategories'

const props = defineProps<{
  initialQuery?: string
}>()

interface UnifiedCategory {
  slug: string
  label: string
  subCategories?: UnifiedCategory[] | null
}

interface CategorySuggestion {
  label: string
  slug: string
  path: string
}

interface ProductSuggestion {
  text: string
  imageUrl?: string
  category?: string
  minPrice?: number
  seoId?: string
}

const emit = defineEmits<{
  (e: 'search' | 'selectCategory', value: string): void
}>()

const query = ref(props.initialQuery || '')
const suggestions = ref<ProductSuggestion[]>([])
const categorySuggestions = ref<CategorySuggestion[]>([])
const showDropdown = ref(false)
const highlightIndex = ref(-1)
const isLoading = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const { topLevelCategories, fetchTopLevelCategories } = useCategories()

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const API_BASE = 'https://ane.coflnet.com'

watch(() => props.initialQuery, (newQuery) => {
  query.value = newQuery || ''
})

function onInput() {
  const q = query.value.trim()
  if (debounceTimer) clearTimeout(debounceTimer)

  if (q.length < 2) {
    suggestions.value = []
    categorySuggestions.value = []
    showDropdown.value = false
    return
  }

  debounceTimer = setTimeout(() => fetchSuggestions(q), 250)
}

function onFocus() {
  if (suggestions.value.length > 0 || categorySuggestions.value.length > 0) {
    showDropdown.value = true
  }
}

async function fetchSuggestions(q: string) {
  isLoading.value = true
  highlightIndex.value = -1

  try {
    const [productResults, categoryResults] = await Promise.all([
      $fetch<ProductSuggestion[]>(`${API_BASE}/api/Product/suggest`, {
        params: { q, limit: 6 },
      }).catch(() => []),
      topLevelCategories.value.length > 0
        ? Promise.resolve(topLevelCategories.value)
        : fetchTopLevelCategories(),
    ])

    if (query.value.trim() !== q) return

    suggestions.value = productResults || []
    categorySuggestions.value = collectCategorySuggestions(categoryResults || [], q).slice(0, 4)

    showDropdown.value = suggestions.value.length > 0 || categorySuggestions.value.length > 0
  }
  catch {
    suggestions.value = []
    categorySuggestions.value = []
  }
  finally {
    isLoading.value = false
  }
}

function moveHighlight(dir: number) {
  const total = categorySuggestions.value.length + suggestions.value.length
  if (total === 0) return
  highlightIndex.value = (highlightIndex.value + dir + total) % total
}

function handleSearch() {
  showDropdown.value = false
  if (highlightIndex.value >= 0) {
    const catLen = categorySuggestions.value.length
    if (highlightIndex.value < catLen) {
      const selectedCategory = categorySuggestions.value[highlightIndex.value]
      if (selectedCategory) selectCategory(selectedCategory)
    }
    else {
      const selectedSuggestion = suggestions.value[highlightIndex.value - catLen]
      if (selectedSuggestion) selectSuggestion(selectedSuggestion)
    }
    return
  }
  if (query.value.trim()) {
    emit('search', query.value)
  }
}

function selectSuggestion(s: ProductSuggestion) {
  showDropdown.value = false
  query.value = s.text
  if (s.seoId) {
    navigateTo(`/product/${s.seoId}`)
  }
  else {
    emit('search', s.text)
  }
}

function selectCategory(cat: { label: string, slug: string, path: string }) {
  showDropdown.value = false
  query.value = ''
  emit('selectCategory', cat.slug)
}

function collectCategorySuggestions(categories: UnifiedCategory[], searchTerm: string): CategorySuggestion[] {
  const normalizedSearch = normalizeSearchText(searchTerm)
  if (!normalizedSearch) return []

  const matches: CategorySuggestion[] = []

  function visit(category: UnifiedCategory, parentLabels: string[]) {
    const label = category.label || ''
    const haystack = normalizeSearchText([...parentLabels, label].join(' '))

    if (haystack.includes(normalizedSearch)) {
      matches.push({
        label,
        slug: category.slug,
        path: parentLabels.join(' / '),
      })
    }

    for (const child of category.subCategories || []) {
      visit(child, [...parentLabels, label])
    }
  }

  for (const category of categories) {
    visit(category, [])
  }

  return matches
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price)
}

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}
</script>
