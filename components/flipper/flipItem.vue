<template>
  <div class="w-[340px] bg-gray-800/40 rounded-xl overflow-hidden shadow-lg border border-gray-700/30 hover:border-blue-500/30 transition-all duration-300 flex flex-col">
    <!-- Image -->
    <div class="relative h-[200px] bg-gray-900/50">
      <img
        v-if="primaryImageUrl"
        :src="primaryImageUrl"
        :alt="item.listing?.title ?? 'Flip'"
        class="w-full h-full object-contain"
      >
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-gray-500"
      >
        <Icon
          name="mdi:image-off"
          size="48"
        />
      </div>

      <!-- Profit Badge -->
      <div
        v-if="profit > 0"
        class="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg"
      >
        +{{ formattedProfit }}
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 flex flex-col flex-1">
      <div class="flex justify-between items-start mb-3 gap-2">
        <h3 class="text-white font-medium text-sm line-clamp-2 min-h-[2.5rem] flex-1">
          {{ item.listing?.title }}
        </h3>
        <div class="flex flex-col gap-1 shrink-0">
          <button
            @click="reportFlip"
            class="w-7 h-7 rounded-md bg-gray-700/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors"
            title="Report Flip"
          >
            <Icon name="mdi:flag-outline" size="14" />
          </button>
          <button
            @click="showReferences = !showReferences"
            class="w-7 h-7 rounded-md bg-gray-700/50 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 flex items-center justify-center transition-colors"
            title="Show References"
          >
            <Icon name="mdi:format-list-bulleted" size="14" />
          </button>
        </div>
      </div>

      <div class="space-y-2 mb-4">
        <div class="flex justify-between items-center">
          <span class="text-gray-400 text-xs">{{ $t('product.listedPrice') }}</span>
          <span class="text-white font-bold text-lg">{{ formattedPrice }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-400 text-xs">{{ $t('product.marketValue') }}</span>
          <span class="text-green-400 font-semibold">{{ formattedMedian }}</span>
        </div>
      </div>

      <!-- Category & Location -->
      <div class="flex items-center gap-2 mb-4 text-xs text-gray-400 flex-wrap">
        <span
          v-if="item.foundAt"
          class="bg-gray-700/50 px-2 py-1 rounded"
        >
          {{ formatDistanceToNow(new Date(item.foundAt), { addSuffix: true }) }}
        </span>
        <span
          v-if="listingLocation"
          class="bg-gray-700/50 px-2 py-1 rounded"
        >
          📍 {{ listingLocation }}
        </span>
      </div>

      <!-- References List -->
      <div v-if="showReferences && item.recentSells?.length" class="mb-4 bg-gray-900/50 rounded p-2 max-h-40 overflow-y-auto">
        <div class="text-xs font-semibold text-gray-400 mb-2 border-b border-gray-700 pb-1">Found References ({{ item.recentSells.length }})</div>
        <div class="flex flex-col gap-2">
          <a
            v-for="(sell, idx) in item.recentSells"
            :key="idx"
            :href="getSellUrl(sell)"
            target="_blank"
            class="flex justify-between items-center text-xs hover:bg-gray-700/50 p-1 rounded"
          >
            <span class="text-blue-400 truncate max-w-[120px]" :title="sell.title">{{ sell.title }}</span>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-green-400">{{ formatPrice(sell.price) }}</span>
              <span class="text-gray-500" v-if="sell.endTime">{{ formatDistanceToNow(new Date(sell.endTime), { addSuffix: true }) }}</span>
            </div>
          </a>
        </div>
      </div>

      <div class="mt-auto">
        <a
          :href="listingUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200 text-sm"
        >
          {{ $t('product.viewDeal') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Flip } from '~/src/api-client/types.gen'
import { formatDistanceToNow } from 'date-fns'

const props = defineProps<{
  item: Flip
}>()

const profit = computed(() => props.item.potentialProfit ?? 0)
const primaryImageUrl = computed(() => props.item.listing?.imageUrls?.[0] ?? '')

const showReferences = ref(false)

const reportFlip = () => {
  const reportId = Math.random().toString(36).substring(2, 10).toUpperCase()
  console.log(`[REPORT ${reportId}] Flip Data:`, JSON.stringify(props.item, null, 2))
  navigator.clipboard.writeText(reportId)
  alert(`Report generated and ID (${reportId}) copied to clipboard.\nCheck the console for JSON data.`)
}

const formatPrice = (price: number | undefined) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price ?? 0)
}

const getSellUrl = (sell: any) => {
  if (!sell?.id) return '#'
  // Assuming platform is mainly eBay right now
  return `https://ebay.de/itm/${sell.id}`
}

const listingLocation = computed(() => {
  const listing = props.item.listing
  return [listing?.locality, listing?.region, listing?.street]
    .filter((value): value is string => Boolean(value))
    .join(', ')
})

const listingUrl = computed(() => {
  const listing = props.item.listing
  if (!listing?.id) {
    return '#'
  }

  switch (listing.platform) {
    case 'Kleinanzeigen':
      return `https://www.kleinanzeigen.de/s-anzeige/copy/${listing.id}-1-1`
    case 'Ebay':
      return `https://ebay.de/itm/${listing.id}`
    case 'Facebook':
      return `https://www.facebook.com/marketplace/item/${listing.id}`
    case 'Willhaben':
      return `https://www.willhaben.at/iad/${listing.id.replace(/^\//, '')}`
    case 'Shpock':
      return `https://www.shpock.com/de-de/i/${listing.id}`
    case 'Marktplaats':
      return listing.id.includes('/')
        ? `https://www.marktplaats.nl${listing.id}`
        : `https://www.marktplaats.nl/v/redirect/redirect/${listing.id}-test`
    default:
      return `https://ane.deals/auctions?platform=${String(listing.platform ?? 'unknown').toLowerCase()}&id=${encodeURIComponent(listing.id)}`
  }
})

const formattedProfit = computed(() => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(profit.value)
})

const formattedPrice = computed(() => {
  const price = props.item.listing?.price ?? 0
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
})

const formattedMedian = computed(() => {
  const median = props.item.medianPrice ?? 0
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(median)
})
</script>
