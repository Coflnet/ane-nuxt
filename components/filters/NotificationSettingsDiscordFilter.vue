<template>
  <FiltersNotificationSettingItem v-model="webhookUrl" :filter="filter" :config="{
    notificationType: 'DiscordWebhook',
    predefinedValue: userStore.notificationSettings.discord.webhookUrl,
    name: 'Discord',
    placeholder: $t('discordWebHookUrl'),
    icon: 'tabler:brand-discord',
    textInput: true
  }" :messages="{
    error: $t('invalidDiscordWebhook'),
    footer: $t('sendDiscordNotifications')
  }" :validation="{
    error: !isValidWebhook && !!webhookUrl
  }" />
</template>

<script setup lang='ts'>
import { ref, watch } from 'vue'
import type { Filter } from '~/types/FilterType';

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
  const discordWebhookPattern = /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/[0-9]{17,19}\/[a-zA-Z0-9_-]+$/
  isValidWebhook.value = discordWebhookPattern.test(webhookUrl.value)

  if (isValidWebhook.value)
    props.filter.notificationTarget = webhookUrl.value

}

watch(webhookUrl, (newValue) => {
  if (newValue) {
    validateWebhook()
  } else {
    isValidWebhook.value = true
    props.filter.notificationTarget = ''
  }
})

</script>
