<template>
  <div>
    <div class="mb-8">
      <NuxtLink to="/filters"
        class="inline-flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4">
        <ArrowLeftIcon class="w-4 h-4 mr-1" />
        Back to filters
      </NuxtLink>
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Create Filter</h1>
      <p class="mt-2 text-slate-500 dark:text-slate-400">Set up a new auction search filter</p>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
      <div class="p-6">
        <form @submit.prevent="saveFilter" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="filter-name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Filter
                Name</label>
              <input id="filter-name" v-model="filter.name" type="text" placeholder="e.g., Photography Equipment"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                required />
            </div>

            <div>
              <label for="marketplace"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Marketplace</label>
              <select id="marketplace" v-model="filter.marketplace"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                required>
                <option value="">Select a marketplace</option>
                <option value="ebay">eBay</option>
                <option value="ebay-kleinanzeigen">eBay Kleinanzeigen</option>
                <option value="all">All Marketplaces</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Keywords</label>
            <div
              class="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
              <div v-for="(keyword, index) in filter.keywords" :key="index"
                class="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                {{ keyword }}
                <button type="button" @click="removeKeyword(index)"
                  class="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200">
                  <XIcon class="w-4 h-4" />
                </button>
              </div>

              <div class="relative flex-grow">
                <input v-model="newKeyword" @keydown.enter.prevent="addKeyword" type="text"
                  placeholder="Add keyword and press Enter"
                  class="w-full px-3 py-1 border-0 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-0" />
              </div>
            </div>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Add keywords that describe what you're looking
              for</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price Range</label>
              <div class="flex items-center space-x-2">
                <div class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">{{
                    filter.currency }}</span>
                  <input v-model="filter.minPrice" type="number" placeholder="Min"
                    class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
                </div>
                <span class="text-slate-500 dark:text-slate-400">-</span>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">{{
                    filter.currency }}</span>
                  <input v-model="filter.maxPrice" type="number" placeholder="Max"
                    class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
                </div>
              </div>
            </div>

            <div>
              <label for="currency"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency</label>
              <select id="currency" v-model="filter.currency"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400">
                <option value="$">USD ($)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
              </select>
            </div>
          </div>

          <div v-if="filter.marketplace === 'ebay-kleinanzeigen'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="location"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
              <input id="location" v-model="filter.location" type="text" placeholder="e.g., Berlin"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
            </div>

            <div>
              <label for="radius" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Radius
                (km)</label>
              <input id="radius" v-model="filter.radius" type="number" placeholder="e.g., 50"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Blacklist Keywords</label>
            <div
              class="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
              <div v-for="(keyword, index) in filter.blacklist" :key="index"
                class="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                {{ keyword }}
                <button type="button" @click="removeBlacklist(index)"
                  class="ml-1 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200">
                  <XIcon class="w-4 h-4" />
                </button>
              </div>

              <div class="relative flex-grow">
                <input v-model="newBlacklist" @keydown.enter.prevent="addBlacklist" type="text"
                  placeholder="Add blacklist keyword and press Enter"
                  class="w-full px-3 py-1 border-0 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-0" />
              </div>
            </div>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Add keywords to exclude from search results</p>
          </div>

          <div>
            <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-3">Notification Channels</h3>
            <div class="space-y-4">
              <div
                class="flex items-center p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <input id="discord-notification" v-model="filter.notifications.discord" type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded" />
                <label for="discord-notification" class="ml-3 flex items-center">
                  <div
                    class="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
                    <MessageSquareIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p class="font-medium text-slate-900 dark:text-white">Discord</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Send notifications to your Discord channel</p>
                  </div>
                </label>
              </div>

              <div
                class="flex items-center p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <input id="email-notification" v-model="filter.notifications.email" type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded" />
                <label for="email-notification" class="ml-3 flex items-center">
                  <div
                    class="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
                    <MailIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p class="font-medium text-slate-900 dark:text-white">Email</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Send notifications to your email address</p>
                  </div>
                </label>
              </div>

              <div
                class="flex items-center p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <input id="push-notification" v-model="filter.notifications.push" type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded" />
                <label for="push-notification" class="ml-3 flex items-center">
                  <div
                    class="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
                    <BellIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p class="font-medium text-slate-900 dark:text-white">Web Push</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Send browser push notifications</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <NuxtLink to="/filters"
              class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </NuxtLink>
            <button type="submit"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Create Filter
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowLeftIcon, XIcon, MessageSquareIcon, MailIcon, BellIcon } from 'lucide-vue-next'

const newKeyword = ref('')
const newBlacklist = ref('')

const filter = ref({
  name: '',
  marketplace: '',
  keywords: [],
  blacklist: [],
  minPrice: null,
  maxPrice: null,
  currency: '€',
  location: '',
  radius: null,
  notifications: {
    discord: true,
    email: true,
    push: false
  }
})

function addKeyword() {
  if (newKeyword.value.trim()) {
    filter.value.keywords.push(newKeyword.value.trim())
    newKeyword.value = ''
  }
}

function removeKeyword(index) {
  filter.value.keywords.splice(index, 1)
}

function addBlacklist() {
  if (newBlacklist.value.trim()) {
    filter.value.blacklist.push(newBlacklist.value.trim())
    newBlacklist.value = ''
  }
}

function removeBlacklist(index) {
  filter.value.blacklist.splice(index, 1)
}

function saveFilter() {
  // Here you would typically send the filter data to your API
  console.log('Saving filter:', filter.value)
  // After saving, redirect to the filters page
  // navigateTo('/filters')
}
</script>
