<template>
  <FiltersNotificationSettingItem :filter="filter" :config="{
    notificationType: 'FireBase',
    predefinedValue: '',
    name: $t('webPush'),
    icon: 'tabler:mail'
  }" :messages="{
    footer: $t('browserNotifications'),
  }" />
</template>

<script setup lang='ts'>
import type { Filter } from '~/types/FilterType';

defineProps<{ filter: Filter }>()

</script>
