<template>
  <UiDefaultContainer class="shadow-md">
    <!-- Item Image -->
    <div class="relative">
      <img
        :src="item.image"
        :alt="item.name"
        class="w-full h-48 object-cover"
      >
      <div class="absolute top-3 left-3">
        <span
          class="px-2 py-1 rounded-full text-xs font-medium"
          :class="getMarketplaceBadgeClass(item.marketplace)"
        >
          {{ item.marketplace }}
        </span>
      </div>

      <div class="absolute top-3 right-3">
        <span
          class="px-2 py-1 rounded-full text-xs font-bold"
          :class="getProfitBadgeClass(item.profit)"
        >
          +${{ item.profit }}
        </span>
      </div>

      <div class="absolute bottom-3 left-3">
        <span class="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
          {{ getTimeAgo(item.listedAt) }}
        </span>
      </div>
    </div>

    <!-- Item Details -->
    <div class="p-4">
      <h3>
        <UiHeaderLabel
          :label="item.name"
        />
      </h3>

      <div class="flex items-center justify-between mb-3">
        <div>
          <UiFooterLabel
            :label="$t('listedPrice')"
            :xs="true"
          />
          <UiHeaderLabel
            :label="`$${item.currentPrice}`"
            :white="true"
          />
        </div>
        <div class="text-right">
          <UiFooterLabel
            :label="$t('marketValue')"
            :xs="true"
          />
          <p class="text-green-400 font-bold text-xl">
            ${{ item.marketValue }}
          </p>
        </div>
      </div>

      <!-- Profit Margin -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-1">
          <UiFooterLabel
            :label="$t('profitMargin')"
            :xs="true"
          />
          <span class="text-green-400 font-medium">{{ item.profitMargin }}%</span>
        </div>
        <div class="w-full bg-slate-700 rounded-full h-2">
          <div
            class="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${Math.min(item.profitMargin, 100)}%` }"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div class="flex">
          <UiFooterLabel
            :label="$t('condition:')"
            :xs="true"
          />
          <UiFooterLabel
            :label="item.condition"
            :xs="true"
            :white="true"
          />
        </div>

        <div class="flex">
          <UiFooterLabel
            :label="$t('location:')"
            :xs="true"
          />
          <UiFooterLabel
            :label="item.location"
            :xs="true"
            :white="true"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2">
        <UiButton
          :primary="true"
          class="flex-1"
          @on-click="viewItem(item)"
        >
          {{ $t('viewItem') }}
        </UiButton>
      </div>
    </div>
  </UiDefaultContainer>
</template>

<script setup lang="ts">
import type { FlipperItem } from '~/types/FlipType'

defineProps<{ item: FlipperItem }>()

// Methods
const getMarketplaceBadgeClass = (marketplace: string) => {
  const classes = {
    eBay: 'bg-blue-600 text-white',
    Facebook: 'bg-blue-500 text-white',
    Mercari: 'bg-red-500 text-white',
    Poshmark: 'bg-pink-500 text-white',
  }
  return classes[marketplace as keyof typeof classes] || 'bg-gray-600 text-white'
}

const getProfitBadgeClass = (profit: number) => {
  if (profit > 100) return 'bg-green-600 text-white'
  if (profit > 50) return 'bg-green-500 text-white'
  if (profit > 25) return 'bg-yellow-500 text-black'
  return 'bg-orange-500 text-white'
}

const getTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}

const viewItem = (item: FlipperItem) => {
  window.open('#', '_blank')

  // Add to recent activity
  recentActivity.value.unshift({
    id: Math.random().toString(36).substr(2, 9),
    message: `Viewed "${item.name}" on ${item.marketplace}`,
    timestamp: new Date(),
  })

  // Keep only last 10 activities
  if (recentActivity.value.length > 10) {
    recentActivity.value = recentActivity.value.slice(0, 10)
  }
}

const addToWatchlist = (item: FlipperItem) => {
  item.isWatched = !item.isWatched

  recentActivity.value.unshift({
    id: Math.random().toString(36).substr(2, 9),
    message: `${item.isWatched ? 'Added to' : 'Removed from'} watchlist: "${item.name}"`,
    timestamp: new Date(),
  })

  if (recentActivity.value.length > 10) {
    recentActivity.value = recentActivity.value.slice(0, 10)
  }
}
</script>
