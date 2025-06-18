<template>
  <div>
    <FiltersCreateHeader :is-new-filter="isNewFilter" />
    <UiDefaultContainer class="mb-6 p-6">
      <form @submit.prevent="saveFilter">
        <FiltersSearchValueMarketplaceFilter v-model="filter" />

        <FiltersPriceConditionFilter v-model="filter" />
        <FiltersCreateCountrySection :model-value="filter" />

        <!-- Dont worry about this, this whole system needs to get reworked by akwav -->
        <div v-for="(option, _index) in filterStore.getFilterOptions">
          <FiltersKleinanzeigenCategoryFilter
            v-if="option.name === 'KleinanzeigenKategorie' && filter.marketplace == 'kleinanzeigen'"
            :filter="filter"
            :options="option.value.options"
          />
        </div>
        <UiExpandOption class="mt-1">
          <FiltersKeywordFilter
            class="my-4"
            :model-value="filter.blacklist"
            :label="$t('blackKeywords')"
            :footer="$t('addblacklistKeywords')"
            :place-holder="$t('addBlackListPressEnter')"
          />
        </UiExpandOption>
        <FiltersNotificationSettingsFilter v-model="filter" />

        <FiltersCreateConfirmCreation
          :is-new-filter="isNewFilter"
          :saving="savingFilter"
        />
      </form>
    </UiDefaultContainer>

    <OverviewRecentMatchTable
      v-if="matches.length > 0"
      :matches
      :title="$t('auctionMatchedToFilters')"
    />
  </div>
</template>

<script setup lang="ts">
import lodash from 'lodash'
import { getMessaging, getToken } from 'firebase/messaging'
import { useFirebaseApp } from 'vuefire'
import type { FilterMatch, ListingListener } from '~/src/api-client'
import type { Filter } from '~/types/FilterType'
import { constructOptionsFromString, detectLocationNA, filterFreeMarketplaces, marketplaces, usMarketplaces, valididateAllMarketplace } from '~/constants/CreateFilterConstants'

const { debounce } = lodash

const { t } = useI18n()

const filterStore = useFilterStore()
const userStore = useUserStore()
const firebaseApp = useFirebaseApp()
const savingFilter = ref(false)

const localePath = useLocalePath()

const route = useRoute()

const isNewFilter = computed(() => {
  return route.query.id == '' || route.query.id == undefined
})

const matches = ref<FilterMatch[]>([])

const filter = ref<Filter>({
  name: '',
  marketplace: 'all',
  searchValue: '',
  totalCost: 0,
  zipcode: '',
  searchRadius: 100,
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
  notificationTarget: '',
  country: 'EU,US,GB',
  condition: '',
  deliveryMethod: '',
  frequency: '',
})

watch([filter], (_) => {
  debouncedTestFilter()
}, { deep: true })

const debouncedTestFilter = debounce(async () => {
  await testFilter()
}, 500)

async function testFilter() {
  if (filter.value.searchValue == '')
    return
  try {
    const f = await filterToCreate()

    if (!f)
      return
    const res = await filterStore.testFilter(f)
    if (res) {
      // this is required because recnet match container is used for both this the test endpoint and overview table
      // test endpoint return listing object which has no listener id (filter) and no match date
      // while recent matches return FilterMatch object
      matches.value = res.map((i) => {
        return { matchedAt: i.foundAt, listenerId: 0, listingData: i }
      })
    }
  }
  catch (e) {
    console.error(e)
    matches.value = []
  }
}

const radiusError = ref(false)

async function loadEditParam() {
  if (isNewFilter.value) {
    return
  }

  try {
    const cachedFilters = filterStore.getUserFilters
    const currentId = Number(route.query.id ?? 0)

    const activeFilter = cachedFilters.find(i => Number(i.id ?? 0) === currentId)
      ?? filterStore.getUserFilterById(currentId)

    if (!activeFilter?.filters) {
      console.error('Filter not found')
      return
    }

    filter.value.notificationTarget = activeFilter.target ?? ''
    filter.value.name = activeFilter.name ?? ''
    filter.value.id = activeFilter.id ?? 0
    filter.value.notificationType = activeFilter.targetType ?? 'Unknown'

    activeFilter.filters.forEach((item) => {
      switch (item.name) {
        case 'Radius': {
          const [_lat, _lon, radius, zipcode] = item.value?.split?.(';') ?? ''
          filter.value.searchRadius = Number(radius ?? 0)
          filter.value.zipcode = zipcode ?? ''
          break
        }
        case 'ContainsKeyWord':
          if (item.value == '') break
          item?.value?.split(',').forEach((keyword: string) => {
            filter.value.keywords.push(keyword)
          })
          break
        case 'NotContainsKeyWord':
          if (item.value == '') break
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
        case 'IncludePlatforms': {
          // construct the selected marketplaces from the string to test if it is all marketplaces selected
          console.log(item.value)
          const constuctedArray = constructOptionsFromString(item.value ?? '')
          if (valididateAllMarketplace(constuctedArray)) {
            filter.value.marketplace = 'all'
            console.log ('break')
            break
          }
          filter.value.marketplace = item.value ?? ''
          console.log(filter.value.marketplace, ' hi')
          break
        }
        case 'CommercialSeller':
          filter.value.commercialSeller = Boolean(item.value)
          break
        case 'SearchTerm':
          filter.value.searchValue = item.value ?? ''
          break
        case 'Condition':
          filter.value.condition = item.value ?? ''
          break
        case 'DeliveryMethod':
          filter.value.deliveryMethod = item.value ?? ''
          break
        case 'TotalCost': {
          const [min, _max] = item.value!.split('-')
          filter.value.totalCost = Number(min)
          break
        }
        case 'Frequency':
          filter.value.frequency = item.value ?? ''
          break
        case 'Country':
          filter.value.country = item.value ?? ''
      }
    })
  }
  catch (e) {
    console.error(e)
    push.error(`${t('weRanIntoAnError')}\n ${e}`)
  }
}

