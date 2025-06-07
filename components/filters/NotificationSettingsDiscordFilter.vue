<template>
  <FiltersNotificationSettingItem
    v-model="webhookUrl"
    label-aria="Discord Webhook URL"
    :filter="model!"
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

const model = defineModel<Filter>()

const webhookUrl = ref(model.value!.notificationTarget || '')
const isValidWebhook = ref(true)

watch(() => model.value!.notificationTarget,
  () => { webhookUrl.value = model.value?.notificationTarget ?? '' })

const validateWebhook = () => {
  if (!webhookUrl.value) {
    isValidWebhook.value = true
    return
  }
  // validade the webhook URL format
  const discordWebhookPattern = /^https:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/\d{17,19}\/[\w-]+$/
  isValidWebhook.value = discordWebhookPattern.test(webhookUrl.value)

  if (isValidWebhook.value) {
    model.value!.notificationTarget = webhookUrl.value
    // store the webhook url for predefined values
    userStore.notificationSettings.discord.webhookUrl = webhookUrl.value
  }
}

watch(webhookUrl, (newValue) => {
  if (newValue) {
    validateWebhook()
  }
  else {
    isValidWebhook.value = true
    model.value!.notificationTarget = ''
  }
})
</script>
