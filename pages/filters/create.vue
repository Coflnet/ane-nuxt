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
              </select>
            </div>
          </div>

          <!-- Search Value Field -->
          <div>
            <label for="search-value" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Search
              Value</label>
            <input id="search-value" v-model="filter.searchValue" type="text" placeholder="Enter search term"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            <div class="flex flex-row w-full gap-x-8">
              <div class="w-full ">
                <label for="search-radius"
                  class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Search Radius</label>
                <div class="flex items-center gap-2">
                  <input id="search-radius" v-model="filter.searchRadius" type="number" placeholder="e.g., 10" min="0"
                    :class="[
                      'w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400',
                      radiusError ? 'border-rose-500 dark:border-rose-500' : 'border-slate-300 dark:border-slate-600'
                    ]" />
                </div>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Search radius around you (requires zip code)
                </p>
                <p v-if="radiusError" class="mt-1 text-xs text-rose-500">
                  Please enter a zip code when using search radius
                </p>
              </div>
              <div class="w-full">
                <label for="zip-code"
                  class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Zip-code</label>
                <div class="flex items-center gap-2">
                  <input id="search-radius" v-model="filter.zipcode" type="text" placeholder="e.g., xxxxx" min="0"
                    :class="[
                      'w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400',
                      radiusError ? 'border-rose-500 dark:border-rose-500' : 'border-slate-300 dark:border-slate-600'
                    ]" />
                </div>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Your zip code</p>
              </div>
            </div>


            <div>
              <label for="commercial-seller"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Commercial Seller</label>
              <div
                class="flex items-center h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
                <input id="commercial-seller" v-model="filter.commercialSeller" type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded" />
                <label for="commercial-seller" class="ml-2 text-sm text-slate-900 dark:text-white">
                  Only show commercial sellers
                </label>
              </div>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Filter listings from business accounts</p>
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

          <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
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
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Cost</label>
              <div class="flex items-center space-x-2">
                <div class="relative w-full">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">{{
                    filter.currency }}</span>
                  <input v-model="filter.totalCost" type="number" placeholder="Min"
                    class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
                </div>
              </div>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Cost after all fees and taxes</p>
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

          <!-- Updated Blacklist Section with Confirmation -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Blacklist Keywords</label>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <input v-model="newBlacklist" @keydown.enter.prevent="confirmBlacklist" type="text"
                  placeholder="Add blacklist keyword and press Enter"
                  class="flex-grow px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
                <button type="button" @click="confirmBlacklist"
                  class="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                  Add
                </button>
              </div>

              <!-- Confirmation Dialog -->
              <div v-if="blacklistConfirmation.show"
                class="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600">
                <p class="text-sm text-slate-700 dark:text-slate-300 mb-2">
                  Add "<span class="font-medium">{{ blacklistConfirmation.value }}</span>" to blacklist?
                </p>
                <div class="flex gap-2">
                  <button type="button" @click="addBlacklist"
                    class="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm">
                    Confirm
                  </button>
                  <button type="button" @click="cancelBlacklist"
                    class="px-3 py-1 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors text-sm">
                    Cancel
                  </button>
                </div>
              </div>

              <!-- Blacklist Items -->
              <div class="flex flex-wrap gap-2 mt-2">
                <div v-for="(keyword, index) in filter.blacklist" :key="index"
                  class="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                  {{ keyword }}
                  <button type="button" @click="removeBlacklist(index)"
                    class="ml-1 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200">
                    <XIcon class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Add keywords to exclude from search results</p>
          </div>

          <!-- Notification Channels section -->
          <div>
            <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-3">Notification Channels</h3>
            <div class="space-y-4">
              <div
                class="flex items-start p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <div class="flex items-center h-5">
                  <input id="discord-notification" v-model="filter.notificationType" type="radio" value="DiscordWebhook"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                </div>
                <label for="discord-notification" class="ml-3 flex flex-col">
                  <div class="flex items-center">
                    <div
                      class="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
                      <MessageSquareIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p class="font-medium text-slate-900 dark:text-white">Discord</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400">Send notifications to your Discord channel
                      </p>
                    </div>
                  </div>
                  <div v-if="filter.notificationType === 'DiscordWebhook'" class="mt-3 ml-11">
                    <input v-model="filter.notificationTarget" type="text" placeholder="Enter Discord webhook URL"
                      class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
                  </div>
                </label>
              </div>

              <div
                class="flex items-start p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <div class="flex items-center h-5">
                  <input id="email-notification" v-model="filter.notificationType" type="radio" value="Email"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                </div>
                <label for="email-notification" class="ml-3 flex flex-col">
                  <div class="flex items-center">
                    <div
                      class="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
                      <MailIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p class="font-medium text-slate-900 dark:text-white">Email</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400">Send notifications to your email address</p>
                    </div>
                  </div>
                  <div v-if="filter.notificationType === 'Email'" class="mt-3 ml-11">
                    <input v-model="filter.notificationTarget" type="email" placeholder="Enter email address"
                      class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
                  </div>
                </label>
              </div>

              <div
                class="flex items-center p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <div class="flex items-center h-5">
                  <input id="push-notification" v-model="filter.notificationType" type="radio" value="FireBase"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                </div>
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

              <div
                class="flex items-center p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <div class="flex items-center h-5">
                  <input id="none-notification" v-model="filter.notificationType" type="radio" value="none"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                </div>
                <label for="none-notification" class="ml-3 flex items-center">
                  <div class="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-3">
                    <XIcon class="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p class="font-medium text-slate-900 dark:text-white">None</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Don't send any notifications</p>
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
            <button type="submit" @click="saveFilter()"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Create Filter
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Field Modal -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ArrowLeftIcon, XIcon, MessageSquareIcon, MailIcon, BellIcon } from 'lucide-vue-next'
import { addFilter, testFilter } from '~/src/api-client'

