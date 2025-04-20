<template>
  <div>
    <UiHeaderLabel :label="$t('notificationsChannels')" />
    <div class="space-y-4 mt-4">
      <FiltersNotificationSettingsDiscordFilter :filter="props.filter" />
      <FiltersNotificationSettingsMailFilter :filter="props.filter" />
      <FiltersNotificationSettingsNoneFilter :filter="props.filter" />
    </div>
  </div>
</template>

<script setup lang='ts'>
import type { Filter } from '~/types/FilterType';

const props = defineProps<{ filter: Filter }>()
</script>
