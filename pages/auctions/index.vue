<template>
  <div class="mb-8">
    <UiHeaderLabel :label="$t('matchedAuctions')" />
    <UiFooterLabel :label="$t('auctionMatchedToFilters')" />
  </div>
  <UiDefaultContainer class="p-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="(auction, index) in loadedAuctions" :key="index"
        class="border border-slate-200 dark:border-slate-700 rounded-lg  hover:shadow-md transition-shadow">
        <AuctionItem :auction="auction" />
      </div>
    </div>
    <AuctionsLoadingState :no-auctions="loadedAuctions.length === 0 && !loading" :loading="loading" />
  </UiDefaultContainer>

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'
import { useListingStore } from '@/stores/listing'
import AuctionsLoadingState from './AuctionsLoadingState.vue'
import { UiDefaultContainer } from '#components'
import AuctionItem from './AuctionItem.vue'

const listingStore = useListingStore()

const loadedAuctions = ref<MatchItem[]>([])
const loading = ref(false)
const finished = ref(false)


async function loadMore() {
  if (loading.value || finished.value) {
    return
  }
  loading.value = true

  const [isNewAuctions, newAuctions] = await listingStore.loadMoreMatches(loadedAuctions.value)

  if (!isNewAuctions) {
    finished.value = true
  } else {
    loadedAuctions.value = newAuctions
  }

  loading.value = false
}

onMounted(async () => {
  await listingStore.loadMatches()
  loadedAuctions.value = listingStore.recentMatches
  useInfiniteScroll(window, loadMore, { distance: 300 })
})

</script>
