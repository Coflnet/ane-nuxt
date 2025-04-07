<template>
  <div class="overflow-auto min-h-[100vh] max-h-[calc(100vh-4rem)]" ref="container">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Matched Auctions</h1>
        <p class="mt-2 text-slate-500 dark:text-slate-400">Auctions that match your filters</p>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md mb-6">
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="(auction, index) in loadedAuctions" :key="index"
            class="border border-slate-200 dark:border-slate-700 rounded-lg  hover:shadow-md transition-shadow">
            <div class="relative">
              <img :src="auction.image ?? ''" alt="Auction thumbnail" class="w-full h-48 object-cover" />
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
              </div>

              <div class="flex items-center justify-between mb-3">
                <p class="font-bold text-xl text-slate-900 dark:text-white">{{ auction.price }}</p>
              </div>

              <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <span class="text-sm text-slate-500 dark:text-slate-400">Matched filter:</span>
                  <span class="ml-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">{{ auction.matchedAt
                    }}</span>
                </div>
                <a :href="auction.url ?? ''" target="_blank"
                  class="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200">
                  View
                  <ExternalLinkIcon class="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loadedAuctions.length === 0 && !loading" class="py-12 text-center">
          <SearchXIcon class="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-1">No auctions found</h3>
          <p class="text-slate-500 dark:text-slate-400">Try adjusting your filters or check back later</p>
        </div>

        <div v-if="loading" class="text-center text-sm text-slate-500 py-6">
          Loading more auctions...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExternalLinkIcon, SearchXIcon } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'
import { useListingStore } from '@/stores/listing'

const listingStore = useListingStore()

const selectedFilter = ref('all')
const sortOption = ref('newest')
const loadedAuctions = ref<MatchItem[]>([])
const page = ref(1)
const loading = ref(false)
const finished = ref(false)

const container = ref<HTMLElement | null>(null)

async function loadMore() {
  console.log('loading more')
  if (loading.value || finished.value) return
  loading.value = true

  const [isNewAuctions, newAuctions] = await listingStore.loadMoreMatches(loadedAuctions.value)

  if (!isNewAuctions || newAuctions.length === 0) {
    finished.value = true
  } else {
    loadedAuctions.value.push(...newAuctions)
  }

  loading.value = false
}

onMounted(async () => {
  await listingStore.loadMatches()
  loadedAuctions.value = [...listingStore.recentMatches]
})

useInfiniteScroll(container, loadMore, { distance: 100 })
</script>
