<template>
  <div class="max-w-7xl mx-auto">
    <!-- Items Horizontal Scroll -->
    <div class="relative">
      <h1>
        <UiHeaderLabel
          :label="$t('newestFlips')"
          :xl="true"
        />
      </h1>

      <!-- Scroll Container -->
      <div
        class="overflow-x-auto py-4"
        style="direction: rtl;"
      >
        <div
          class="flex gap-6 w-max "
          style="direction: ltr;"
        >
          <div
            v-for="item in filteredItems"
            :key="item.id"
          >
            <FlipperFlipItem :item="item" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { FlipperItem } from '~/types/FlipType'

interface Activity {
  id: string
  message: string
  timestamp: Date
}

// Reactive data
const selectedMarketplace = ref('all')
const items = ref<FlipperItem[]>([])
const recentActivity = ref<Activity[]>([])
const lastUpdated = ref('Just now')
let updateInterval: NodeJS.Timeout

// Mock data generator
const generateMockItem = (): FlipperItem => {
  const marketplaces = ['eBay', 'Facebook', 'Mercari', 'Poshmark']
  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Collectibles', 'Sports', 'Books']
  const conditions = ['New', 'Like New', 'Good', 'Fair']
  const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ']

  const currentPrice = Math.floor(Math.random() * 200) + 20
  const marketValue = currentPrice + Math.floor(Math.random() * 150) + 30
  const profit = marketValue - currentPrice - Math.floor(Math.random() * 20) - 10

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: `${categories[Math.floor(Math.random() * categories.length)]} Item ${Math.floor(Math.random() * 1000)}`,
    image: `/placeholder.svg?height=200&width=300&text=${encodeURIComponent('Product Image')}`,
    currentPrice,
    marketValue,
    profit: Math.max(profit, 5),
    profitMargin: Math.round((profit / currentPrice) * 100),
    marketplace: marketplaces[Math.floor(Math.random() * marketplaces.length)],
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    sellerRating: Math.round((Math.random() * 2 + 3) * 10) / 10,
    listedAt: new Date(Date.now() - Math.random() * 3600000),
    isWatched: Math.random() > 0.8,
  }
}

// Computed properties
const filteredItems = computed(() => {
  if (selectedMarketplace.value === 'all') {
    return items.value
  }
  return items.value.filter(item =>
    item.marketplace.toLowerCase() === selectedMarketplace.value,
  )
})

const updateItems = () => {
  // Simulate real-time updates
  if (Math.random() > 0.7) {
    items.value.unshift(generateMockItem())

    // Keep only last 50 items
    if (items.value.length > 50) {
      items.value = items.value.slice(0, 50)
    }

    lastUpdated.value = 'Just now'
  }
}

// Lifecycle
onMounted(() => {
  // Generate initial items
  for (let i = 0; i < 20; i++) {
    items.value.push(generateMockItem())
  }

  // Start real-time updates
  updateInterval = setInterval(updateItems, 5000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})

// Set page meta
useHead({
  title: 'Flipper Dashboard',
  meta: [
    { name: 'description', content: 'Real-time marketplace flipping opportunities' },
  ],
})
</script>
