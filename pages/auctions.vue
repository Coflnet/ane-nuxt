<template>
  <div>
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Matched Auctions</h1>
        <p class="mt-2 text-slate-500 dark:text-slate-400">Auctions that match your filters</p>
      </div>
      <div class="mt-4 md:mt-0 flex items-center space-x-2">
        <select v-model="selectedFilter"
          class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400">
          <option value="all">All Filters</option>
          <option v-for="filter in filters" :key="filter.id" :value="filter.id">{{ filter.name }}</option>
        </select>

        <select v-model="sortOption"
          class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-6">
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="(auction, index) in filteredAuctions" :key="index"
            class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div class="relative">
              <img :src="auction.image" alt="Auction thumbnail" class="w-full h-48 object-cover" />
              <div class="absolute top-2 right-2">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  {{ auction.marketplace }}
                </span>
              </div>
            </div>

            <div class="p-4">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-medium text-lg text-slate-900 dark:text-white line-clamp-2">{{ auction.title }}</h3>
                <button class="ml-2 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
                  title="Save to favorites">
                  <HeartIcon class="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <div class="flex items-center justify-between mb-3">
                <p class="font-bold text-xl text-slate-900 dark:text-white">{{ auction.price }}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ auction.timeLeft }}</p>
              </div>

              <div class="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-4">
                <MapPinIcon class="w-4 h-4 mr-1" />
                <span>{{ auction.location }}</span>
              </div>

              <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <span class="text-sm text-slate-500 dark:text-slate-400">Matched filter:</span>
                  <span class="ml-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">{{ auction.filter
                    }}</span>
                </div>
                <a :href="auction.url" target="_blank"
                  class="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200">
                  View
                  <ExternalLinkIcon class="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredAuctions.length === 0" class="py-12 text-center">
          <SearchXIcon class="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-1">No auctions found</h3>
          <p class="text-slate-500 dark:text-slate-400">Try adjusting your filters or check back later</p>
        </div>
      </div>
    </div>

    <div class="flex justify-center">
      <nav class="inline-flex rounded-md shadow-sm">
        <button
          class="px-3 py-2 rounded-l-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
          <ChevronLeftIcon class="w-5 h-5" />
        </button>
        <button
          class="px-4 py-2 border-t border-b border-slate-300 dark:border-slate-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          1
        </button>
        <button
          class="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700">
          2
        </button>
        <button
          class="px-4 py-2 border-t border-b border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700">
          3
        </button>
        <button
          class="px-3 py-2 rounded-r-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
          <ChevronRightIcon class="w-5 h-5" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { HeartIcon, MapPinIcon, ExternalLinkIcon, ChevronLeftIcon, ChevronRightIcon, SearchXIcon } from 'lucide-vue-next'

const selectedFilter = ref('all')
const sortOption = ref('newest')

// Mock data for filters
const filters = ref([
  { id: 1, name: 'Photography Equipment' },
  { id: 2, name: 'Mountain Bikes' },
  { id: 3, name: 'Vintage Furniture' },
  { id: 4, name: 'Gaming Consoles' },
  { id: 5, name: 'Mechanical Keyboards' },
  { id: 6, name: 'Vinyl Records' }
])

// Mock data for auctions
const auctions = ref([
  {
    id: 1,
    title: 'Canon EOS 5D Mark IV DSLR Camera with 24-105mm Lens',
    price: '$1,899',
    marketplace: 'eBay',
    location: 'New York, USA',
    timeLeft: 'Ends in 2d 4h',
    filter: 'Photography Equipment',
    filterId: 1,
    url: '#',
    image: '/placeholder.svg?height=300&width=400'
  },
  {
    id: 2,
    title: 'Trek Fuel EX 8 Mountain Bike - 2022 Model - Medium Frame',
    price: '€1,450',
    marketplace: 'eBay Kleinanzeigen',
    location: 'Berlin, Germany',
    timeLeft: 'Ends in 5d 12h',
    filter: 'Mountain Bikes',
    filterId: 2,
    url: '#',
    image: '/placeholder.svg?height=300&width=400'
  },
  {
    id: 3,
    title: 'Mid Century Modern Teak Sideboard - Danish Design - Vintage 1960s',
    price: '$350',
    marketplace: 'eBay',
    location: 'Chicago, USA',
    timeLeft: 'Ends in 1d 8h',
    filter: 'Vintage Furniture',
    filterId: 3,
    url: '#',
    image: '/placeholder.svg?height=300&width=400'
  },
  {
    id: 4,
    title: 'Sony PlayStation 5 Digital Edition - Like New - With 2 Controllers',
    price: '€420',
    marketplace: 'eBay Kleinanzeigen',
    location: 'Munich, Germany',
    timeLeft: 'Ends in 3d 6h',
    filter: 'Gaming Consoles',
    filterId: 4,
    url: '#',
    image: '/placeholder.svg?height=300&width=400'
  },
  {
    id: 5,
    title: 'Keychron Q1 Mechanical Keyboard - QMK/VIA - Gateron Brown Switches',
    price: '$150',
    marketplace: 'eBay',
    location: 'Seattle, USA',
    timeLeft: 'Ends in 6h 45m',
    filter: 'Mechanical Keyboards',
    filterId: 5,
    url: '#',
    image: '/placeholder.svg?height=300&width=400'
  },
  {
    id: 6,
    title: 'Vinyl Record Collection - 50+ Classic Rock Albums - Led Zeppelin, Pink Floyd, etc.',
    price: '€280',
    marketplace: 'eBay Kleinanzeigen',
    location: 'Hamburg, Germany',
    timeLeft: 'Ends in 4d 2h',
    filter: 'Vinyl Records',
    filterId: 6,
    url: '#',
    image: '/placeholder.svg?height=300&width=400'
  }
])

// Filter and sort auctions
const filteredAuctions = computed(() => {
  let result = [...auctions.value]

  // Filter by selected filter
  if (selectedFilter.value !== 'all') {
    result = result.filter(auction => auction.filterId === parseInt(selectedFilter.value))
  }

  // Sort auctions
  switch (sortOption.value) {
    case 'oldest':
      // For demo purposes, we'll just reverse the array
      result = result.reverse()
      break
    case 'price-low':
      // This is a simplified sort for demo purposes
      result = result.sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''))
        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''))
        return priceA - priceB
      })
      break
    case 'price-high':
      // This is a simplified sort for demo purposes
      result = result.sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''))
        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''))
        return priceB - priceA
      })
      break
    default:
      // 'newest' is the default sort
      break
  }

  return result
})
</script>
