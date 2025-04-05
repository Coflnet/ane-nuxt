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
              <AneTextField name="filter-name" placeholder="e.g., Photography Equipment" label="Filter Name"
                v-model="filter.name" />
            </div>

            <div>
              <label for="marketplace"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Marketplace</label>
              <select id="marketplace" v-model="filter.marketplace"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                required>
                <option value="">Select a marketplace</option>
                <option value="ebay">eBay</option>
                <option value="kleinanzeigen">eBay Kleinanzeigen</option>
              </select>
            </div>
          </div>

          <!-- Search Value Field -->
          <div>
            <AneTextField name="search-value" placeholder="e.g., Camera" label="Search Value"
              v-model="filter.searchValue" />
          </div>


          <!-- Keyword Input -->
          <FiltersKeywordFilter :filter="filter" />


          <!-- list all filters -->
          <div v-for="(option, index) in filterStore.getFilterOptions">

            <!-- Price Range -->
            <FiltersPriceRangeFilter :filter="filter" v-if="option.name == 'TotalCost'" />

            <!-- Radius -->
            <FiltersRadiusRangeFilter :filter="filter" v-if="option.name == 'Radius'" />

            <!-- Kleinanzeigen Kategorie -->
            <FiltersKleinanzeigenCategoryFilter :filter="filter"
              v-if="option.name === 'KleinanzeigenKategorie' && filter.marketplace == 'kleinanzeigen'"
              :options="option.value.options" />

            <FiltersBlacklistFilter :filter="filter" v-if="option.name == 'NotContainsKeyWord'" />
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
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftIcon, XIcon } from 'lucide-vue-next'
import type { ListingListener } from '~/src/api-client';


const userStore = useUserStore();
const filterStore = useFilterStore();

type NotificationType = 'discord' | 'email' | 'FireBase';

const filter = ref({
  name: '',
  marketplace: '',
  searchValue: '',
  totalCost: 0,
  searchRadius: null,
  commercialSeller: false,
  seller: '',
  keywords: [] as string[],
  blacklist: [] as string[],
  minPrice: 0,
  maxPrice: 100,
  currency: '€',
  location: '',
  radius: null,
  customFields: [] as any[],
  notificationType: 'none' as NotificationType, // Default to none
  notificationTarget: {
    'discord': '',
    'email': '',
    'FireBase': 'FireBase'
  }
})


async function saveFilter() {

  try {
    var target = ""
    if (filter.value.notificationType != 'discord') {
      target = filter.value.notificationTarget[filter.value.notificationType]
    }
    console.log(handleFilters())
    console.log(navigator.geolocation)

    const userId = userStore.getUser?.id
    if (!userId) {
      console.error("User ID not found")
      return
    }

    const listingListener: ListingListener = {
      name: filter.value.name,
      userId: userId,
      filters: handleFilters(),
      target: target,
    }

    await filterStore.createFilter(listingListener)
    console.log("created filter")

  } catch (e) {
    console.error(e)
  }

}

function handleFilters(): { name: string; value: any }[] {
  var filters: { name: string; value: any }[] = []

  filter.value.keywords.map((i) => { filters.push({ name: "ContainsKeyWord", value: i }) })
  filter.value.blacklist.map((i) => { filters.push({ name: "NotContainsKeyWord", value: i }) })
  if (filter.value.minPrice != 0 || filter.value.maxPrice) {
    filters.push({ name: "PriceRange", value: `${Number(filter.value.minPrice)}-${Number(filter.value.maxPrice)}` })
  }
  if (filter.value.marketplace != "") {
    filters.push({
      name: "IncludePlatforms",
      // dont ask me akwav uses 305 
      value: filter.value.marketplace == 'ebay' ? '305' : 'kleinanzeigen'
    })
  }
  if (filter.value.commercialSeller) {
    filters.push({ name: "CommercialSeller", value: true })
  }

  return filters
}

onMounted(async () => {
  await filterStore.loadFilterOptions();
  console.log(filterStore.getFilterOptions)
})
</script>
