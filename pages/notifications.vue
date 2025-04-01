<template>
  <div>
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Notification Settings</h1>
        <p class="mt-2 text-slate-500 dark:text-slate-400">Configure how you receive auction notifications</p>
      </div>
      <button @click="saveSettings"
        class="mt-4 md:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        :disabled="isSaving">
        <SaveIcon v-if="!isSaving" class="w-5 h-5" />
        <span v-if="isSaving" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
        <span>{{ isSaving ? 'Saving...' : 'Save Settings' }}</span>
      </button>
    </div>

    <div v-if="successMessage"
      class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
      {{ successMessage }}
    </div>

    <div v-if="errorMessage"
      class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
      {{ errorMessage }}
    </div>

    <div v-if="userStore.isLoadingSettings" class="py-12 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p class="mt-2 text-slate-500 dark:text-slate-400">Loading notification settings...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Discord Webhook -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <MessageSquareIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-slate-900 dark:text-white">Discord</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">Receive notifications in your Discord server</p>
              </div>
            </div>
            <div class="flex items-center">
              <label class="inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="settings.discord.enabled" class="sr-only peer">
                <div
                  class="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600">
                </div>
              </label>
            </div>
          </div>

          <div v-if="settings.discord.enabled" class="space-y-4">
            <div>
              <label for="discord-webhook"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Webhook URL</label>
              <input id="discord-webhook" v-model="settings.discord.webhookUrl" type="text"
                placeholder="https://discord.com/api/webhooks/..."
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Create a webhook in your Discord server settings and paste the URL here
              </p>
            </div>

            <div>
              <label for="discord-channel"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Channel Name
                (optional)</label>
              <input id="discord-channel" v-model="settings.discord.channelName" type="text"
                placeholder="e.g., #auctions"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notification
                Format</label>
              <div class="flex items-center space-x-4">
                <label class="inline-flex items-center">
                  <input type="radio" v-model="settings.discord.format" value="detailed"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                  <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Detailed</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" v-model="settings.discord.format" value="compact"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                  <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Compact</span>
                </label>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button @click="testDiscordWebhook"
                class="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center space-x-2"
                :disabled="!settings.discord.webhookUrl || isTestingDiscord">
                <span v-if="isTestingDiscord"
                  class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 dark:border-indigo-400"></span>
                <span>{{ isTestingDiscord ? 'Sending...' : 'Test Webhook' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Email Notifications -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <MailIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-slate-900 dark:text-white">Email</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">Receive notifications via email</p>
              </div>
            </div>
            <div class="flex items-center">
              <label class="inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="settings.email.enabled" class="sr-only peer">
                <div
                  class="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600">
                </div>
              </label>
            </div>
          </div>

          <div v-if="settings.email.enabled" class="space-y-4">
            <div>
              <label for="email-address" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email
                Address</label>
              <input id="email-address" v-model="settings.email.address" type="email" placeholder="your@email.com"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Frequency</label>
              <select v-model="settings.email.frequency"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400">
                <option value="instant">Instant (as they happen)</option>
                <option value="hourly">Hourly Digest</option>
                <option value="daily">Daily Digest</option>
              </select>
            </div>

            <div class="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button @click="testEmailNotification"
                class="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center space-x-2"
                :disabled="!settings.email.address || isTestingEmail">
                <span v-if="isTestingEmail"
                  class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 dark:border-indigo-400"></span>
                <span>{{ isTestingEmail ? 'Sending...' : 'Send Test Email' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Web Push Notifications -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <BellIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-slate-900 dark:text-white">Web Push</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">Receive browser notifications</p>
              </div>
            </div>
            <div class="flex items-center">
              <label class="inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="settings.webPush.enabled" class="sr-only peer">
                <div
                  class="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600">
                </div>
              </label>
            </div>
          </div>

          <div v-if="settings.webPush.enabled" class="space-y-4">
            <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div class="flex items-center">
                <div class="flex-shrink-0 mr-3">
                  <ComputerIcon class="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p class="text-sm text-slate-700 dark:text-slate-300">
                    <span class="font-medium">This browser</span>
                    <span v-if="settings.webPush.subscribed"
                      class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Subscribed
                    </span>
                    <span v-else
                      class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Not Subscribed
                    </span>
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {{ settings.webPush.subscribed ?
                      'You will receive notifications on this device' :
                      'Subscribe to receive notifications on this device' }}
                  </p>
                </div>
              </div>

              <div class="mt-4">
                <button @click="toggleWebPushSubscription"
                  class="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  {{ settings.webPush.subscribed ? 'Unsubscribe' : 'Subscribe' }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notification
                Types</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input type="checkbox" v-model="settings.webPush.notifyNewMatches"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded" />
                  <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">New auction matches</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" v-model="settings.webPush.notifyPriceChanges"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded" />
                  <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Price changes</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" v-model="settings.webPush.notifyEndingSoon"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded" />
                  <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Auctions ending soon</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { MessageSquareIcon, MailIcon, BellIcon, SaveIcon, ComputerIcon } from 'lucide-vue-next'
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()

// Create a deep copy of the notification settings to avoid directly modifying the store
const settings = ref(JSON.parse(JSON.stringify(userStore.notificationSettings)))

// UI state
const isSaving = ref(false)
const isTestingDiscord = ref(false)
const isTestingEmail = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Load user's notification settings
onMounted(async () => {
  if (userStore.isAuthenticated && !userStore.notificationSettings.email.address) {
    await userStore.fetchNotificationSettings()
    // Update local settings with the fetched ones
    settings.value = JSON.parse(JSON.stringify(userStore.notificationSettings))
  }
})

// Save notification settings
async function saveSettings() {
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await userStore.updateNotificationSettings(settings.value)

    if (result.success) {
      successMessage.value = 'Notification settings saved successfully!'
    } else {
      errorMessage.value = result.error || 'Failed to save notification settings'
    }
  } catch (error) {
    console.error('Error saving notification settings:', error)
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isSaving.value = false
  }
}

// Test Discord webhook
async function testDiscordWebhook() {
  if (!settings.value.discord.webhookUrl) return

  isTestingDiscord.value = true
  errorMessage.value = ''

  try {
    // Save current settings to the store first
    await userStore.updateNotificationSettings(settings.value)

    // Test the webhook
    const result = await userStore.testDiscordWebhook()

    if (result.success) {
      successMessage.value = result.message
    } else {
      errorMessage.value = result.error || 'Failed to send test message to Discord'
    }
  } catch (error) {
    console.error('Error testing Discord webhook:', error)
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isTestingDiscord.value = false
  }
}

// Test email notification
async function testEmailNotification() {
  if (!settings.value.email.address) return

  isTestingEmail.value = true
  errorMessage.value = ''

  try {
    // Save current settings to the store first
    await userStore.updateNotificationSettings(settings.value)

    // Test the email notification
    const result = await userStore.testEmailNotification()

    if (result.success) {
      successMessage.value = result.message
    } else {
      errorMessage.value = result.error || 'Failed to send test email'
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isTestingEmail.value = false
  }
}

// Toggle web push subscription
async function toggleWebPushSubscription() {
  try {
    // const result = await userStore.toggleWebPushSubscription()
    // if (result.success) {
    //   settings.value.webPush.subscribed = result.subscribed
    //   successMessage.value = result.message
    // } else {
    //   errorMessage.value = result.error || 'Failed to update web push subscription'
    // }
  } catch (error) {
    console.error('Error toggling web push subscription:', error)
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  }
}
</script>
