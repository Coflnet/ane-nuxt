<template>
  <FiltersNotificationSettingItem
    :filter="model!"
    label-aria="Web Push Notifications"
    :config="{
      notificationType: 'FireBase',
      predefinedValue: '',
      name: $t('webPush'),
      icon: 'tabler:mail',
      textInput: false,
    }"
    :messages="{
      footer: $t('browserNotifications'),
    }"
    @item-selected="checkPushNotificationPermissions"
  />
</template>

<script setup lang='ts'>
import type { Filter } from '~/types/FilterType'

const model = defineModel<Filter>()

if (import.meta.client) {
  watch(() => model.value!.notificationType, async (newValue) => {
    if (newValue === 'FireBase') {
      // akwav request in his frontend had a - in it
      model.value!.notificationTarget = '-'
    }
  }, { immediate: true })
}

function checkPushNotificationPermissions() {
  if (import.meta.server)
    return false

  if (useUserStore().isWebView) {
    window.sendToFlutter({
      action: 'requestNotifications',
    })
    if (useUserStore().notificationToken == '') {
      window.sendToFlutter({
        action: 'generateNotificationToken',
      })
    }
    return
  }

  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted')
      return
    }
    push.error('Getting persmissions for push notification failed please try again\nIf this continues please contact support')
  })
}
</script>
