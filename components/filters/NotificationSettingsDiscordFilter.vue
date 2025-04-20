<template>
  <div
    class="flex items-start p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
    <div class="flex items-center h-5">
      <input id="discord-notification" v-model="props.filter.notificationType" type="radio" value="DiscordWebhook"
        @click="props.filter.notificationTarget = userStore.notificationSettings.discord.webhookUrl"
        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
    </div>
    <label for="discord-notification" class="ml-3 flex flex-col">
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
          <MessageSquareIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p class="font-medium text-slate-900 dark:text-white">Discord</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ $t('sendDiscordNotifications') }}
          </p>
        </div>
      </div>
      <div v-if="props.filter.notificationType === 'DiscordWebhook'" class="mt-3 ml-11">
        <UiInput type="string" :placeholder="$t('discordWebHookUrl')" v-model="webhookUrl"
          :radiusError="!isValidWebhook && webhookUrl" />
        <p v-if="!isValidWebhook && webhookUrl" class="mt-1 text-sm text-red-500">
          {{ $t('invalidDiscordWebhook') }}
        </p>
      </div>
    </label>
  </div>
</template>

<script setup lang='ts'>
import { ref, watch } from 'vue'
import { MessageSquareIcon } from 'lucide-vue-next'
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
  const discordWebhookPattern = /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/[0-9]{17,19}\/[a-zA-Z0-9_-]+$/
  isValidWebhook.value = discordWebhookPattern.test(webhookUrl.value)

  if (isValidWebhook.value) {
    props.filter.notificationTarget = webhookUrl.value
  }
}

watch(webhookUrl, (newValue) => {
  if (newValue) {
    validateWebhook()
  } else {
    isValidWebhook.value = true
    props.filter.notificationTarget = ''
  }
})

watch(() => props.filter.notificationTarget, (newValue) => {
  if (newValue !== webhookUrl.value) {
    webhookUrl.value = newValue || ''
    validateWebhook()
  }
}, { immediate: true })
</script>