async function saveFilter() {
  try {
    savingFilter.value = true
    const f = await filterToCreate()

    if (!f) {
      console.log('aborting')
      return
    }
    await filterStore.saveFilter(f)
    push.success('Filter successfully saved')
    navigateTo(localePath('/overview'))
  }
  catch (e) {
    savingFilter.value = false
    console.error(e)
    push.error(t('weRanIntoAnError'))
  }
  finally {
    savingFilter.value = false
  }
}

async function filterToCreate(): Promise<ListingListener | null> {
  if (radiusError.value) {
    return null
  }

  const rawFilter = toRaw(filter.value)

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
    name: rawFilter.searchValue,
    userId: '',
    id: filter.value.id,
    target: rawFilter.notificationTarget,
    targetType: rawFilter.notificationType as TargetType,
    filters: await handleFilters(),
  }

  return filterToCreate
}

async function handleFilters(): Promise<{ name: string, value: any }[]> {
  const rawFilter = toRaw(filter.value)
  const filters: { name: string, value: any }[] = []

  // 'EU,US,GB' is the default value
  if (rawFilter.country != 'EU,US,GB')
    filters.push({ name: 'Country', value: rawFilter.country })

  if (rawFilter.frequency != '')
    filters.push({ name: 'Frequency', value: rawFilter.frequency })

  if (rawFilter.minPrice != 0 || rawFilter.maxPrice || rawFilter.maxPrice == 0)
    filters.push({ name: 'PriceRange', value: `${Number(rawFilter.minPrice)}-${Number(rawFilter.maxPrice)}` })

  if (rawFilter.condition != '')
    filters.push({ name: 'Condition', value: rawFilter.condition })

  if (rawFilter.deliveryMethod != '')
    filters.push({ name: 'DeliveryMethod', value: rawFilter.deliveryMethod })

  if (rawFilter.marketplace != 'all') {
    filters.push({ name: 'IncludePlatforms', value: rawFilter.marketplace })
  }
  else {
    // input marketplace depending on location
    const isUs = await detectLocationNA()
    const marketplacesArray = filterFreeMarketplaces(isUs ? usMarketplaces : marketplaces)
    filters.push({ name: 'IncludePlatforms', value: marketplacesArray.map(m => m.value).join(',') })
  }

  if (rawFilter.commercialSeller)
    filters.push({ name: 'CommercialSeller', value: true })

  if (rawFilter.zipcode != '' && rawFilter.marketplace != 'ebay') {
    const location = await handleSearchRadius()
    filters.push({ name: 'Radius', value: `${location[0]};${location[1]};${rawFilter.searchRadius};${rawFilter.zipcode}` })
  }

  filters.push({ name: 'SearchTerm', value: rawFilter.searchValue })
  if (rawFilter.totalCost != 0)
    filters.push({ name: 'TotalCost', value: `${rawFilter.totalCost}-${rawFilter.totalCost}` })

  if (rawFilter.keywords.length != 0)
    filters.push({ name: 'ContainsKeyWord', value: rawFilter.keywords.join(',') })

  if (rawFilter.blacklist.length != 0)
    filters.push({ name: 'NotContainsKeyWord', value: rawFilter.blacklist.join(',') })
  return filters
}

async function handleSearchRadius(): Promise<[string, string]> {
  // If you are looking at this... I am sorry
  try {
    const locationData = await getLocation(
      {
        path: { zip: filter.value.zipcode },
        composable: '$fetch',
      },
    )

    if (locationData.lat == 0 && locationData.lon == 0) {
      push.error(t('invalidZipCode'))
      radiusError.value = true
      return ['', '']
    }

    return [String(locationData.lat), String(locationData.lon)]
  }
  catch (error) {
    console.error('Error fetching country:', error)
    savingFilter.value = false
    push.error(`${t('issueGettingLocationData')}\n ${error}`)
  }
  return ['', '']
}

async function connectPushNotifications(): Promise<string> {
  const messaging = getMessaging(firebaseApp)
  // vapid key is meant to be public
  const token = await getToken(messaging, { vapidKey: 'BC2o4A75_oGlbklpFN4iVXjdZE3lg6Qci7EZg0NrsRAKyKmySam77NrlUAodBAzKhTECJGj-rgfdbQ0qzWUh9nU' })
  return token
}

onMounted(async () => {
  await useUserStore().checkAuth(useFirebaseAuth()!)
  await Promise.allSettled([filterStore.loadFilters()])
  await loadEditParam()
})

useSeoMeta({
  title: () => t('aneCreate'),
  ogTitle: () => t('aneCreate'),
  description: () => t('createDescription'),
  ogDescription: () => t('createDescription'),
})
</script>
