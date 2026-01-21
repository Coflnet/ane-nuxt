<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>

    <div v-else-if="product" class="max-w-7xl mx-auto">
      <!-- Breadcrumb -->
      <nav class="flex text-sm text-slate-400 mb-6">
        <NuxtLink to="/home" class="hover:text-blue-400">Home</NuxtLink>
        <span class="mx-2">/</span>
        <span class="text-slate-200 truncate">{{ product.name }}</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <!-- Main Image -->
        <div class="lg:col-span-1">
          <div class="aspect-square bg-slate-800 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5 p-4">
             <NuxtImg
              v-if="product.imageUrl"
              :src="product.imageUrl"
              class="w-full h-full object-contain"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-slate-600">
               <Icon name="tabler:photo" class="w-20 h-20" />
            </div>
          </div>
        </div>

        <!-- Details -->
        <div class="lg:col-span-2">
          <div class="flex flex-wrap gap-2 mb-4">
             <span v-if="product.brand" class="px-3 py-1 rounded-full bg-slate-800 text-xs font-medium text-blue-400 border border-slate-700">
               {{ product.brand }}
             </span>
             <span v-if="product.model" class="px-3 py-1 rounded-full bg-slate-800 text-xs font-medium text-slate-400 border border-slate-700">
               {{ product.model }}
             </span>
          </div>

          <h1 class="text-4xl font-bold text-white mb-4 leading-tight">{{ product.name }}</h1>
          
          <p class="text-slate-400 text-lg mb-8 leading-relaxed max-w-3xl">
            {{ product.description }}
          </p>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
             <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
               <div class="text-slate-500 text-xs uppercase font-bold mb-1">Average Price</div>
               <div class="text-xl font-bold text-white">~{{ formatPrice(product.avgPrice) }}</div>
             </div>
             <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
               <div class="text-slate-500 text-xs uppercase font-bold mb-1">Available</div>
               <div class="text-xl font-bold text-green-400">{{ matches.length }} Offers</div>
             </div>
          </div>
        </div>
      </div>

      <!-- Listings Section -->
      <div class="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div class="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 class="text-2xl font-bold text-white">Available Offers</h2>
          <!-- Could add filter toggle here -->
        </div>
        
        <ProductListingTable :listings="matches" />
        
        <div class="p-4 bg-slate-800/30 text-center">
           <button class="text-blue-400 hover:text-blue-300 text-sm font-medium">Load more...</button>
        </div>
      </div>

    </div>
    
    <div v-else class="text-center py-20">
      <h2 class="text-2xl text-slate-400">Product not found</h2>
      <NuxtLink to="/home" class="text-blue-500 hover:underline mt-4 inline-block">Back to Home</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getProduct, getProductMatches } from '~/src/api-client'
import ProductListingTable from '~/components/product/ProductListingTable.vue'

const route = useRoute()
const productId = route.params.id as string

const product = ref<any>(null)
const matches = ref<any[]>([])
const loading = ref(true)

function formatPrice(amount: number) {
  if (!amount) return 'N/A'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

onMounted(async () => {
  try {
    // Parallel fetch
    const [pRes, mRes] = await Promise.all([
      getProduct({ path: { id: productId } }),
      getProductMatches({ path: { id: productId } })
    ])
    
    product.value = pRes
    matches.value = mRes || []
  } catch (e) {
    console.error('Failed to load product', e)
  } finally {
    loading.value = false
  }
})
</script>
