<template>
  <div>
    <div class="mb-8">
      <UiHeaderLabel :label="$t('matchedAuctions')" />
      <UiFooterLabel :label="$t('auctionMatchedToFilters')" />
    </div>
    <UiDefaultContainer class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="(auction, index) in loadedAuctions" :key="index"
          class="border border-slate-700 rounded-lg  hover:shadow-md transition-shadow">
          <AuctionsItem :auction="auction" />
        </div>
      </div>
      <AuctionsLoadingState :no-auctions="loadedAuctions.length === 0 && !loading" :loading="loading" />
    </UiDefaultContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'
import { useListingStore } from '@/stores/listing'
import type { FilterMatch } from '~/src/api-client'

const localePath = useLocalePath()
const listingStore = useListingStore()

const loadedAuctions = ref<FilterMatch[]>([])
const loading = ref(true)
const finished = ref(false)

async function loadMore() {
  if (loading.value || finished.value) {
    return
  }
  loading.value = true

  const [isNewAuctions, newAuctions] = await listingStore.loadMoreMatches(loadedAuctions.value)

  if (!isNewAuctions) {
    finished.value = true
  }
  else {
    loadedAuctions.value = newAuctions
  }

  loading.value = false
}

onMounted(async () => {
  await useUserStore().checkAuth(useFirebaseAuth()!)
  await listingStore.loadMatches()
  loadedAuctions.value = listingStore.recentMatches

  useInfiniteScroll(window, loadMore, {
    distance: 300, canLoadMore(_el) {
      // vueUse doesnt have a way to kill infinite scroll so I just used this work around for now
      // this will get continuously called until the page is refreshed though
      if (useRequestURL().pathname === localePath('/auctions'))
        return true
      return false
    },
  })
  loading.value = false
})
</script>
