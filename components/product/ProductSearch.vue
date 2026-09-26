<template>
  <div class="w-full max-w-2xl mx-auto">
    <form
      ref="containerRef"
      class="relative group"
      role="search"
      @submit.prevent="handleSearch"
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
          ref="inputRef"
          v-model="query"
          type="text"
          enterkeyhint="search"
          :placeholder="$t('searchProductsPlaceholder', 'Search for products (e.g. iPhone 15, MacBook)...')"
          :aria-label="$t('searchProductsPlaceholder', 'Search for products (e.g. iPhone 15, MacBook)...')"
          class="w-full min-w-0 p-4 bg-transparent border-none text-slate-100 placeholder-slate-500 focus:ring-0 text-lg"
          data-testid="search-input"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          role="combobox"
          aria-autocomplete="list"
          :aria-expanded="isDropdownVisible"
          :aria-controls="listboxId"
          :aria-activedescendant="isDropdownVisible && highlightIndex >= 0 ? optionId(highlightIndex) : undefined"
          @input="onInput"
          @focus="onFocus"
          @keydown.down.prevent="moveHighlight(1)"
          @keydown.up.prevent="moveHighlight(-1)"
          @keydown.escape.prevent="onEscape"
        >
        <button
          v-if="query"
          type="button"
          class="p-2 text-slate-500 hover:text-white transition-colors"
          :aria-label="$t('clearSearch', 'Clear search')"
          @click="clearQuery"
        >
          <Icon
            name="tabler:x"
            class="w-5 h-5"
          />
        </button>
        <!-- Fixed-width slot so the spinner does not shift the submit button -->
        <div class="w-7 flex justify-center shrink-0">
          <Icon
            v-if="isLoading"
            name="tabler:loader-2"
            class="w-5 h-5 text-slate-400 animate-spin"
          />
        </div>
        <div class="pr-2">
          <button
            type="submit"
            class="p-2 text-slate-400 hover:text-white transition-colors"
            :aria-label="$t('search', 'Search')"
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
        v-if="isDropdownVisible"
        :id="listboxId"
        role="listbox"
        class="absolute z-50 mt-2 w-full bg-slate-800 rounded-lg shadow-2xl ring-1 ring-slate-700/50 overflow-hidden text-left"
      >
        <!-- Category suggestions -->
        <div
          v-if="categorySuggestions.length > 0"
          role="group"
        >
          <div class="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {{ $t('categories', 'Categories') }}
          </div>
          <button
            v-for="(cat, i) in categorySuggestions"
            :id="optionId(i)"
            :key="'cat-' + cat.slug"
            type="button"
            role="option"
            :aria-selected="highlightIndex === i"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
            :class="highlightIndex === i ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'"
            @mouseenter="hoverOption(i)"
            @mousedown.prevent
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
        <div
          v-if="suggestions.length > 0"
          role="group"
        >
          <div
            class="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider"
            :class="{ 'border-t border-slate-700': categorySuggestions.length > 0 }"
          >
            {{ $t('products', 'Products') }}
          </div>
          <button
            v-for="(s, i) in suggestions"
            :id="optionId(i + categorySuggestions.length)"
            :key="'prod-' + (s.seoId ?? s.text)"
            type="button"
            role="option"
            :aria-selected="highlightIndex === i + categorySuggestions.length"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
            :class="highlightIndex === (i + categorySuggestions.length) ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'"
            @mouseenter="hoverOption(i + categorySuggestions.length)"
            @mousedown.prevent
            @click="selectSuggestion(s)"
          >
            <img
              v-if="s.imageUrl"
              :src="s.imageUrl"
              alt=""
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
                v-if="s.category && categoryLabel(s.category)"
                class="text-xs text-slate-500 truncate"
              >
                {{ categoryLabel(s.category) }}
              </div>
            </div>
            <span
              v-if="s.minPrice"
              class="text-sm text-emerald-400 shrink-0"
            >
              {{ $t('startingFrom', 'from') }} {{ formatPrice(s.minPrice) }}
            </span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
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
  type?: string
  imageUrl?: string
  category?: string
  minPrice?: number
  seoId?: string
}

const emit = defineEmits<{
  (e: 'search' | 'selectCategory', value: string): void
}>()

const SUGGEST_DEBOUNCE_MS = 250

const { locale } = useI18n()
const localePath = useLocalePath()
const apiBase = useApiBaseUrl()
const query = ref(props.initialQuery || '')
const suggestions = ref<ProductSuggestion[]>([])
const categorySuggestions = ref<CategorySuggestion[]>([])
const showDropdown = ref(false)
const highlightIndex = ref(-1)
const isLoading = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const { topLevelCategories, fetchTopLevelCategories, slugToLabel } = useCategories()
const listboxId = useId()

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let suggestAbort: AbortController | null = null
// Enter only picks a suggestion the user moved to with the arrow keys. A row that
// is merely hovered (e.g. the list opened under a resting mouse pointer) must not
// hijack Enter and navigate away from what was typed.
let highlightFromKeyboard = false

const totalOptions = computed(() => categorySuggestions.value.length + suggestions.value.length)
const isDropdownVisible = computed(() => showDropdown.value && totalOptions.value > 0)

