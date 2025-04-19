<template>
  <CreateHeader :is-new-filter="isNewFilter" />
  <UiDefaultContainer class="mb-6 p-6">
    <form @submit.prevent="saveFilter" class="space-y-6">
      <UiGrid :grid-size="2">
        <UiInput :name="$t('filterName')" :placeholder="$t('nameEg')" :label="$t('filterName')" v-model="filter.name" />
        <UiDropdown id="marketplace" :model-value="filter.marketplace" :options="[
          { value: 'all', label: $t('allMarket') },
          { value: 'Ebay', label: 'eBay' },
          { value: 'kleinanzeigen', label: 'eBay Kleinanzeigen' },
        ]" :label="$t('marketplace')" />
      </UiGrid>


      <UiInput :name="$t('searchValue')" :placeholder="$t('cameraEg')" :label="$t('searchValue')"
        v-model="filter.searchValue" />

      <FiltersKeywordFilter :model-value="filter.keywords" :label="$t('keywords')" :footer="$t('addKeyDescription')"
        :place-holder="$t('addKeywordPressEnter')" />
      <FiltersKeywordFilter :model-value="filter.blacklist" :label="$t('blackKeywords')"
        :footer="$t('addblacklistKeywords')" :place-holder="$t('addBlackListPressEnter')" />


      <!-- Dont worry about this, this whole system needs to get reworked by akwav -->
      <div v-for="(option, _index) in filterStore.getFilterOptions">
        <FiltersKleinanzeigenCategoryFilter :filter="filter"
          v-if="option.name === 'KleinanzeigenKategorie' && filter.marketplace == 'kleinanzeigen'"
          :options="option.value.options" />
      </div>

      <FiltersRadiusRangeFilter :filter="filter" />
      <NotificationSettingsFilter :filter="filter"></NotificationSettingsFilter>

      <ConfirmCreation :is-new-filter="isNewFilter" />

    </form>
  </UiDefaultContainer>

  <GeneralMatchTable :matches />
</template>

<script setup lang="ts">
import type { ListingListener } from '~/src/api-client';
import { debounce } from 'lodash';

const filterStore = useFilterStore();
const userStore = useUserStore();

const route = useRoute()

export type TargetType = 'Unknown' | 'FireBase' | 'DiscordWebhook' | 'Email' | 'WhatsApp';

const isNewFilter = computed(() => {
  return route.query.id == "" || route.query.id == undefined
})

const matches = ref<Listing[]>([])

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

watch(filter, (_) => {
  debouncedTestFilter()
}, { deep: true })

const debouncedTestFilter = debounce(async () => {
  await testFilter()
}, 500)

async function testFilter() {

  try {

    const f = await filterToCreate()
    if (!f) {
      push.error("Please fill out all required fields")
      return
    }
    const res = await filterStore.testFilter(f);
    if (res) {
      matches.value = res;
    }
  } catch (e) {
    console.error(e);
    matches.value = [];
  }
}

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
          const [_lat, _lon, radius, zipcode] = item.value?.split?.(';') ?? ""
          filter.value.searchRadius = Number(radius ?? 0)
          filter.value.zipcode = zipcode ?? ""
          break
        }
        case 'ContainsKeyWord':
          if (item.value == "") break;
          item?.value?.split(',').forEach((keyword: string) => {
            filter.value.keywords.push(keyword)
          })
          break
        case 'NotContainsKeyWord':
          if (item.value == "") break;
          item?.value?.split(',').forEach((keyword: string) => {
            filter.value.blacklist.push(keyword)
          })
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
          const [min, _max] = item.value!.split('-')
          filter.value.totalCost = Number(min)
          break
      }
    })
  } catch (e) {
    console.error(e)
    push.error(`We ran into issue\n ${e}`)
  }
}


async function saveFilter() {
  const f = await filterToCreate()
  if (!f)
    return
  return;
  await filterStore.saveFilter(filterToCreate)
  push.success("Filter successfully saved");
  navigateTo("/overview")
}

async function filterToCreate(): Promise<ListingListener | null> {
  if (radiusError.value) {
    return null;
  }

  var rawFilter = toRaw(filter.value);
  var target = rawFilter.notificationTarget
  if (rawFilter.notificationType == 'FireBase') {
    rawFilter.notificationTarget = "-";
  }

  if (rawFilter.notificationType == 'DiscordWebhook') {
    userStore.notificationSettings.discord.webhookUrl = rawFilter.notificationTarget
  }

  if (rawFilter.notificationType == 'Email') {
    userStore.notificationSettings.email.address = rawFilter.notificationTarget
  }

  const filterToCreate = {
    name: rawFilter.name == "" ? rawFilter.searchValue : rawFilter.name,
    userId: '',
    id: filter.value.id,
    target: target,
    targetType: rawFilter.notificationType as TargetType,
    filters: await handleFilters()
  }

  return filterToCreate;
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
    filters.push({ name: 'Radius', value: `${location[0]};${location[1]};${rawFilter.searchRadius};${rawFilter.zipcode}` })
  }

  filters.push({ name: 'SearchTerm', value: rawFilter.searchValue })
  if (rawFilter.totalCost != 0) {
    filters.push({ name: 'TotalCost', value: `${rawFilter.totalCost}-${rawFilter.totalCost}` })
  }

  if (rawFilter.keywords.length != 0)
    filters.push({ name: "ContainsKeyWord", value: rawFilter.keywords.join(',') });

  if (rawFilter.blacklist.length == 0)
    filters.push({ name: "NotContainsKeyWord", value: rawFilter.blacklist.join(',') });
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
    return [data2[0].lat, data2[0].lon]
  } catch (error) {
    console.error('Error fetching country:', error);
    push.error(`We ran into issue\n ${error}`)
  }
  return ['', '']
}

onMounted(async () => {
  await Promise.allSettled([filterStore.loadFilterOptions(), filterStore.loadFilters()])
  loadEditParam();
})

</script>
