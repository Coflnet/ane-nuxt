<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Hero Section -->
    <div class="text-center mb-10 pt-8">
      <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6 whitespace-normal break-words">
        {{ $t('findBestDeals', 'Find the Best Second-Hand Deals') }}
      </h1>
      <p class="text-base md:text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
        {{ $t('homeSubtitle', 'Compare prices across multiple marketplaces. Save money and the planet.') }}
      </p>

      <ProductSearch
        :initial-query="searchQuery"
        @search="onSearch"
      />
    </div>

    <!-- Results Section (if searching) -->
    <div
      v-if="loading || products.length > 0 || hasSearched"
      class="max-w-7xl mx-auto"
    >
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-semibold text-slate-200">
          {{ loading ? $t('searching', 'Searching...') : products.length > 0 ? `${total} ${$t('searchResults', 'Results')}` : $t('noResultsFound', 'No results found') }}
        </h2>
        <!-- Active filters badges -->
        <div class="flex flex-wrap gap-2">
          <span
            v-if="selectedCategory"
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30"
          >
            {{ selectedCategory }}
            <button
              class="ml-1 hover:text-white"
              @click="clearCategory"
            >
              &times;
            </button>
          </span>
          <span
            v-if="selectedCondition"
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/30"
          >
            {{ selectedCondition }}
            <button
              class="ml-1 hover:text-white"
              @click="clearCondition"
            >
              &times;
            </button>
          </span>
          <span
            v-for="(value, key) in activeAttributeFilters"
            :key="key"
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs border border-purple-500/30"
          >
            {{ formatAttrKey(key) }}: {{ value }}
            <button
              class="ml-1 hover:text-white"
              @click="removeAttributeFilter(key)"
            >
              &times;
            </button>
          </span>
        </div>
      </div>

      <div class="flex gap-6">
        <!-- Sidebar Filters -->
        <aside
          v-if="!loading && (availableCategories.length > 0 || Object.keys(availableAttributes).length > 0)"
          class="w-64 flex-shrink-0 hidden lg:block"
        >
          <div class="sticky top-4 space-y-6">
            <!-- Category Filter -->
            <div
              v-if="availableCategories.length > 0"
              class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
            >
              <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
                {{ $t('category', 'Category') }}
              </h3>
              <div class="space-y-1 max-h-48 overflow-y-auto">
                <button
                  v-for="cat in availableCategories"
                  :key="cat"
                  class="block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors"
                  :class="selectedCategory === cat ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'"
                  @click="toggleCategory(cat)"
                >
                  {{ cat }}
                </button>
              </div>
            </div>

            <!-- Condition Filter -->
            <div
              v-if="availableConditions.length > 0"
              class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
            >
              <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
                {{ $t('condition', 'Condition') }}
              </h3>
              <div class="space-y-1">
                <button
                  v-for="cond in availableConditions"
                  :key="cond"
                  class="block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors"
                  :class="selectedCondition === cond ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'"
                  @click="toggleCondition(cond)"
                >
                  {{ formatCondition(cond) }}
                </button>
              </div>
            </div>

            <!-- Attribute Filters -->
            <div
              v-for="(values, attrKey) in filteredAttributes"
              :key="attrKey"
              class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
            >
              <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
                {{ formatAttrKey(attrKey) }}
              </h3>
              <div class="space-y-1 max-h-40 overflow-y-auto">
                <button
                  v-for="val in values.slice(0, 10)"
                  :key="val"
                  class="block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors"
                  :class="activeAttributeFilters[attrKey] === val ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'"
                  @click="toggleAttributeFilter(attrKey, val)"
                >
                  {{ val }}
                </button>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="flex-1 min-w-0">
          <!-- Mobile filter toggle -->
          <button
            class="lg:hidden mb-4 flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-slate-300 text-sm border border-slate-700"
            @click="showMobileFilters = !showMobileFilters"
          >
            <Icon
              name="tabler:filter"
              class="w-4 h-4"
            />
            {{ $t('filters', 'Filters') }}
            <span
              v-if="activeFilterCount > 0"
              class="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            >
              {{ activeFilterCount }}
            </span>
          </button>

          <!-- Mobile Filters Panel -->
          <div
            v-if="showMobileFilters && !loading"
            class="lg:hidden mb-6 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-4"
          >
            <div
              v-if="availableCategories.length > 0"
              class="flex flex-wrap gap-2"
            >
              <span class="text-xs font-bold text-slate-400 uppercase w-full mb-1">{{ $t('category', 'Category') }}</span>
              <button
                v-for="cat in availableCategories"
                :key="cat"
                class="px-3 py-1 rounded-full text-xs border transition-colors"
                :class="selectedCategory === cat ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'text-slate-400 border-slate-600 hover:border-slate-500'"
                @click="toggleCategory(cat)"
              >
                {{ cat }}
              </button>
            </div>
            <div
              v-if="availableConditions.length > 0"
              class="flex flex-wrap gap-2"
            >
              <span class="text-xs font-bold text-slate-400 uppercase w-full mb-1">{{ $t('condition', 'Condition') }}</span>
              <button
                v-for="cond in availableConditions"
                :key="cond"
                class="px-3 py-1 rounded-full text-xs border transition-colors"
                :class="selectedCondition === cond ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'text-slate-400 border-slate-600 hover:border-slate-500'"
                @click="toggleCondition(cond)"
              >
                {{ formatCondition(cond) }}
              </button>
            </div>
          </div>

          <div
            v-if="loading"
            class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <div
              v-for="i in 6"
              :key="i"
              class="h-64 bg-slate-800/50 rounded-xl animate-pulse"
            />
          </div>

          <div
            v-else-if="products.length > 0"
            class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <NuxtLink
              v-for="product in products"
              :key="product.seoId ?? 'unknown'"
              :to="`/product/${product.seoId}`"
              class="block bg-slate-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500/50 transition-all hover:scale-[1.02] group"
            >
              <div class="aspect-video bg-slate-900 relative">
                <NuxtImg
                  v-if="product.imageUrl"
                  :src="product.imageUrl"
                  class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center text-slate-600"
                >
                  <Icon
                    name="tabler:photo"
                    class="w-12 h-12"
                  />
                </div>
                <div
                  class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"
                >
                  <span
                    v-if="product.categories?.length"
                    class="text-xs font-medium text-blue-400 uppercase tracking-wider"
                  >
                    {{ product.categories[0] }}
                  </span>
                </div>
              </div>
              <div class="p-5">
                <h3 class="text-lg font-semibold text-slate-100 mb-2 line-clamp-2 min-h-[3.5rem]">
                  {{ product.name }}
                </h3>
                <!-- Attribute pills -->
                <div
                  v-if="product.attributes?.length"
                  class="flex flex-wrap gap-1 mb-3"
                >
                  <span
                    v-for="attr in product.attributes.slice(0, 3)"
                    :key="attr.key"
                    class="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400"
                  >
                    {{ attr.value }}
                  </span>
                </div>
                <div class="flex items-center justify-between mt-2">
                  <div class="text-sm text-slate-400">
                    <span class="block text-xs">{{ $t('startingFrom', 'Starting from') }}</span>
                    <span class="text-lg font-bold text-green-400">
                      {{ product.minPrice ? formatPrice(product.minPrice) : $t('checkPrice', 'Check Price') }}
                    </span>
                  </div>
                  <div
                    v-if="product.condition"
                    class="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    :class="conditionClass(product.condition)"
                  >
                    {{ formatCondition(product.condition) }}
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>

          <!-- Load more -->
          <div
            v-if="products.length > 0 && products.length < total"
            class="mt-8 text-center"
          >
            <button
              class="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition-colors"
              :disabled="loadingMore"
              @click="loadMore"
            >
              {{ loadingMore ? $t('loading', 'Loading...') : $t('loadMore', 'Load More') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Categories / Features (Default View) -->
    <div
      v-else
      class="max-w-6xl mx-auto mt-20"
    >
      <h2 class="text-2xl font-bold text-center text-slate-300 mb-10">
        {{ $t('popularCategories', 'Popular Categories') }}
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          v-for="cat in defaultCategories"
          :key="cat.searchValue"
          class="p-6 bg-slate-800/30 hover:bg-slate-800 rounded-xl transition-colors text-center group"
          @click="onCategoryClick(cat.searchValue)"
        >
          <div
            class="mb-4 inline-flex p-3 rounded-full bg-slate-700/50 group-hover:scale-110 transition-transform text-blue-400"
          >
            <Icon
              :name="cat.icon"
              class="w-8 h-8"
            />
          </div>
          <div class="font-medium text-slate-200">
            {{ $t(cat.labelKey) }}
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { searchProducts } from '~/src/api-client'
import { useI18n } from 'vue-i18n'
import type { ProductDocument, SearchProductsResult } from '~/src/api-client/types.gen'

const router = useRouter()
const route = useRoute()
const searchQuery = computed(() => (route.query.q as string) || '')
const products = ref<ProductDocument[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasSearched = ref(false)
const total = ref(0)
const showMobileFilters = ref(false)

// Filters from API response
const availableCategories = ref<string[]>([])
const availableAttributes = ref<Record<string, string[]>>({})

// Active filters
const selectedCategory = ref<string | null>((route.query.category as string) || null)
const selectedCondition = ref<string | null>((route.query.condition as string) || null)
const activeAttributeFilters = ref<Record<string, string>>({})

// Derive conditions from attributes
const availableConditions = computed(() => {
  const conditions = products.value
    .map(p => p.condition)
    .filter((c): c is string => !!c)
  return [...new Set(conditions)]
})

// Internal attribute keys to exclude from filter UI
const excludedAttrKeys = new Set(['brand', 'model', 'condition', 'shipping', 'type'])

const filteredAttributes = computed(() => {
  const filtered: Record<string, string[]> = {}
  for (const [key, values] of Object.entries(availableAttributes.value)) {
    if (!excludedAttrKeys.has(key) && values.length > 1) {
      filtered[key] = values
    }
  }
  return filtered
})

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedCategory.value) count++
  if (selectedCondition.value) count++
  count += Object.keys(activeAttributeFilters.value).length
  return count
})

