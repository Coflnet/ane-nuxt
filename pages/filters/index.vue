<template>
  <div>
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Filters</h1>
        <p class="mt-2 text-slate-500 dark:text-slate-400">Manage your auction search filters</p>
      </div>
      <NuxtLink to="/filters/create"
        class="mt-4 md:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2">
        <PlusIcon class="w-5 h-5" />
        <span>Create Filter</span>
      </NuxtLink>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-6">
      <div class="p-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4 md:mb-0">Your Filters</h2>
          <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 hidden">
            <div class="relative">
              <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500"
                size="16" />
              <input type="text" placeholder="Search filters..."
                class="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
            </div>
            <select
              class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400">
              <option value="all">All Marketplaces</option>
              <option value="ebay">eBay</option>
              <option value="kleinanzeigen">eBay Kleinanzeigen</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="(filter, index) in filters" :key="index"
            class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div class="p-4">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h3 class="font-medium text-lg text-slate-900 dark:text-white">{{ filter.name }}</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">{{ filter.marketplace }}</p>
                </div>
                <div class="flex items-center space-x-1">
                  <button class="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700" title="Edit filter">
                    <EditIcon class="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              <div class="space-y-2 mb-4">
                <div v-if="filter.keywords.length > 0" class="flex flex-wrap gap-1">
                  <span v-for="(keyword, i) in filter.keywords" :key="i"
                    class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {{ keyword }}
                  </span>
                </div>

                <div v-if="filter.priceRange" class="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  <TagIcon class="w-4 h-4 mr-1" />
                  <span>{{ filter.priceRange }}</span>
                </div>

                <div v-if="filter.location" class="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  <MapPinIcon class="w-4 h-4 mr-1" />
                  <span>{{ filter.location }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <div class="flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    :class="filter.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'">
                    {{ filter.active ? 'Active' : 'Paused' }}
                  </span>
                  <span class="text-sm text-slate-500 dark:text-slate-400">{{ filter.matchCount }} matches</span>
                </div>
                <NuxtLink :to="`/auctions?filter=${filter.id}`"
                  class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                  View matches
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-center hidden">
      <nav class="inline-flex rounded-md shadow-sm">
        <button
          class="px-3 py-2 rounded-l-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
          <ChevronLeftIcon class="w-5 h-5" />
        </button>
        <button
          class="px-4 py-2 border-t border-b border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700">
          1
        </button>
        <button
          class="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          2
        </button>
        <button
          class="px-4 py-2 border-t border-b border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700">
          3
        </button>
        <button
          class="px-3 py-2 rounded-r-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
          <ChevronRightIcon class="w-5 h-5" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, TagIcon, MapPinIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
import { getFilters } from '~/src/api-client';

// Mock data for filters
const filters = ref([
  {
    id: 1,
    name: 'Photography Equipment',
    marketplace: 'eBay',
    keywords: ['camera', 'lens', 'tripod', 'DSLR'],
    priceRange: '$100 - $500',
    location: null,
    active: true,
    matchCount: 32
  },
  {
    id: 2,
    name: 'Mountain Bikes',
    marketplace: 'eBay Kleinanzeigen',
    keywords: ['mountain bike', 'MTB', 'hardtail', 'full suspension'],
    priceRange: '€300 - €1000',
    location: 'Within 50km of Berlin',
    active: true,
    matchCount: 18
  },
  {
    id: 3,
    name: 'Vintage Furniture',
    marketplace: 'eBay',
    keywords: ['mid century', 'vintage', 'retro', 'teak'],
    priceRange: '$50 - $300',
    location: null,
    active: false,
    matchCount: 24
  },
  {
    id: 4,
    name: 'Gaming Consoles',
    marketplace: 'eBay Kleinanzeigen',
    keywords: ['playstation', 'xbox', 'nintendo', 'console'],
    priceRange: '€100 - €400',
    location: 'Within 30km of Munich',
    active: true,
    matchCount: 15
  },
  {
    id: 5,
    name: 'Mechanical Keyboards',
    marketplace: 'eBay',
    keywords: ['mechanical keyboard', 'cherry mx', 'keycaps'],
    priceRange: '$50 - $200',
    location: null,
    active: true,
    matchCount: 9
  },
  {
    id: 6,
    name: 'Vinyl Records',
    marketplace: 'eBay Kleinanzeigen',
    keywords: ['vinyl', 'records', 'LP', '33rpm'],
    priceRange: '€5 - €50',
    location: 'Within 20km of Hamburg',
    active: true,
    matchCount: 41
  }
])


const userStore = useUserStore()

var apiToken = userStore.token;
apiToken = "Bearer " + apiToken;


async function loadFilters() {
  const response = await getFilters({
    composable: "$fetch",
    headers: { Authorization: apiToken },
  })
  console.log(response)



  response.map((i) => {
    var filtersHolder = {
      radius: '',
      keywords: [],
      priceRange: '',
    }

    i.filters?.map((i) => {
      if (i.name == "Radius") {
        return filtersHolder.radius = i.value ?? "";
      }
      if (i.name == "PriceRange") {
        return filtersHolder.priceRange = i.value ?? ""
      }
      if (i.name == "ContainsKeyWord") {
        return filtersHolder.keywords = JSON.parse(i.value ?? "")
      }
    })


    filters.value.push({
      matchCount: 35,
      id: i.id ?? 0,
      name: i.name ?? "",
      marketplace: i.target ?? "",
      keywords: filtersHolder.keywords,
      active: true,
      priceRange: filtersHolder.priceRange,
      location: filtersHolder.radius

    })
  })
}

onMounted(() => loadFilters())

</script>
