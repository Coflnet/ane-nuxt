<template>
  <UiGrid
    :grid-size="3"
    class="mb-6 hidden md:grid"
  >
    <StatContainer
      :stat="String(premiumSearches)"
      icon-color-circle="bg-indigo-900"
      icon-color="text-indigo-400"
      icon="tabler:filter"
      :label="$t('remainingPremiumSearches')"
    />

    <StatContainer
      :stat="String(matchedAuctions)"
      icon-color-circle="bg-purple-900"
      icon-color="text-purple-400"
      icon="tabler:tag"
      :label="$t('totalMatchedAuctions')"
    />

    <StatContainer
      :stat="String(notificationperHour)"
      icon-color-circle="bg-rose-900"
      icon-color="text-rose-400"
      icon="tabler:bell"
      :label="$t('auctionsPerHour')"
    />
  </UiGrid>
</template>

<script setup lang="ts">
import StatContainer from './StatContainer.vue'

defineProps<{
  premiumSearches: number
  matchedAuctions: number
  notificationperHour: number
}>()
</script>