const defaultCategories = [
  { searchValue: 'Electronics', labelKey: 'categories.electronics', icon: 'tabler:device-laptop' },
  { searchValue: 'Smartphones', labelKey: 'categories.smartphones', icon: 'tabler:device-mobile' },
  { searchValue: 'Photography', labelKey: 'categories.photography', icon: 'tabler:camera' },
  { searchValue: 'Gaming', labelKey: 'categories.gaming', icon: 'tabler:device-gamepad-2' },
]

const { t } = useI18n()

function buildSearchParams() {
  const params: Record<string, any> = {}
  if (searchQuery.value) params.query = searchQuery.value
  if (selectedCategory.value) params.category = selectedCategory.value
  if (selectedCondition.value) params.condition = selectedCondition.value

  const attrList = Object.entries(activeAttributeFilters.value)
    .map(([k, v]) => `${k}:${v}`)
  if (attrList.length > 0) params.attributes = attrList

  return params
}

async function performSearch(append = false) {
  if (!append) {
    loading.value = true
  }
  else {
    loadingMore.value = true
  }
  hasSearched.value = true

  try {
    const params = buildSearchParams()
    if (append) params.offset = products.value.length
    const response = await searchProducts({ query: params }) as unknown as SearchProductsResult

    if (append) {
      products.value = [...products.value, ...(response?.products || [])]
    }
    else {
      products.value = response?.products || []
      availableCategories.value = response?.categories || []
      availableAttributes.value = response?.attributesWithValues || {}
    }
    total.value = response?.total || 0
  }
  catch (e) {
    console.error('Search failed', e)
  }
  finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  performSearch(true)
}

