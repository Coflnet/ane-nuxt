<template>
  <!-- Notification Channels section -->
  <div>
    <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-3">{{ $t('notiChan') }}</h3>
    <div class="space-y-4">

      <FiltersNotificationSettingsDiscordFilter :filter="props.filter" />

      <FiltersNotificationSettingsMailFilter :filter="props.filter" />

      <FiltersNotificationSettingsWebPushFilter :filter="props.filter" />

      <FiltersNotificationSettingsNoneFilter :filter="props.filter" />
    </div>
  </div>
</template>

<script setup lang='ts'>
const props = defineProps({
  filter: {
    type: Object,
    required: true
  }
})
</script>
