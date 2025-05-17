<template>
  <div>
    <UiHeaderLabel :label="$t('notificationsChannels')" />
    <div class="space-y-4 mt-4">
      <FiltersNotificationSettingsDiscordFilter v-model="model" />
      <FiltersNotificationSettingsMailFilter v-model="model" />
      <FiltersNotificationSettingsWebPushFilter v-model="model" />
      <FiltersNotificationSettingsNoneFilter v-model="model" />
    </div>
  </div>
</template>

<script setup lang='ts'>
import type { Filter } from '~/types/FilterType'

const model = defineModel<Filter>()
</script>
