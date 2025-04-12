<template>
  <div>
    <div class="mb-8">
      <NuxtLink to="/filters"
        class="inline-flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4">
        <ArrowLeftIcon class="w-4 h-4 mr-1" />
        {{ $t('backFilt') }}
      </NuxtLink>
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white">{{ isNewFilter ? $t('crflt') : $t('editFilt') }}
      </h1>
      <p class="mt-2 text-slate-500 dark:text-slate-400">{{ isNewFilter ? $t('setnew') : $t('setUp') }}</p>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
      <div class="p-6">
        <form @submit.prevent="saveFilter" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <AneTextField :name="$t('filterName')" :placeholder="$t('nameEg')" :label="$t('filName')"
                v-model="filter.name" />
            </div>

            <div>
              <label for="marketplace" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{{
                $t('market') }}</label>
              <select id="marketplace" v-model="filter.marketplace"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                required>
                <option value="all">{{ $t('allMarket') }}</option>
                <option value="Ebay">eBay</option>;
                <option value="kleinanzeigen">eBay Kleinanzeigen</option>
              </select>
            </div>
          </div>

          <!-- Search Value Field -->
          <div>
            <AneTextField :name="$t('srchval')" :placeholder="$t('srchPlace')" :label="$t('srchVal')"
              v-model="filter.searchValue" />
          </div>
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

          <NotificationSettingsFilter :filter="filter"></NotificationSettingsFilter>
          <!-- Updated Blacklist Section with Confirmation -->

          <!-- Notification Channels section -->
          <div class="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <NuxtLink to="/filters"
              class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </NuxtLink>
            <button type="submit"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              {{ isNewFilter ? "Create Filter" : "Update Filter" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftIcon } from 'lucide-vue-next'
import NotificationSettingsFilter from '~/components/filters/NotificationSettingsFilter.vue';

const filterStore = useFilterStore();

const route = useRoute()

export type TargetType = 'Unknown' | 'FireBase' | 'DiscordWebhook' | 'Email' | 'WhatsApp';

const isNewFilter = computed(() => {
  return route.query.id == "" || route.query.id == undefined
})

const filter = ref({
  name: '',
  marketplace: 'all',
  searchValue: '',
  totalCost: 0,
  zipcode: '',
  searchRadius: null as number | null,
  commercialSeller: false,
  seller: '',
  keywords: [] as string[],
  blacklist: [] as string[],
  minPrice: 0,
  maxPrice: 100,
  currency: '€',
  location: '',
  id: 0,
  customFields: [] as any[],
  notificationType: 'Unknown',
  notificationTarget: ""
})

const radiusError = ref(false)


async function loadEditParam() {
  if (isNewFilter.value) {
    return;
  }

  try {
    const cachedFilters = filterStore.getUserFilters;
    const currentId = Number(route.query.id ?? 0);

    let activeFilter = cachedFilters.find(i => Number(i.id ?? 0) === currentId)
      ?? filterStore.getUserFilterById(currentId);

    if (!activeFilter?.filters) {
      console.error("Filter not found");
      return;
    }

    filter.value.name = activeFilter.name ?? ""
    filter.value.id = activeFilter.id ?? 0

    activeFilter.filters.forEach(item => {
      switch (item.name) {
        case 'Radius': {
          const [_lat, _lon, radius] = item.value?.split?.(';') ?? ""
          filter.value.searchRadius = Number(radius ?? 0)
          break
        }
        case 'ContainsKeyWord':
          filter.value.keywords.push(item?.value!)
          break
        case 'NotContainsKeyWord':
          filter.value.blacklist.push(item.value!)
          break
        case 'PriceRange': {
          const [min, max] = item.value!.split('-')
          filter.value.minPrice = Number(min)
          filter.value.maxPrice = Number(max)
          break
        }
        case 'IncludePlatforms':
          filter.value.marketplace = item.value!.toLowerCase()
          break
        case 'CommercialSeller':
          filter.value.commercialSeller = Boolean(item.value)
          break
        case 'SearchTerm':
          filter.value.searchValue = item.value ?? ""
          break
        case 'TotalCost':
          filter.value.maxPrice = Number(item.value)
          break
      }
    })
  } catch (e) {
    console.error(e)
  }
}



async function saveFilter() {
  if (radiusError.value) {
    return
  }

  var rawFilter = toRaw(filter.value);
  var target = rawFilter.notificationTarget
  if (rawFilter.notificationType == 'FireBase') {
    rawFilter.notificationTarget = "-";
  }

  const filterToCreate = {
    name: rawFilter.name == "" ? rawFilter.searchValue : rawFilter.name,
    userId: '',
    id: filter.value.id,
    target: target,
    targetType: rawFilter.notificationType as TargetType,
    filters: await handleFilters()
  }

  await filterStore.saveFilter(filterToCreate)
  navigateTo("/overview")
}

async function handleFilters(): Promise<{ name: string; value: any }[]> {
  var rawFilter = toRaw(filter.value);
  var filters: { name: string; value: any }[] = []

  if (rawFilter.minPrice != 0 || rawFilter.maxPrice || rawFilter.maxPrice == 0) {
    filters.push({ name: "PriceRange", value: `${Number(rawFilter.minPrice)}-${Number(rawFilter.maxPrice)}` })
  }
  if (rawFilter.marketplace != "all") {
    filters.push({
      name: "IncludePlatforms",
      value: rawFilter.marketplace
    })
  }
  if (rawFilter.commercialSeller) {
    filters.push({ name: "CommercialSeller", value: true })
  }
  if (rawFilter.zipcode != '' && rawFilter.marketplace != 'ebay') {
    const location = await handleSearchRadius()
    filters.push({ name: 'Radius', value: `${location[0]};${location[1]};${rawFilter.searchRadius}` })
  }

  filters.push({ name: 'SearchTerm', value: rawFilter.searchValue })
  if (rawFilter.totalCost != 0) {
    filters.push({ name: 'TotalCost', value: rawFilter.totalCost })
  }

  filters.push({ name: "ContainsKeyWord", value: rawFilter.keywords.join(',') });
  filters.push({ name: "NotContainsKeyWord", value: rawFilter.blacklist.join(',') });
  return filters
}

async function handleSearchRadius(): Promise<[string, string]> {
  // If you are looking at this... I am sorry 
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    // const url = `https://nominatim.openstreetmap.org/search?postalcode=${filter.value.zipcode}&country=${data.country_name}&format=json`;
    // const response2 = await fetch(url);
    // const data2 = await response2.json();
    return [data.latitude, data.longitude]
  } catch (error) {
    console.error('Error fetching country:', error);
  }
  return ['', '']
}

onMounted(async () => {
  await Promise.allSettled([filterStore.loadFilterOptions(), filterStore.loadFilters()])
  loadEditParam();
})

</script>
