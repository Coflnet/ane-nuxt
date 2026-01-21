<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm text-slate-400">
      <thead class="text-xs uppercase bg-slate-800/50 text-slate-300">
        <tr>
          <th class="px-6 py-4 rounded-tl-lg">Marketplace</th>
          <th class="px-6 py-4">Title</th>
          <th class="px-6 py-4 cursor-pointer hover:text-white" @click="$emit('sort', 'price')">
            Price 
            <Icon name="tabler:arrows-sort" class="inline w-4 h-4" />
          </th>
          <th class="px-6 py-4 cursor-pointer hover:text-white" @click="$emit('sort', 'date')">
            Date
            <Icon name="tabler:arrows-sort" class="inline w-4 h-4" />
          </th>
          <th class="px-6 py-4 rounded-tr-lg">Action</th>
        </tr>
      </thead>
      <tbody class="">
        <tr v-for="listing in listings" :key="listing.listingId || listing.id" class="border-b border-slate-700/50 hover:bg-slate-800/30">
          <td class="px-6 py-4 font-medium text-slate-200">
            <!-- Simple Marketplace Badge -->
             <span class="inline-flex items-center gap-2">
                {{ getMarketplaceName(listing.listingUrl) }}
             </span>
          </td>
          <td class="px-6 py-4">
            <a :href="listing.listingUrl" target="_blank" class="hover:text-blue-400 transition-colors line-clamp-1">
              {{ listing.title }}
            </a>
            <p class="text-xs text-slate-500 mt-1 line-clamp-1">{{ listing.description }}</p>
          </td>
          <td class="px-6 py-4 font-bold text-slate-200">
            {{ formatPrice(listing.price) }}
          </td>
          <td class="px-6 py-4">
            {{ formatDate(listing.postedAt) }}
          </td>
          <td class="px-6 py-4">
            <a
              :href="listing.listingUrl"
              target="_blank"
              class="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
            >
              View Deal <Icon name="tabler:external-link" class="w-3 h-3" />
            </a>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div v-if="listings.length === 0" class="p-8 text-center text-slate-500">
      No listings found for this product currently.
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  listings: any[]
}>()

defineEmits<{
  (e: 'sort', field: string): void
}>()

function formatPrice(amount: number) {
  if (!amount) return 'N/A'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('de-DE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getMarketplaceName(url?: string) {
  if (!url) return 'Unknown'
  try {
    const hostname = new URL(url).hostname
    return hostname.replace('www.', '').split('.')[0]
  } catch {
    return 'Web'
  }
}
</script>
