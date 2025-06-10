<template>
  <UiDefaultContainer class="p-6 justify-center min-h-52">
    <div class="w-full justify-between flex">
      <UiHeaderLabel :label="$t('usedSearches')" />
    </div>
    <div class="flex flex-col h-full justify-center pb-4">
      <UiProgressBar
        :progress="usedSearches"
        :min="0"
        :max="currentSearches"
        :end-label="$t('totalSearches', {amount:currentSearches})"
        :indicator-text="`${$t('remainingRequests')} ${currentSearches - usedSearches}`"
      />
      <UiLinkLabel href="/subscriptions">
        <UiFooterLabel :label="daysRemaining == 0 ? $t('noReset') : $t('timeTillReset', daysRemaining)" />
      </UiLinkLabel>
    </div>
  </UiDefaultContainer>
</template>

<script setup lang="ts">
const currentSearches = ref(0)
const usedSearches = ref(40)
const daysRemaining = ref(0)

async function loadPremiumSearches() {
  const remainingSearchResult = await useUserStore().loadRemainingSearches()
  daysRemaining.value = remainingSearchResult.refreshData
  currentSearches.value = remainingSearchResult.total
  usedSearches.value = remainingSearchResult.used
}

onMounted(() => {
  loadPremiumSearches()
})
</script>
