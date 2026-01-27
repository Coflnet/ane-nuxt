<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Hero Section -->
    <div class="text-center mb-16 pt-12">
      <h1 class="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6">
        {{ $t('findBestDeals', 'Find the Best Second-Hand Deals') }}
      </h1>
      <p class="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
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
      class="max-w-6xl mx-auto"
    >
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-semibold text-slate-200">
          {{ loading ? 'Searching...' : products.length > 0 ? 'Search Results' : 'No results found' }}
        </h2>
      </div>

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
          :key="product.id"
          :to="`/product/${product.id}`"
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
                <span class="block text-xs">Starting from</span>
                <span class="text-lg font-bold text-green-400">
                  {{ product.minPrice ? formatPrice(product.minPrice) : 'Check Price' }}
                </span>
              </div>
              <div class="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                Details &rarr;
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Categories / Features (Default View) -->
    <div
      v-else
      class="max-w-6xl mx-auto mt-20"
    >
      <h2 class="text-2xl font-bold text-center text-slate-300 mb-10">
        Popular Categories
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          v-for="cat in categories"
          :key="cat.name"
          class="p-6 bg-slate-800/30 hover:bg-slate-800 rounded-xl transition-colors text-center group"
          @click="onCategoryClick(cat.name)"
        >
          <div class="mb-4 inline-flex p-3 rounded-full bg-slate-700/50 group-hover:scale-110 transition-transform text-blue-400">
            <Icon
              :name="cat.icon"
              class="w-8 h-8"
            />
          </div>
          <div class="font-medium text-slate-200">
            {{ cat.name }}
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { searchProducts } from '~/src/api-client'
import type { Product } from '~/src/api-client/types.gen'

const router = useRouter()
const route = useRoute()
const searchQuery = computed(() => (route.query.q as string) || '')
const products = ref<Product[]>([])
const loading = ref(false)
const hasSearched = ref(false)

const categories = [
  { name: 'Electronics', icon: 'tabler:device-laptop' },
  { name: 'Smartphones', icon: 'tabler:device-mobile' },
  { name: 'Photography', icon: 'tabler:camera' },
  { name: 'Gaming', icon: 'tabler:device-gamepad-2' },
]

async function performSearch(query: string) {
  loading.value = true
  hasSearched.value = true
  try {
    const response = await searchProducts({ query: { query } })
    products.value = response?.products || []
  }
  catch (e) {
    console.error('Search failed', e)
  }
  finally {
    loading.value = false
  }
}

function onSearch(query: string) {
  router.push({ query: { ...route.query, q: query } })
}

watch(() => route.query.q, (newQuery) => {
  if (newQuery) {
    performSearch(newQuery as string)
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

useHead({
  title: 'Home - Compare Prices',
})
</script>
