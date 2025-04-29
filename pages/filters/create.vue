<template>
  <FiltersCreateHeader :is-new-filter="isNewFilter" />
  <UiDefaultContainer class="mb-6 p-6">
    <form @submit.prevent="saveFilter" class="space-y-6">
      <UiGrid :grid-size="2">
        <UiInput test-id="filter-name-input" :name="$t('filterName')" :placeholder="$t('nameEg')"
          :label="$t('filterName')" v-model="filter.name" />
        <UiDropdown id="marketplace" v-model="filter.marketplace" :options="[
          { value: 'all', label: $t('allMarket') },
          { value: 'Ebay', label: 'Ebay' },
          { value: 'Kleinanzeigen', label: 'Kleinanzeigen' },
        ]" :label="$t('marketplace')" />
      </UiGrid>


      <UiInput test-id="search-value-input" :name="$t('searchValue')" :placeholder="$t('cameraEg')"
        :label="$t('searchValue')" v-model="filter.searchValue" />

      <FiltersKeywordFilter :model-value="filter.keywords" :label="$t('searchKeywords')"
        :footer="$t('addKeyDescription')" :place-holder="$t('addKeywordPressEnter')" />
      <FiltersKeywordFilter :model-value="filter.blacklist" :label="$t('blackKeywords')"
        :footer="$t('addblacklistKeywords')" :place-holder="$t('addBlackListPressEnter')" />


      <!-- Dont worry about this, this whole system needs to get reworked by akwav -->
      <div v-for="(option, _index) in filterStore.getFilterOptions">
        <FiltersKleinanzeigenCategoryFilter :filter="filter"
          v-if="option.name === 'KleinanzeigenKategorie' && filter.marketplace == 'kleinanzeigen'"
          :options="option.value.options" />
      </div>

      <FiltersRadiusRangeFilter :filter="filter" />
      <FiltersNotificationSettingsFilter :filter="filter"></FiltersNotificationSettingsFilter>

      <FiltersCreateConfirmCreation :is-new-filter="isNewFilter" :saving="savingFilter" />
    </form>
  </UiDefaultContainer>

  <OverviewRecentMatchTable :matches :title="$t('auctionMatchedToFilters')" v-if="matches.length > 0" />
</template>

<script setup lang="ts">

import type { ListingListener } from '~/src/api-client';
import { debounce } from 'lodash';
import { getMessaging, getToken } from 'firebase/messaging'
import { useFirebaseApp } from 'vuefire'
import type { Filter } from '~/types/FilterType';


const filterStore = useFilterStore();
const userStore = useUserStore();
const firebaseApp = useFirebaseApp()
const savingFilter = ref(false)

const route = useRoute()


const isNewFilter = computed(() => {
  return route.query.id == "" || route.query.id == undefined
})


const matches = ref<Listing[]>([])
var filterTest = 0;

const filter = ref<Filter>({
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
  notificationType: 'Unknown',
  notificationTarget: ""
})

watch(filter, (_) => {
  console.log("Filter changed")
  debouncedTestFilter()
}, { deep: true })

const debouncedTestFilter = debounce(async () => {
  await testFilter()
}, 500)

async function testFilter() {
  filterTest++
  var currentTest = filterTest

  try {

    const f = await filterToCreate()
    if (!f) {
      push.error("Please fill out all required fields")
      return
    }
    const res = await filterStore.testFilter(f);
    if (res) {
      if (currentTest != filterTest) {
        return
      }
      matches.value = res.reverse();
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
    filter.value.notificationType = activeFilter.targetType ?? "Unknown"

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
          console.log(item.value)
          if (["Ebay", "Kleinanzeigen"].includes(item.value!)) {
            filter.value.marketplace = item.value!
            break;
          }
          filter.value.marketplace = "all"
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
  try {
    savingFilter.value = true
    const f = await filterToCreate()
    if (!f)
      return
    if (!savingFilter)
      return

    await filterStore.saveFilter(f)
    push.success("Filter successfully saved");
    navigateTo("/overview")
  } catch (e) {
    savingFilter.value = false
    push.error(`We ran into issue`)
  }
}

async function filterToCreate(): Promise<ListingListener | null> {
  if (radiusError.value) {
    return null;
  }

  var rawFilter = toRaw(filter.value);

  if (rawFilter.notificationType == 'FireBase') {
    rawFilter.notificationTarget = await connectPushNotifications()
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
    target: rawFilter.notificationTarget,
    targetType: rawFilter.notificationType as TargetType,
    filters: await handleFilters()
  }

  console.log(filterToCreate)

  return filterToCreate;
}

async function handleFilters(): Promise<{ name: string; value: any }[]> {
  var rawFilter = toRaw(filter.value);
  var filters: { name: string; value: any }[] = []

  if (rawFilter.minPrice != 0 || rawFilter.maxPrice || rawFilter.maxPrice == 0) {
    filters.push({ name: "PriceRange", value: `${Number(rawFilter.minPrice)}-${Number(rawFilter.maxPrice)}` })
  }
  console.log(rawFilter.marketplace)
  if (rawFilter.marketplace != "all") {
    filters.push({
      name: "IncludePlatforms",
      value: rawFilter.marketplace
    })
  } else {
    filters.push({
      name: "IncludePlatforms",
      value: "Ebay,Kleinanzeigen"
    })
  }
  if (rawFilter.commercialSeller) {
    filters.push({ name: "CommercialSeller", value: true })
  }
  if (rawFilter.zipcode != '' && rawFilter.marketplace != 'ebay') {
    const location = await handleSearchRadius()
    filters.push({ name: 'Radius', value: `${location[0]};${location[1]};${rawFilter.searchRadius};${rawFilter.zipcode}` })
    console.log(filters)
  }

  filters.push({ name: 'SearchTerm', value: rawFilter.searchValue })
  if (rawFilter.totalCost != 0) {
    filters.push({ name: 'TotalCost', value: `${rawFilter.totalCost}-${rawFilter.totalCost}` })
  }

  if (rawFilter.keywords.length != 0)
    filters.push({ name: "ContainsKeyWord", value: rawFilter.keywords.join(',') });

  if (rawFilter.blacklist.length != 0)
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

    // the api returns nothing if its not a valid zip code
    if (data2.length == 0) {
      push.error("Please enter a valid zip code")
      console.error("No data found for this zip code")
      savingFilter.value = false
      return ['', '']
    }
    return [data2[0].lat, data2[0].lon]
  } catch (error) {
    console.error('Error fetching country:', error);
    savingFilter.value = false
    push.error(`We ran into issue\n ${error}`)
  }
  return ['', '']
}

async function connectPushNotifications(): Promise<string> {
  const messaging = getMessaging(firebaseApp);
  // vapid key is meant to be public
  const token = await getToken(messaging, { vapidKey: 'BC2o4A75_oGlbklpFN4iVXjdZE3lg6Qci7EZg0NrsRAKyKmySam77NrlUAodBAzKhTECJGj-rgfdbQ0qzWUh9nU' })
  return token
}

onMounted(async () => {
  await Promise.allSettled([filterStore.loadFilterOptions(), filterStore.loadFilters()])
  loadEditParam();
})

</script>
