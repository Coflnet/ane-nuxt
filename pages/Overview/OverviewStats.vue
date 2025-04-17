<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ">
    <StatContainer :stat="String(filterCount)" iconColorCircle="bg-indigo-100 dark:bg-indigo-900"
      iconColor="text-indigo-600 dark:text-indigo-400" icon="tabler:filter" :label="$t('act')" />

    <StatContainer :stat="String(matchedAuctions)" iconColorCircle="bg-purple-100 dark:bg-purple-900"
      iconColor="text-purple-600 dark:text-purple-400" icon="tabler:tag" :label="$t('totalM')" />

    <StatContainer :stat="String(notificationperHour)" iconColorCircle="bg-rose-100 dark:bg-rose-900"
      iconColor="text-rose-600 dark:text-rose-400" icon="tabler:bell" :label="$t('apr')" />

  </div>
</template>

<script setup lang="ts">
import StatContainer from './StatContainer.vue';

defineProps<{
  filterCount: number;
  matchedAuctions: number;
  notificationperHour: number;
}>();

</script>
