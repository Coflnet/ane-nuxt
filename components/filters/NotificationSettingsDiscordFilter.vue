<template>
  <FiltersNotificationSettingItem
    v-model="webhookUrl"
    :filter="filter"
    :config="{
      notificationType: 'DiscordWebhook',
      predefinedValue: userStore.notificationSettings.discord.webhookUrl,
      name: 'Discord',
      placeholder: $t('discordWebHookUrl'),
      icon: 'tabler:brand-discord',
      textInput: true,
    }"
    :messages="{
      error: $t('invalidDiscordWebhook'),
      footer: $t('sendDiscordNotifications'),
    }"
    :validation="{
      error: !isValidWebhook && !!webhookUrl,
    }"
  />
</template>

<script setup lang='ts'>
import { ref, watch } from 'vue'
import type { Filter } from '~/types/FilterType'

const userStore = useUserStore()

const props = defineProps<{ filter: Filter }>()

const webhookUrl = ref(props.filter.notificationTarget || '')
const isValidWebhook = ref(true)

const validateWebhook = () => {
  if (!webhookUrl.value) {
    isValidWebhook.value = true
    return
  }
  // validade the webhook URL format
  const discordWebhookPattern = /^https:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/\d{17,19}\/[\w-]+$/
  isValidWebhook.value = discordWebhookPattern.test(webhookUrl.value)

  if (isValidWebhook.value) {
    // eslint-disable-next-line vue/no-mutating-props
    props.filter.notificationTarget = webhookUrl.value
    // store the webhook url for predefined values
    console.log('hihihi')
    userStore.notificationSettings.discord.webhookUrl = webhookUrl.value
  }
}

watch(webhookUrl, (newValue) => {
  if (newValue) {
    validateWebhook()
  }
  else {
    isValidWebhook.value = true
    props.filter.notificationTarget = ''
  }
})
</script>
