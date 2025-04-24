<template>
  <FiltersNotificationSettingItem @item-selected="checkPushNotificationPermissions" :filter="filter" :config="{
    notificationType: 'FireBase',
    predefinedValue: '',
    name: $t('webPush'),
    icon: 'tabler:mail',
    textInput: false
  }" :messages="{
    footer: $t('browserNotifications'),
  }" />
</template>

<script setup lang='ts'>
import type { Filter } from '~/types/FilterType';

const props = defineProps<{ filter: Filter }>()


if (import.meta.client) {
  watch(() => props.filter.notificationType, async (newValue) => {
    if (newValue === 'FireBase') {
      // akwav request in his frontend had a - in it
      props.filter.notificationTarget = '-'
    }
  }, { immediate: true });
}

function checkPushNotificationPermissions() {
  if (import.meta.server)
    return false;

  console.log('Requesting persmissions')
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted')
      return;
    }
    push.error("Getting persmissions for push notification failed please try again\nIf this continues please contact support")
  })
}

</script>
