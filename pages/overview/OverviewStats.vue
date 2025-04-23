<template>
  <UiGrid :grid-size="3" class="mb-6">
    <StatContainer :stat="String(filterCount)" iconColorCircle="bg-indigo-900" iconColor="text-indigo-400"
      icon="tabler:filter" :label="$t('activeFilters')" />

    <StatContainer :stat="String(matchedAuctions)" iconColorCircle="bg-purple-900" iconColor="text-purple-400"
      icon="tabler:tag" :label="$t('totalMatchedAuctions')" />

    <StatContainer :stat="String(notificationperHour)" iconColorCircle="bg-rose-900" iconColor="text-rose-400"
      icon="tabler:bell" :label="$t('auctionsPerHour')" />
  </UiGrid>

</template>

<script setup lang="ts">
import StatContainer from './StatContainer.vue';

defineProps<{
  filterCount: number;
  matchedAuctions: number;
  notificationperHour: number;
}>();

</script>
