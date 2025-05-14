<template>
  <div>
    <FiltersCreateHeader :is-new-filter="isNewFilter" />
    <UiDefaultContainer class="mb-6 p-6">
      <form
        class="space-y-6"
        @submit.prevent="saveFilter"
      >
        <UiGrid :grid-size="2">
          <UiInput
            v-model="filter.searchValue"
            :name="$t('searchValue')"
            :placeholder="$t('cameraEg')"
            :label="$t('searchValue')"
          />
          <UiMultiSelect
            v-model="selectedMarketplaces"
            :options="marketplaces"
            :label="$t('marketplaces')"
          />
        </UiGrid>

        <FiltersKeywordFilter
          :model-value="filter.keywords"
          :label="$t('searchKeywords')"
          :footer="$t('addKeyDescription')"
          :place-holder="$t('addKeywordPressEnter')"
        />

        <FiltersKeywordFilter
          :model-value="filter.blacklist"
          :label="$t('blackKeywords')"
          :footer="$t('addblacklistKeywords')"
          :place-holder="$t('addBlackListPressEnter')"
        />

        <FiltersCreateCountrySection :model-value="filter" />

        <!-- Dont worry about this, this whole system needs to get reworked by akwav -->
        <div v-for="(option, _index) in filterStore.getFilterOptions">
          <FiltersKleinanzeigenCategoryFilter
            v-if="option.name === 'KleinanzeigenKategorie' && filter.marketplace == 'kleinanzeigen'"
            :filter="filter"
            :options="option.value.options"
          />
        </div>

        <FiltersRadiusRangeFilter :filter="filter" />
        <NotificationSettingsFilter :filter="filter" />

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
import NotificationSettingsFilter from '~/components/filters/NotificationSettingsFilter.vue'
import type { FilterMatch, ListingListener } from '~/src/api-client'
import type { Filter } from '~/types/FilterType'
import { marketplaces } from '~/constants/Marketplaces'

const { debounce } = lodash

const { t } = useI18n()

const filterStore = useFilterStore()
const userStore = useUserStore()
const firebaseApp = useFirebaseApp()
const savingFilter = ref(false)
const selectedMarketplaces = ref<{ value: string, label: string }[]>([{ value: 'all', label: 'allMarket' }])

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
  notificationTarget: '',
  country: t('selectedCountry'),
  internationalShipping: false,
})

watch([filter, selectedMarketplaces], (_) => {
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

    if (!f) {
      push.error('Please fill out all required fields')
      return
    }
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
        case 'IncludePlatforms':
          console.log(item.value)
          if (['Ebay', 'Kleinanzeigen'].includes(item.value!)) {
            filter.value.marketplace = item.value!
            break
          }
          filter.value.marketplace = 'all'
          break
        case 'CommercialSeller':
          filter.value.commercialSeller = Boolean(item.value)
          break
        case 'SearchTerm':
          filter.value.searchValue = item.value ?? ''
          break
        case 'TotalCost': {
          const [min, _max] = item.value!.split('-')
          filter.value.totalCost = Number(min)
          break
        }
      }
    })
  }
  catch (e) {
    console.error(e)
    push.error(`${t('weRanIssue')}\n ${e}`)
  }
}

async function saveFilter() {
  try {
    savingFilter.value = true
    const f = await filterToCreate()

    return
    if (!f)
      return
    await filterStore.saveFilter(f)
    push.success('Filter successfully saved')
    navigateTo(localePath('/overview'))
  }
  catch (e) {
    savingFilter.value = false
    console.error(e)
    push.error(t('weRanIssue'))
  }
}

async function filterToCreate(): Promise<ListingListener | null> {
  if (radiusError.value) {
    return null
  }

  const rawFilter = toRaw(filter.value)

  console.log(rawFilter)

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
    name: rawFilter.name == '' ? rawFilter.searchValue : rawFilter.name,
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

  if (rawFilter.minPrice != 0 || rawFilter.maxPrice || rawFilter.maxPrice == 0)
    filters.push({ name: 'PriceRange', value: `${Number(rawFilter.minPrice)}-${Number(rawFilter.maxPrice)}` })

  if (rawFilter.internationalShipping)
    filters.push({ name: 'CrossBorder', value: 'true' })

  if (rawFilter.country != t('selectedCountry'))
    filters.push({ name: 'Country', value: rawFilter.country })

  if (!selectedMarketplaces.value.map(item => item.value).includes('all')) {
    filters.push({
      name: 'IncludePlatforms',
      value: selectedMarketplaces.value.map(i => i.value).join(','),
    })
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
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${filter.value.zipcode}&country=${data.country_name}&format=json`
    const response2 = await fetch(url)
    const data2 = await response2.json()
    return [data2[0].lat, data2[0].lon]
  }
  catch (error) {
    console.error('Error fetching country:', error)
    savingFilter.value = false
    push.error(`${t('weRanIssue')}\n ${error}`)
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
  await Promise.allSettled([filterStore.loadFilters()])
  loadEditParam()
})
</script>