function updateUrlAndSearch() {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.q = searchQuery.value
  if (selectedCategory.value) query.category = selectedCategory.value
  if (selectedCondition.value) query.condition = selectedCondition.value
  for (const [k, v] of Object.entries(activeAttributeFilters.value)) {
    query[`attr_${k}`] = v
  }
  router.push({ query })
}

function toggleCategory(cat: string) {
  selectedCategory.value = selectedCategory.value === cat ? null : cat
  updateUrlAndSearch()
}

function clearCategory() {
  selectedCategory.value = null
  updateUrlAndSearch()
}

function toggleCondition(cond: string) {
  selectedCondition.value = selectedCondition.value === cond ? null : cond
  updateUrlAndSearch()
}

function clearCondition() {
  selectedCondition.value = null
  updateUrlAndSearch()
}

function toggleAttributeFilter(key: string, value: string) {
  if (activeAttributeFilters.value[key] === value) {
    const { [key]: _, ...rest } = activeAttributeFilters.value
    activeAttributeFilters.value = rest
  }
  else {
    activeAttributeFilters.value = { ...activeAttributeFilters.value, [key]: value }
  }
  updateUrlAndSearch()
}

function removeAttributeFilter(key: string) {
  const { [key]: _, ...rest } = activeAttributeFilters.value
  activeAttributeFilters.value = rest
  updateUrlAndSearch()
}

function onSearch(query: string) {
  // Reset filters on new search
  selectedCategory.value = null
  selectedCondition.value = null
  activeAttributeFilters.value = {}
  router.push({ query: { q: query } })
}

// Restore attribute filters from URL
function restoreFiltersFromUrl() {
  for (const [key, value] of Object.entries(route.query)) {
    if (key.startsWith('attr_') && typeof value === 'string') {
      activeAttributeFilters.value[key.slice(5)] = value
    }
  }
  if (route.query.category) selectedCategory.value = route.query.category as string
  if (route.query.condition) selectedCondition.value = route.query.condition as string
}

watch(() => route.query, () => {
  restoreFiltersFromUrl()
  if (route.query.q || selectedCategory.value || selectedCondition.value || Object.keys(activeAttributeFilters.value).length > 0) {
    performSearch()
  }
  else {
    products.value = []
    hasSearched.value = false
  }
}, { immediate: true })

function onCategoryClick(category: string) {
  onSearch(category)
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatAttrKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatCondition(condition: string) {
  const map: Record<string, string> = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    acceptable: 'Acceptable',
    used: 'Used',
    broken: 'Broken',
  }
  return map[condition] || condition
}

function conditionClass(condition: string) {
  const classes: Record<string, string> = {
    new: 'bg-green-500/20 text-green-400 border border-green-500/30',
    like_new: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    good: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    used: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    broken: 'bg-red-500/20 text-red-400 border border-red-500/30',
  }
  return classes[condition] || 'bg-slate-700/50 text-slate-400'
}

useHead({
  title: t('searchPageTitle', 'Search - Compare Prices'),
})
</script>
