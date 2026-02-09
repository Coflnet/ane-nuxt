<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Hero Section -->
    <div class="text-center mb-16 pt-12">
      <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6 whitespace-normal break-words">
        {{ $t('findBestDeals', 'Find the Best Second-Hand Deals') }}
      </h1>
      <p class="text-base md:text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
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
          <span v-if="loading">{{ $t('searching', 'Searching...') }}</span>
          <span v-else-if="products.length > 0">
            {{ $t('searchResults', 'Search Results') }}
            <span v-if="totalResults" class="text-slate-400 text-lg ml-2">({{ totalResults }} {{ $t('found', 'found') }})</span>
          </span>
          <span v-else>{{ $t('noResultsFound', 'No results found') }}</span>
        </h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar Filters -->
        <div class="lg:col-span-1 space-y-8">
          <!-- Categories Input List -->
          <div v-if="availableCategories.length > 0" class="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
            <h3 class="text-lg font-semibold text-white mb-4">
              {{ $t('categories', 'Categories') }}
            </h3>
            <div class="space-y-2">
              <button
                v-for="cat in availableCategories"
                :key="cat"
                class="block w-full text-left px-3 py-2 rounded-lg transition-colors text-sm"
                :class="cat === selectedCategory ? 'bg-blue-500/20 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'"
                @click="onCategorySelect(cat)"
              >
                {{ cat }}
              </button>
              
              <button
                v-if="selectedCategory"
                class="block w-full text-left px-3 py-2 rounded-lg transition-colors text-sm text-red-400 hover:bg-red-500/10 mt-4 border-t border-slate-700/50 pt-4"
                @click="onCategorySelect(undefined)"
              >
                {{ $t('clearFilter', 'Clear Filter') }}
              </button>
            </div>
          </div>

          <!-- Attributes (Display Only) -->
          <div v-if="Object.keys(availableAttributes).length > 0" class="space-y-6">
            <div v-for="(values, key) in availableAttributes" :key="key" class="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
              <h4 class="text-white font-medium mb-3 capitalize">
                {{ key }}
              </h4>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="val in values"
                  :key="val"
                  class="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300"
                >
                  {{ val || 'N/A' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Product Grid -->
        <div class="lg:col-span-3">
          <div
            v-if="loading"
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
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                    v-if="product.category"
                    class="text-xs font-medium text-blue-400 uppercase tracking-wider"
                  >
                    {{ product.category }}
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
          v-for="cat in categories"
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
import type { Product, ProductDocument } from '~/src/api-client/types.gen'

const router = useRouter()
const route = useRoute()
const searchQuery = computed(() => (route.query.q as string) || '')
const selectedCategory = computed(() => (route.query.category as string) || '')

const products = ref<ProductDocument[]>([])
const totalResults = ref<number | null>(null)
const availableCategories = ref<string[]>([])
const availableAttributes = ref<{ [key: string]: string[] }>({})

const loading = ref(false)
const hasSearched = ref(false)

const categories = [
  { searchValue: 'Electronics', labelKey: 'categories.electronics', icon: 'tabler:device-laptop' },
  { searchValue: 'Smartphones', labelKey: 'categories.smartphones', icon: 'tabler:device-mobile' },
  { searchValue: 'Photography', labelKey: 'categories.photography', icon: 'tabler:camera' },
  { searchValue: 'Gaming', labelKey: 'categories.gaming', icon: 'tabler:device-gamepad-2' },
]

const { t } = useI18n()

async function performSearch(query: string, category?: string) {
  loading.value = true
  hasSearched.value = true
  try {
    const response = await searchProducts({ 
      query: { 
        query,
        category 
      } 
    })
    products.value = response?.products || []
    totalResults.value = response?.total ?? null
    availableCategories.value = response?.categories || []
    availableAttributes.value = response?.attributesWithValues || {}
  }
  catch (e) {
    console.error('Search failed', e)
  }
  finally {
    loading.value = false
  }
}

function onSearch(query: string) {
  // Pass the existing category if one is selected, OR reset it?
  // Typically a new search query resets filters. Let's reset category for a new search term.
  router.push({ query: { q: query } })
}

function onCategorySelect(category: string | undefined) {
  const query = { ...route.query }
  if (category) {
    query.category = category
  } else {
    delete query.category
  }
  router.push({ query })
}

watch(() => [route.query.q, route.query.category], ([newQuery, newCategory]) => {
  if (newQuery || newCategory) {
    performSearch(newQuery as string, newCategory as string)
  }
  else {
    products.value = []
    hasSearched.value = false
    totalResults.value = null
    availableCategories.value = []
    availableAttributes.value = {}
  }
}, { immediate: true })

function onCategoryClick(category: string) {
  onSearch(category)
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

useHead({
  title: t('searchPageTitle', 'Search - Compare Prices'),
})
</script>