function optionId(index: number) {
  return `${listboxId}-option-${index}`
}

// Keep the input in sync with the URL (back/forward, shared links) without
// clobbering what the user is typing when the value is effectively the same.
watch(() => props.initialQuery, (newQuery) => {
  if ((newQuery || '') !== query.value.trim()) {
    query.value = newQuery || ''
    // Suggestions belonged to the previous text
    cancelPendingSuggestions()
    suggestions.value = []
    categorySuggestions.value = []
    showDropdown.value = false
  }
})

function cancelPendingSuggestions() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  suggestAbort?.abort()
  suggestAbort = null
  isLoading.value = false
}

function onInput() {
  const q = query.value.trim()
  cancelPendingSuggestions()
  highlightIndex.value = -1
  highlightFromKeyboard = false

  if (q.length < 2) {
    suggestions.value = []
    categorySuggestions.value = []
    showDropdown.value = false
    return
  }

  debounceTimer = setTimeout(() => fetchSuggestions(q), SUGGEST_DEBOUNCE_MS)
}

function onFocus() {
  if (totalOptions.value > 0 && query.value.trim().length >= 2) {
    showDropdown.value = true
  }
}

function onEscape() {
  if (isDropdownVisible.value) {
    showDropdown.value = false
    highlightIndex.value = -1
    highlightFromKeyboard = false
  }
  else if (query.value) {
    clearQuery()
  }
}

function clearQuery() {
  cancelPendingSuggestions()
  query.value = ''
  suggestions.value = []
  categorySuggestions.value = []
  showDropdown.value = false
  highlightIndex.value = -1
  highlightFromKeyboard = false
  inputRef.value?.focus()
}

async function fetchSuggestions(q: string) {
  const controller = new AbortController()
  suggestAbort = controller
  isLoading.value = true

  try {
    const [productResults, categoryResults] = await Promise.all([
      $fetch<ProductSuggestion[]>(`${apiBase}/api/Product/suggest`, {
        params: { q, limit: 6 },
        signal: controller.signal,
      }).catch(() => [] as ProductSuggestion[]),
      topLevelCategories.value.length > 0
        ? Promise.resolve(topLevelCategories.value)
        : fetchTopLevelCategories(),
    ])

    // A newer keystroke or a submitted search superseded this request
    if (controller.signal.aborted || query.value.trim() !== q) return

    suggestions.value = productResults || []
    categorySuggestions.value = collectCategorySuggestions(categoryResults || [], q).slice(0, 4)
    highlightIndex.value = -1
    highlightFromKeyboard = false
    showDropdown.value = totalOptions.value > 0 && document.activeElement === inputRef.value
  }
  catch {
    if (!controller.signal.aborted) {
      suggestions.value = []
      categorySuggestions.value = []
    }
  }
  finally {
    if (suggestAbort === controller) {
      suggestAbort = null
      isLoading.value = false
    }
  }
}

function moveHighlight(dir: number) {
  if (totalOptions.value === 0) return
  if (!showDropdown.value) {
    // First arrow press re-opens the list the user closed with Escape
    showDropdown.value = true
    return
  }
  highlightIndex.value = (highlightIndex.value + dir + totalOptions.value) % totalOptions.value
  highlightFromKeyboard = true
}

function hoverOption(index: number) {
  highlightIndex.value = index
  highlightFromKeyboard = false
}

function handleSearch() {
  // Only a visible option chosen with the arrow keys may take over Enter
  const highlighted = isDropdownVisible.value && highlightFromKeyboard ? highlightIndex.value : -1
  cancelPendingSuggestions()
  showDropdown.value = false
  highlightIndex.value = -1
  highlightFromKeyboard = false

  if (highlighted >= 0) {
    const catLen = categorySuggestions.value.length
    if (highlighted < catLen) {
      const selectedCategory = categorySuggestions.value[highlighted]
      if (selectedCategory) selectCategory(selectedCategory)
    }
    else {
      const selectedSuggestion = suggestions.value[highlighted - catLen]
      if (selectedSuggestion) selectSuggestion(selectedSuggestion)
    }
    return
  }
  const q = query.value.trim()
  if (q) {
    emit('search', q)
  }
}

function selectSuggestion(s: ProductSuggestion) {
  cancelPendingSuggestions()
  showDropdown.value = false
  query.value = s.text
  if (s.seoId) {
    navigateTo(localePath(`/product/${s.seoId}`))
  }
  else {
    emit('search', s.text)
  }
}

function selectCategory(cat: CategorySuggestion) {
  cancelPendingSuggestions()
  showDropdown.value = false
  query.value = ''
  emit('selectCategory', cat.slug)
}

function categoryLabel(category: string): string | null {
  const label = slugToLabel.value[category]
  if (label) return label
  // Bare taxonomy ids ("267") mean nothing to users
  return /^\d+(?:,\s*\d+)*$/.test(category) ? null : category
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
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function formatPrice(price: number) {
  return new Intl.NumberFormat(locale.value === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' }).format(price)
}

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  cancelPendingSuggestions()
})

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}
</script>
