<template>
  <UiDefaultContainer class="p-6 justify-center min-h-52">
    <UiHeaderLabel :label="$t('remainingSearches')" />
    <div class="flex flex-col h-full justify-center pb-4">
      <UiProgressBar
        :progress="usedSearches"
        :min="0"
        :max="currentSearches"
        :end-label="`Searches ${currentSearches}`"
        :indicator-text="`${$t('remainingRequests')} ${currentSearches - usedSearches}`"
      />
      <UiFooterLabel :label="daysRemaining == -1 ? $t('noReset') : $t('timeTillReset', daysRemaining)" />
    </div>
  </UiDefaultContainer>
</template>

<script setup lang="ts">
const currentSearches = ref(0)
const usedSearches = ref(0)
const daysRemaining = ref(0)

async function loadPremiumSearches() {
  const remainingSearchResult = await useUserStore().loadRemainingSearches()
  daysRemaining.value = remainingSearchResult.refreshData
  usedSearches.value = remainingSearchResult.remaining
  currentSearches.value = remainingSearchResult.total
}

onMounted(() => {
  loadPremiumSearches()
})
</script>
