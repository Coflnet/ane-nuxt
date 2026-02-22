<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Hero Section -->
    <div class="text-center mb-16 pt-12">
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
          <span v-if="loading && products.length === 0">{{ $t('searching', 'Searching...') }}</span>
          <span v-else-if="products.length > 0">
            {{ $t('searchResults', 'Search Results') }}
            <span
              v-if="totalResults"
              class="text-slate-400 text-lg ml-2"
            >({{ totalResults }} {{ $t('found', 'found') }})</span>
          </span>
          <span v-else>{{ $t('noResultsFound', 'No results found') }}</span>
        </h2>
        <!-- Active filters badges -->
        <div class="flex flex-wrap gap-2">
          <span
            v-if="selectedCategory"
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30"
          >
            {{ localizeCategory(selectedCategory) }}
            <button
              class="ml-1 hover:text-white"
              @click="clearFilter('category')"
            >&times;</button>
          </span>
          <span
            v-if="selectedCondition"
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/30"
          >
            {{ localizeCondition(selectedCondition) }}
            <button
              class="ml-1 hover:text-white"
              @click="clearFilter('condition')"
            >&times;</button>
          </span>
          <span
            v-for="(value, key) in activeAttributeFilters"
            :key="key"
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs border border-purple-500/30"
          >
            {{ localizeAttrKey(String(key)) }}: {{ localizeAttrValue(String(key), value) }}
            <button
              class="ml-1 hover:text-white"
              @click="removeAttributeFilter(String(key))"
            >&times;</button>
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar Filters -->
        <div class="lg:col-span-1 space-y-4">
          <!-- Category Filter -->
          <div
            v-if="availableCategoryBuckets.length > 0"
            class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50"
          >
            <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              {{ $t('category', 'Category') }}
            </h3>
            <div class="flex flex-wrap gap-2 max-h-56 overflow-y-auto">
              <button
                v-for="bucket in availableCategoryBuckets"
                :key="bucket.value"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors max-w-[200px]"
                :class="selectedCategory === bucket.value ? 'bg-blue-500/20 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'"
                @click="toggleFilter('category', bucket.value!)"
              >
                <span class="truncate">{{ localizeCategory(bucket.value!) }}</span>
                <span class="text-xs opacity-60 flex-shrink-0">({{ bucket.count }})</span>
              </button>
            </div>
          </div>

          <!-- Condition Filter -->
          <div
            v-if="availableConditionBuckets.length > 0"
            class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50"
          >
            <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              {{ $t('condition', 'Condition') }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="bucket in availableConditionBuckets"
                :key="bucket.value"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors max-w-[200px]"
                :class="selectedCondition === bucket.value ? 'bg-green-500/20 text-green-400 font-medium' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'"
                @click="toggleFilter('condition', bucket.value!)"
              >
                <span class="truncate">{{ localizeCondition(bucket.value!) }}</span>
                <span class="text-xs opacity-60 flex-shrink-0">({{ bucket.count }})</span>
              </button>
            </div>
          </div>

          <!-- Attribute Filters -->
          <div
            v-for="(buckets, attrKey) in availableAttributeBuckets"
            :key="attrKey"
            class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50"
          >
            <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              {{ localizeAttrKey(attrKey) }}
            </h3>
            <div class="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
              <button
                v-for="bucket in buckets.slice(0, 15)"
                :key="bucket.value"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors max-w-[200px]"
                :class="activeAttributeFilters[attrKey] === bucket.value ? 'bg-purple-500/20 text-purple-400 font-medium' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'"
                @click="toggleAttributeFilter(attrKey, bucket.value!)"
              >
                <span class="truncate">{{ localizeAttrValue(attrKey, bucket.value!) }}</span>
                <span class="text-xs opacity-60 ml-1 flex-shrink-0">({{ bucket.count }})</span>
              </button>
            </div>
          </div>

          <!-- Clear all filters -->
          <button
            v-if="hasActiveFilters"
            class="w-full px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
            @click="clearAllFilters"
          >
            {{ $t('clearAllFilters', 'Clear All Filters') }}
          </button>
        </div>

        <!-- Product Grid -->
        <div class="lg:col-span-3">
          <div
            v-if="loading && products.length === 0"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div
              v-for="i in 6"
              :key="i"
              class="h-64 bg-slate-800/50 rounded-xl animate-pulse"
            />
          </div>

          <div
            v-else-if="products.length > 0"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent">
                    <span
                      v-if="product.categories && product.categories.length > 0 && product.categories[0] !== 'general'"
                      class="text-xs font-medium text-blue-400 uppercase tracking-wider"
                    >
                      {{ localizeCategory(product.categories[0]) }}
                    </span>
                  </div>
                </div>
                <div class="p-5">
                  <h3 class="text-lg font-semibold text-slate-100 mb-2 line-clamp-2 min-h-[3.5rem]">
                    {{ product.name }}
                  </h3>
                  <div class="flex items-center justify-between mt-4">
                    <div class="text-sm text-slate-400">
                      <span class="block text-xs">{{ $t('startingFrom', 'Starting from') }}</span>
                      <span class="text-lg font-bold text-green-400">
                        {{ product.minPrice ? formatPrice(product.minPrice) : $t('checkPrice', 'Check Price') }}
                      </span>
                    </div>
                    <div class="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                      {{ $t('details', 'Details') }} &rarr;
                    </div>
                  </div>
                </div>
              </NuxtLink>
            </div>

            <!-- Load More / Pagination -->
            <div
              v-if="canLoadMore"
              class="flex justify-center mt-8"
            >
              <button
                class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="loadingMore"
                @click="loadMore"
              >
                <span v-if="loadingMore">{{ $t('loading', 'Loading...') }}</span>
                <span v-else>{{ $t('loadMore', 'Load More') }} ({{ allProducts.length }} / {{ totalResults }})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Popular Categories (Default View) -->
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
          <div class="mb-4 inline-flex p-3 rounded-full bg-slate-700/50 group-hover:scale-110 transition-transform text-blue-400">
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
import { useI18n } from 'vue-i18n'
import { searchProducts } from '~/src/api-client'
import type { ProductDocument, FilterBucket } from '~/src/api-client/types.gen'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()

// URL-derived state
const searchQuery = computed(() => (route.query.q as string) || '')
const selectedCategory = computed(() => (route.query.category as string) || '')
const selectedCondition = computed(() => (route.query.condition as string) || '')
const activeAttributeFilters = computed(() => {
  const filters: Record<string, string> = {}
  for (const [key, value] of Object.entries(route.query)) {
    if (key.startsWith('attr_') && typeof value === 'string') {
      filters[key.slice(5)] = value
    }
  }
  return filters
})

const hasActiveFilters = computed(
  () =>
    !!selectedCategory.value
    || !!selectedCondition.value
    || Object.keys(activeAttributeFilters.value).length > 0,
)

// Data state
const allProducts = ref<ProductDocument[]>([])
const totalResults = ref<number>(0)
const categoryBuckets = ref<FilterBucket[]>([])
const conditionBuckets = ref<FilterBucket[]>([])
const attributeBuckets = ref<Record<string, FilterBucket[]>>({})

const loading = ref(false)
const loadingMore = ref(false)
const hasSearched = ref(false)

// Track previous query params to avoid re-fetching when only attribute filters change
const prevQuery = reactive({ q: '' as string | undefined, category: '' as string | undefined, condition: '' as string | undefined })

// Compute filtered products based on category, condition, and attributes
const filteredProductsForFacets = computed(() => {
  let filtered = allProducts.value

  // Filter by selected category
  if (selectedCategory.value) {
    filtered = filtered.filter(p =>
      p.categories
      && p.categories.some(
        c => c.toLowerCase() === selectedCategory.value.toLowerCase(),
      ),
    )
  }

  // Filter by selected condition
  if (selectedCondition.value) {
    filtered = filtered.filter(p =>
      p.condition
      && p.condition.toLowerCase() === selectedCondition.value.toLowerCase(),
    )
  }

  // Filter by selected attributes
  const attrFilters = activeAttributeFilters.value
  if (Object.keys(attrFilters).length > 0) {
    filtered = filtered.filter((p) => {
      if (!p.attributes) {
        return false
      }
      return Object.entries(attrFilters).every(([key, val]) =>
        p.attributes!.some(a => a.key === key && a.value === val),
      )
    })
  }

  return filtered
})

// Compute available category buckets accounting for other selected filters
const availableCategoryBuckets = computed(() => {
  if (selectedCategory.value) {
    // If a category is already selected, show only that one
    return categoryBuckets.value.filter(b => b.value?.toLowerCase() === selectedCategory.value.toLowerCase())
  }

  // Count categories in filtered products
  const counts: Record<string, number> = {}
  for (const product of filteredProductsForFacets.value) {
    if (product.categories) {
      for (const cat of product.categories) {
        const normalized = cat.toLowerCase()
        counts[normalized] = (counts[normalized] || 0) + 1
      }
    }
  }

  // Return categories with counts > 0, sorted by count
  return categoryBuckets.value
    .filter(b => b.value && b.value.toLowerCase() !== 'general' && (counts[b.value.toLowerCase()] || 0) > 0)
    .map(b => ({ ...b, count: counts[b.value!.toLowerCase()] || 0 }))
    .sort((a, b) => (b.count || 0) - (a.count || 0))
})

// Compute available condition buckets accounting for other selected filters
const availableConditionBuckets = computed(() => {
  if (selectedCondition.value) {
    // If a condition is already selected, show only that one
    return conditionBuckets.value.filter(b => b.value?.toLowerCase() === selectedCondition.value.toLowerCase())
  }

  // Count conditions in filtered products
  const counts: Record<string, number> = {}
  for (const product of filteredProductsForFacets.value) {
    if (product.condition) {
      const normalized = product.condition.toLowerCase()
      counts[normalized] = (counts[normalized] || 0) + 1
    }
  }

  // Return conditions with counts > 0, sorted by count
  return conditionBuckets.value
    .filter(b => b.value && (counts[b.value.toLowerCase()] || 0) > 0)
    .map(b => ({ ...b, count: counts[b.value!.toLowerCase()] || 0 }))
    .sort((a, b) => (b.count || 0) - (a.count || 0))
})

// Compute available attribute buckets accounting for other selected filters
const availableAttributeBuckets = computed(() => {
  const result: Record<string, FilterBucket[]> = {}

  const attrFilters = activeAttributeFilters.value

  for (const [key, buckets] of Object.entries(attributeBuckets.value)) {
    if (key.toLowerCase() === 'condition') continue // Skip condition, it has its own section

    if (attrFilters[key]) {
      // If this attribute is already selected, show only that value
      result[key] = buckets.filter(b => b.value === attrFilters[key])
    }
    else {
      // Count this attribute's values in filtered products
      const counts: Record<string, number> = {}
      for (const product of filteredProductsForFacets.value) {
        if (product.attributes) {
          for (const attr of product.attributes) {
            if (attr.key === key && attr.value) {
              counts[attr.value] = (counts[attr.value] || 0) + 1
            }
          }
        }
      }

      // Return values with counts > 0
      const available = buckets
        .filter(b => b.value && (counts[b.value] || 0) > 0)
        .map(b => ({ ...b, count: counts[b.value!] || 0 }))
        .sort((a, b) => (b.count || 0) - (a.count || 0))

      if (available.length > 0) {
        result[key] = available
      }
    }
  }

  return result
})

// Filter out empty values, duplicate "condition" key, and sort attribute groups
const displayAttributeBuckets = computed(() => {
  const result: Record<string, FilterBucket[]> = {}
  for (const [key, buckets] of Object.entries(availableAttributeBuckets.value)) {
    // Skip "condition" as it has its own section
    if (key.toLowerCase() === 'condition') continue
    const filtered = buckets.filter(b => b.value && b.value.trim() !== '' && (b.count ?? 0) > 0)
    if (filtered.length > 0) result[key] = filtered
  }
  return result
})

// Deduplicate condition buckets by their localized display value
const displayConditionBucketsWithDedup = computed(() => {
  const raw = availableConditionBuckets.value.filter(b => b.value && b.value !== 'unknown')
  const merged = new Map<string, FilterBucket>()
  for (const bucket of raw) {
    const display = localizeCondition(bucket.value!)
    const existing = merged.get(display)
    if (existing) {
      merged.set(display, { value: existing.value, count: (existing.count ?? 0) + (bucket.count ?? 0) })
    }
    else {
      // Map the value to the standard condition if it exists in the map
      let standardValue = bucket.value
      if (conditionMap[bucket.value!]) {
        standardValue = conditionMap[bucket.value!].replace('Condition', '').toLowerCase()
        if (standardValue === 'forparts') standardValue = 'broken'
      }
      merged.set(display, { value: standardValue, count: bucket.count })
    }
  }
  return Array.from(merged.values())
})

// For backward compatibility, keep displayConditionBuckets as an alias
const displayConditionBuckets = displayConditionBucketsWithDedup

// Client-side attribute filtering — API only supports category & condition
const products = computed(() => {
  return filteredProductsForFacets.value
})

const canLoadMore = computed(() => totalResults.value > allProducts.value.length)

const PAGE_SIZE = 20

const defaultCategories = [
  { searchValue: 'Electronics', labelKey: 'categories.electronics', icon: 'tabler:device-laptop' },
  { searchValue: 'Smartphones', labelKey: 'categories.smartphones', icon: 'tabler:device-mobile' },
  { searchValue: 'Photography', labelKey: 'categories.photography', icon: 'tabler:camera' },
  { searchValue: 'Gaming', labelKey: 'categories.gaming', icon: 'tabler:device-gamepad-2' },
]

// --- Localization helpers ---

const conditionMap: Record<string, string> = {
  'new': 'newCondition',
  'neu': 'newCondition',
  'nieuw': 'newCondition',
  'like_new': 'usedCondition',
  'like new': 'usedCondition',
  'used': 'usedCondition',
  'gebraucht': 'usedCondition',
  'refurbished': 'refurbishedCondition',
  'for_parts': 'forPartsCondition',
  'for parts': 'forPartsCondition',
  'broken': 'forPartsCondition',
  'good': 'usedCondition',
  'very_good': 'usedCondition',
  'very good': 'usedCondition',
  'acceptable': 'usedCondition',
}

// Common category translations
const categoryTranslationMap: Record<string, string> = {
  'Electronics': 'cat_electronics',
  'Smartphones': 'cat_smartphones',
  'Tablets': 'cat_tablets',
  'Laptops': 'cat_laptops',
  'Computers': 'cat_computers',
  'Gaming': 'cat_gaming',
  'Photography': 'cat_photography',
  'Audio': 'cat_audio',
  'TV & Video': 'cat_tv_video',
  'Clothing': 'cat_clothing',
  'Shoes': 'cat_shoes',
  'Watches': 'cat_watches',
  'Jewelry': 'cat_jewelry',
  'Home & Garden': 'cat_home_garden',
  'Sports': 'cat_sports',
  'Toys': 'cat_toys',
  'Books': 'cat_books',
  'Music': 'cat_music',
  'Movies': 'cat_movies',
  'Automotive': 'cat_automotive',
  'Baby': 'cat_baby',
  'Health & Beauty': 'cat_health_beauty',
  'Pet Supplies': 'cat_pet_supplies',
  'Office': 'cat_office',
  'Tools': 'cat_tools',
  'Furniture': 'cat_furniture',
  'Kitchen': 'cat_kitchen',
  'Garden': 'cat_garden',
  'Accessories': 'cat_accessories',
  'Bags': 'cat_bags',
  'Collectibles': 'cat_collectibles',
}

// Common attribute key translations
const attrKeyTranslationMap: Record<string, string> = {
  'brand': 'attr_brand',
  'color': 'attr_color',
  'size': 'attr_size',
  'storage': 'attr_storage',
  'memory': 'attr_memory',
  'ram': 'attr_ram',
  'screen_size': 'attr_screen_size',
  'material': 'attr_material',
  'style': 'attr_style',
  'type': 'attr_type',
  'model': 'attr_model',
  'connectivity': 'attr_connectivity',
  'operating_system': 'attr_operating_system',
  'processor': 'attr_processor',
  'resolution': 'attr_resolution',
  'weight': 'attr_weight',
  'gender': 'attr_gender',
  'capacity': 'attr_capacity',
  'battery health': 'attr_battery_health',
  'battery_health': 'attr_battery_health',
  'delivery': 'attr_delivery',
  'service': 'attr_service',
  'product type': 'attr_product_type',
  'product_type': 'attr_product_type',
  'console name': 'attr_console_name',
  'console_name': 'attr_console_name',
  'game name': 'attr_game_name',
  'game_name': 'attr_game_name',
  'publisher': 'attr_publisher',
  'controllers': 'attr_controllers',
  'manufactureaddress': 'attr_manufacturer',
  'manufacturertradename': 'attr_manufacturer',
}

// Common attribute value translations (for colors, sizes, etc.)
const attrValueTranslationMap: Record<string, Record<string, string>> = {
  color: {
    Black: 'color_black',
    White: 'color_white',
    Red: 'color_red',
    Blue: 'color_blue',
    Green: 'color_green',
    Yellow: 'color_yellow',
    Pink: 'color_pink',
    Purple: 'color_purple',
    Orange: 'color_orange',
    Gray: 'color_gray',
    Grey: 'color_gray',
    Silver: 'color_silver',
    Gold: 'color_gold',
    Brown: 'color_brown',
    Beige: 'color_beige',
  },
  gender: {
    Male: 'gender_male',
    Female: 'gender_female',
    Unisex: 'gender_unisex',
  },
}

function localizeCategory(cat: string): string {
  const key = categoryTranslationMap[cat]
  if (key) {
    const translated = t(key, cat)
    return translated !== key ? translated : cat
  }
  return cat
}

function localizeCondition(cond: string): string {
  const key = conditionMap[cond]
  if (key) {
    const translated = t(key, cond)
    return translated !== key ? translated : formatConditionFallback(cond)
  }
  return formatConditionFallback(cond)
}

function formatConditionFallback(cond: string): string {
  return cond.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function localizeAttrKey(key: string): string {
  const tKey = attrKeyTranslationMap[key.toLowerCase()]
  if (tKey) {
    const translated = t(tKey, key)
    return translated !== tKey ? translated : formatAttrKeyFallback(key)
  }
  return formatAttrKeyFallback(key)
}

function formatAttrKeyFallback(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function localizeAttrValue(attrKey: string, value: string): string {
  const valueMap = attrValueTranslationMap[attrKey.toLowerCase()]
  if (valueMap && valueMap[value]) {
    const translated = t(valueMap[value], value)
    return translated !== valueMap[value] ? translated : value
  }
  return value
}

// --- Search & filter logic ---

function buildSearchParams(offset = 0) {
  const params: Record<string, any> = { offset, limit: PAGE_SIZE }
  if (searchQuery.value) params.query = searchQuery.value
  // OpenSearch Term queries require lowercase for categories and conditions
  if (selectedCategory.value) params.category = selectedCategory.value.toLowerCase()
  if (selectedCondition.value) params.condition = selectedCondition.value.toLowerCase()
  // Note: attributes are filtered client-side (production API doesn't support them)
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
    const offset = append ? allProducts.value.length : 0
    const params = buildSearchParams(offset)
    const response = await searchProducts({ query: params })

    if (append) {
      allProducts.value = [...allProducts.value, ...(response?.products || [])]
    }
    else {
      allProducts.value = response?.products || []

      // Use aggregation buckets if available (new backend), otherwise derive from products
      if (response?.categoryBuckets && response.categoryBuckets.length > 0) {
        categoryBuckets.value = response.categoryBuckets.filter(b => b.value?.toLowerCase() !== 'general')
      }
      else if (response?.categories) {
        // Estimate counts from current page of products
        const catCounts: Record<string, number> = {}
        for (const p of allProducts.value) {
          for (const cat of p.categories || []) {
            catCounts[cat] = (catCounts[cat] || 0) + 1
          }
        }
        categoryBuckets.value = response.categories
          .filter(c => c.toLowerCase() !== 'general')
          .map(c => ({ value: c, count: catCounts[c] || 0 }))
          .sort((a, b) => (b.count || 0) - (a.count || 0))
      }

      if (response?.conditionBuckets && response.conditionBuckets.length > 0) {
        conditionBuckets.value = response.conditionBuckets
      }
      else {
        // Derive condition counts from products — normalize to lowercase to avoid duplicates
        const condCounts: Record<string, number> = {}
        for (const p of allProducts.value) {
          if (p.condition) {
            const normalized = p.condition.toLowerCase()
            condCounts[normalized] = (condCounts[normalized] || 0) + 1
          }
        }
        conditionBuckets.value = Object.entries(condCounts)
          .map(([v, c]) => ({ value: v, count: c }))
          .sort((a, b) => (b.count || 0) - (a.count || 0))
      }

      if (response?.attributeBuckets && Object.keys(response.attributeBuckets).length > 0) {
        attributeBuckets.value = response.attributeBuckets
      }
      else if (response?.attributesWithValues) {
        // Derive attribute counts from products
        const attrCounts: Record<string, Record<string, number>> = {}
        for (const p of allProducts.value) {
          if (p.attributes) {
            for (const attr of p.attributes) {
              if (attr.key && attr.value) {
                if (!attrCounts[attr.key]) attrCounts[attr.key] = {}
                attrCounts[attr.key][attr.value] = (attrCounts[attr.key][attr.value] || 0) + 1
              }
            }
          }
        }
        const result: Record<string, FilterBucket[]> = {}
        for (const [key, values] of Object.entries(response.attributesWithValues)) {
          result[key] = values
            .map(v => ({ value: v, count: attrCounts[key]?.[v] || 0 }))
            .sort((a, b) => (b.count || 0) - (a.count || 0))
        }
        attributeBuckets.value = result
      }
    }
    totalResults.value = response?.total || 0
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

function toggleFilter(type: 'category' | 'condition', value: string) {
  const query = { ...route.query }
  if (query[type] === value) {
    delete query[type]
  }
  else {
    query[type] = value
  }
  router.push({ query })
}

function clearFilter(type: string) {
  const query = { ...route.query }
  delete query[type]
  router.push({ query })
}

function toggleAttributeFilter(key: string, value: string) {
  const query = { ...route.query }
  const paramKey = `attr_${key}`
  if (query[paramKey] === value) {
    delete query[paramKey]
  }
  else {
    query[paramKey] = value
  }
  router.push({ query })
}

function removeAttributeFilter(key: string) {
  const query = { ...route.query }
  delete query[`attr_${key}`]
  router.push({ query })
}

function clearAllFilters() {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.q = searchQuery.value
  router.push({ query })
}

function onSearch(query: string) {
  router.push({ query: { q: query } })
}

function onCategoryClick(category: string) {
  onSearch(category)
}

// Watch route query changes and trigger search
watch(() => route.query, () => {
  const hasQuery = route.query.q || route.query.category || route.query.condition
    || Object.keys(route.query).some(k => k.startsWith('attr_'))
  if (hasQuery) {
    // Detect if server-side filter params changed (search, category, or condition)
    const currentQ = route.query.q ? String(route.query.q) : ''
    const currentCategory = route.query.category ? String(route.query.category) : ''
    const currentCondition = route.query.condition ? String(route.query.condition) : ''

    const queryChanged = currentQ !== prevQuery.q || currentCategory !== prevQuery.category || currentCondition !== prevQuery.condition

    if (queryChanged || !hasSearched.value) {
      performSearch()
    }

    // Save previous query params for comparison
    prevQuery.q = currentQ
    prevQuery.category = currentCategory
    prevQuery.condition = currentCondition
  }
  else {
    allProducts.value = []
    hasSearched.value = false
    totalResults.value = 0
    categoryBuckets.value = []
    conditionBuckets.value = []
    attributeBuckets.value = {}
  }
}, { immediate: true })

function formatPrice(amount: number) {
  return new Intl.NumberFormat(locale.value === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' }).format(amount)
}

useHead({
  title: t('searchPageTitle', 'Search - Compare Prices'),
})
</script>