const newKeyword = ref('')
const newBlacklist = ref('')
const showAddFieldModal = ref(false)
const radiusError = ref(false)

// Blacklist confirmation state
const blacklistConfirmation = ref({
  show: false,
  value: ''
})

const userStore = useUserStore()

var apiToken = userStore.token;
apiToken = "Bearer " + apiToken;

export type TargetType = 'Unknown' | 'FireBase' | 'DiscordWebhook' | 'Email' | 'WhatsApp';
const filter = ref({
  name: '',
  marketplace: '',
  searchValue: '',
  totalCost: 0,
  zipcode: '',
  searchRadius: null,
  commercialSeller: false,
  seller: '',
  keywords: [] as string[],
  blacklist: [] as string[],
  minPrice: 0,
  maxPrice: 0,
  currency: '€',
  location: '',
  radius: null,
  customFields: [] as any[],
  notificationType: 'Unknown' as TargetType, // Default to none
  notificationTarget: "-"
})

watch([() => filter.value.searchRadius, () => filter.value.zipcode], ([newRadius, newZipcode]) => {
  validateRadiusAndZipcode(newRadius, newZipcode)
}, { immediate: true })

function validateRadiusAndZipcode(radius: any, zipcode: string) {
  if (radius && !zipcode) {
    radiusError.value = true
  } else {
    radiusError.value = false
  }
}

function addKeyword() {
  if (newKeyword.value.trim()) {
    filter.value.keywords.push(newKeyword.value.trim())
    newKeyword.value = ''
  }
}

function removeKeyword(index: number) {
  filter.value.keywords.splice(index, 1)
}


function confirmBlacklist() {
  const value = newBlacklist.value.trim()
  if (value) {
    blacklistConfirmation.value = {
      show: true,
      value: value
    }
  }
}

function addBlacklist() {
  if (blacklistConfirmation.value.value) {
    filter.value.blacklist.push(blacklistConfirmation.value.value)
    newBlacklist.value = ''
    blacklistConfirmation.value.show = false
  }
}

function cancelBlacklist() {
  blacklistConfirmation.value.show = false
}

function removeBlacklist(index: number) {
  filter.value.blacklist.splice(index, 1)
}

async function saveFilter() {
  // Check for radius error before saving
  if (radiusError.value) {
    // Prevent form submission if there's an error
    return
  }

  var target = filter.value.notificationTarget
  if (filter.value.notificationType == 'FireBase') {
    filter.value.notificationTarget = "-";
  }

  console.log(apiToken)

  testFilter({
    composable: '$fetch',
    headers: { Authorization: apiToken }, body: {
      name: "",
      userId: '',
      target: target,
      targetType: filter.value.notificationType,
      filters: await handleFilters()
    }
  });
  addFilter({
    composable: '$fetch',
    headers: { Authorization: apiToken },
    body: {
      name: filter.value.name,
      userId: '',
      target: target,
      targetType: filter.value.notificationType,
      filters: await handleFilters()
    }
  })
}

async function handleFilters(): Promise<{ name: string; value: any }[]> {
  var filters: { name: string; value: any }[] = []

  if (filter.value.zipcode != '') {
    const location = await handleSearchRadius()
    filters.push({ name: 'Radius', value: `${location[0]};${location[1]};${filter.value.radius}` })
  }
  filter.value.keywords.map((i) => { filters.push({ name: "ContainsKeyWord", value: i }) })
  filter.value.blacklist.map((i) => { filters.push({ name: "NotContainsKeyWord", value: i }) })
  if (filter.value.minPrice != 0 || filter.value.maxPrice) {
    filters.push({ name: "PriceRange", value: `${Number(filter.value.minPrice)}-${Number(filter.value.maxPrice)}` })
  }
  if (filter.value.marketplace != "") {
    filters.push({
      name: "IncludePlatforms",
      value: filter.value.marketplace == 'ebay' ? 'Ebay' : 'Kleinanzeigen'
    })
  }
  if (filter.value.commercialSeller) {
    filters.push({ name: "CommercialSeller", value: true })
  }
  filters.push({ name: 'SearchTerm', value: filter.value.searchValue })
  return filters
}

async function handleSearchRadius(): Promise<[string, string]> {
  // If you are looking at this... I am sorry 
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${filter.value.zipcode}&country=${data.country_name}&format=json`;
    const response2 = await fetch(url);
    const data2 = await response2.json();
    console.log(data2, "hi")
    return [data2.lat, data2.lon]
  } catch (error) {
    console.error('Error fetching country:', error);
  }
  return ['', '']
}

</script>
