<template>
  <div>
    <FiltersCreateHeader
      :is-new-filter="isNewFilter"
      :item-id="filterId"
    />
    <UiButton
      :primary="true"
      :proccessing="savingFilter"
      :disabled="!visualReady || feedbackPending"
      aria-label="Save Filter"
      class="w-full block md:hidden mb-4"
      @on-click="saveFilter"
    >
      {{ isNewFilter ? $t('createFilter') : $t('updateFilter') }}
    </UiButton>

    <UiDefaultContainer class="mb-6 p-6">
      <form
        class="overflow-visible"
        @submit.prevent="saveFilter"
      >
        <fieldset
          :disabled="savingFilter"
          class="min-w-0"
        >
          <div class="flex gap-3 mb-4">
            <button
              type="button"
              class="underline"
              :aria-pressed="!styleMode"
              @click="setStyleMode(false)"
            >
              {{ $t('styleSearch.keywordSearch') }}
            </button>
            <button
              type="button"
              class="underline"
              :aria-pressed="styleMode"
              @click="setStyleMode(true)"
            >
              {{ $t('styleSearch.title') }}
            </button>
          </div>
          <template v-if="styleMode">
            <h2 class="text-xl mb-2">
              {{ $t('styleSearch.title') }}
            </h2>
            <p>{{ $t('styleSearch.intro') }}</p>
            <FiltersVisualSimilarityFilter
              v-model="filter.visualSimilarity"
              :style-mode="true"
              @ready="visualReady = $event"
              @dirty="referenceDirty = true"
            />
          </template>
          <FiltersReferenceListingImport
            v-else
            v-model="filter"
          />
          <FiltersSearchValueMarketplaceFilter v-model="filter" />

          <FiltersPriceConditionFilter v-model="filter" />
          <FiltersCreateCountrySection :model-value="filter" />

          <!-- Dont worry about this, this whole system needs to get reworked by akwav -->
          <div
            v-for="option in filterStore.getFilterOptions"
            :key="option.name"
          >
            <FiltersKleinanzeigenCategoryFilter
              v-if="option.name === 'KleinanzeigenKategorie' && filter.marketplace == 'kleinanzeigen'"
              :filter="filter"
              :options="option.value.options"
            />
          </div>
          <UiExpandOption class="mt-1 ">
            <FiltersKeywordFilter
              class="my-4"
              :model-value="filter.blacklist"
              :label="$t('blackKeywords')"
              :footer="$t('addblacklistKeywords')"
              :place-holder="$t('addBlackListPressEnter')"
            />
            <FiltersWhitelistFilter
              class="my-4"
              :model-value="filter.keywords"
            />
            <FiltersFuzzyFilter :model-value="filter" />
            <FiltersVisualSimilarityFilter
              v-if="!styleMode"
              v-model="filter.visualSimilarity"
              @ready="visualReady = $event"
              @dirty="referenceDirty = true"
            />
          </UiExpandOption>
          <div
            v-if="styleMode"
            class="mb-4"
            aria-live="polite"
          >
            <h2 class="text-xl">
              {{ $t('styleSearch.preview') }}
            </h2>
            <p v-if="previewLoading">
              {{ $t('styleSearch.loading') }}
            </p>
            <p
              v-else-if="previewError"
              role="alert"
            >
              {{ $t('styleSearch.previewError') }} <button
                type="button"
                class="underline"
                @click="testFilter"
              >
                {{ $t('retry') }}
              </button>
            </p>
            <p v-else-if="previewDone && !matches.length">
              {{ $t('styleSearch.empty') }}
            </p>
            <p v-else-if="!visualReady">
              {{ $t('styleSearch.prepareFirst') }}
            </p>
            <p v-if="feedbackPending">
              {{ $t('styleSearch.feedbackLoading') }}
            </p>
            <p
              v-if="feedbackError"
              role="alert"
            >
              {{ $t('styleSearch.feedbackError') }}
              <button
                type="button"
                class="underline"
                :disabled="feedbackPending || savingFilter"
                @click="addFeedback(feedbackError.listing, feedbackError.positive)"
              >
                {{ $t('retry') }}
              </button>
            </p>
            <button
              v-if="exampleCount"
              type="button"
              class="underline my-2"
              :disabled="feedbackPending || savingFilter"
              @click="clearFeedback"
            >
              {{ $t('styleSearch.clearFeedback') }} ({{ exampleCount }}/4)
            </button>
            <p v-if="exampleCount >= 4">
              {{ $t('styleSearch.feedbackLimit') }}
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <article
                v-for="match in matches"
                :key="`${match.listingData?.platform}-${match.listingData?.id}`"
                class="rounded border border-slate-600 p-3"
              >
                <a
                  :href="listingStore.constructListingUrl(match.listingData, locale) ?? undefined"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    v-if="match.listingData?.imageUrls?.[0]"
                    :src="match.listingData.imageUrls[0]"
                    :alt="match.listingData.title ?? ''"
                    loading="lazy"
                    class="w-full h-48 object-contain"
                  >
                  <h3>{{ match.listingData?.title }}</h3>
                </a>
                <p>{{ useFormat().formatCurrency(match.listingData?.price ?? 0, match.listingData?.currency ?? '', locale) }}</p>
                <div class="flex gap-3 mt-2">
                  <button
                    type="button"
                    class="underline"
                    :disabled="!visualReady || feedbackPending || savingFilter || (exampleCount >= 4 && feedbackChoice(match.listingData) === undefined)"
                    :aria-pressed="feedbackChoice(match.listingData) === true"
                    :class="{ 'bg-indigo-700 px-2 rounded font-semibold': feedbackChoice(match.listingData) === true }"
                    @click="match.listingData && addFeedback(match.listingData, true)"
                  >
                    {{ $t('styleSearch.moreLike') }}
                  </button>
                  <button
                    type="button"
                    class="underline"
                    :disabled="!visualReady || feedbackPending || savingFilter || (exampleCount >= 4 && feedbackChoice(match.listingData) === undefined)"
                    :aria-pressed="feedbackChoice(match.listingData) === false"
                    :class="{ 'bg-indigo-700 px-2 rounded font-semibold': feedbackChoice(match.listingData) === false }"
                    @click="match.listingData && addFeedback(match.listingData, false)"
                  >
                    {{ $t('styleSearch.notRelevant') }}
                  </button>
                </div>
              </article>
            </div>
          </div>

          <FiltersNotificationSettingsFilter v-model="filter" />

          <FiltersCreateConfirmCreation
            :is-new-filter="isNewFilter"
            :saving="savingFilter"
            :disabled="!visualReady || feedbackPending"
          />
        </fieldset>
      </form>
    </UiDefaultContainer>

    <OverviewRecentMatchTable
      v-if="!styleMode && matches.length > 0"
      :matches
      :title="$t('auctionMatchedToFilters')"
    />
  </div>
</template>

<script setup lang="ts">
import lodash from 'lodash'
import { getMessaging, getToken } from 'firebase/messaging'
import { useFirebaseApp } from 'vuefire'
import type { ClientModelFilterMatch as FilterMatch, ClientModelListingListener as ListingListener, ClientModelStoredListing as StoredListing } from '~/src/api-client'
import type { Filter, TargetType } from '~/types/FilterType'
import { filterFreeMarketplaces, marketplaces } from '~/constants/CreateFilterConstants'
import { parseFilterPrefillQuery } from '~/utils/filterPrefill'
import { useFormat } from '~/composable/useFormat'

const { debounce } = lodash

const { t, locale } = useI18n()
const listingStore = useListingStore()

const filterStore = useFilterStore()
const userStore = useUserStore()
const firebaseApp = useFirebaseApp()
const savingFilter = ref(false)

const localePath = useLocalePath()

const route = useRoute()

const filterId = computed(() => Number(route.query.id ?? 0))

const isNewFilter = computed(() => {
  return route.query.id == '' || route.query.id == undefined
})

const matches = ref<FilterMatch[]>([])
const styleMode = ref(isNewFilter.value && route.query.mode === 'style')
const visualReady = ref(!styleMode.value)
const referenceDirty = ref(false)
const feedbackPending = ref(false)
const feedbackError = shallowRef<{ listing: StoredListing, positive: boolean } | null>(null)
let feedbackRequest: AbortController | undefined
const feedbackExamples = computed<{ sourceListingId: string, sourcePlatform: string, positive: boolean }[]>(() => {
  try {
    return JSON.parse(filter.value.visualSimilarity || '{}').examples ?? []
  }
  catch { return [] }
})
const exampleCount = computed(() => feedbackExamples.value.length)
function feedbackChoice(listing: StoredListing | undefined) {
  return feedbackExamples.value.find(example => example.sourceListingId === listing?.id && example.sourcePlatform === listing?.platform)?.positive
}

const previewLoading = ref(false)
const previewError = ref(false)
const previewDone = ref(false)
let previewRequest: AbortController | undefined
let savedSnapshot = ''
const dirty = computed(() => referenceDirty.value || (!!savedSnapshot && savedSnapshot !== JSON.stringify(filter.value)))
function setStyleMode(value: boolean) {
  if (savingFilter.value || styleMode.value === value) return
  if ((filter.value.visualSimilarity || referenceDirty.value) && !window.confirm(t('styleSearch.switchMode'))) return
  styleMode.value = value
  filter.value.visualSimilarity = ''
  visualReady.value = !value
}

const filter = ref<Filter>({
  name: '',
  marketplace: 'all',
  searchValue: '',
  totalCost: 0,
  zipcode: '',
  searchRadius: 100,
  commercialSeller: false,
  seller: '',
  keywords: [[]],
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
  fuzzyness: '0',
  visualSimilarity: '',
  referenceUrl: '',
  referenceTitle: '',
  referenceMarketplace: '',
  referencePrice: 0,
  referenceCurrency: '',
  referenceSelector: '',
  referenceAdditionalSelectors: [],
  referenceLastRefreshedAt: '',
})

watch(() => filter.value.visualSimilarity, () => {
  feedbackRequest?.abort()
  feedbackRequest = undefined
  feedbackPending.value = false
  feedbackError.value = null
})

function clearFeedback() {
  if (savingFilter.value) return
  const payload = JSON.parse(filter.value.visualSimilarity)
  delete payload.examples
  filter.value.visualSimilarity = JSON.stringify(payload)
}

async function addFeedback(listing: StoredListing, positive: boolean) {
  if (savingFilter.value || !visualReady.value || feedbackPending.value || (exampleCount.value >= 4 && feedbackChoice(listing) === undefined) || !listing.id || !listing.platform) return
  const reference = filter.value.visualSimilarity
  const current = new AbortController()
  feedbackRequest = current
  feedbackPending.value = true
  feedbackError.value = null
  try {
    const example = await $fetch<{ emb: number[], provenance: Record<string, unknown>, sourceListingId: string, sourcePlatform: string, sourceImageUrl: string }>('https://ane.coflnet.com/api/filters/visual-similarity/example', {
      method: 'POST',
      signal: current.signal,
      headers: { Authorization: `Bearer ${userStore.token}` },
      body: { listingId: listing.id, platform: listing.platform, photoIndex: 0 },
    })
    if (feedbackRequest !== current || current.signal.aborted || reference !== filter.value.visualSimilarity) return
    const sourceImage = new URL(example.sourceImageUrl)
    if (!example.emb?.length || !example.provenance || example.sourceListingId !== listing.id || example.sourcePlatform !== listing.platform || example.sourceImageUrl.length > 2048 || sourceImage.protocol !== 'https:' || sourceImage.username || sourceImage.password) throw new Error('Invalid example')
    const payload = JSON.parse(reference)
    const preference = { emb: example.emb, provenance: example.provenance, sourceListingId: example.sourceListingId, sourcePlatform: example.sourcePlatform, sourceImageUrl: example.sourceImageUrl, positive }
    const examples = payload.examples ?? []
    const existing = examples.findIndex((item: typeof preference) => item.sourceListingId === listing.id && item.sourcePlatform === listing.platform)
    if (existing >= 0) examples[existing] = preference
    else if (examples.length < 4) examples.push(preference)
    payload.examples = examples
    filter.value.visualSimilarity = JSON.stringify(payload)
  }
  catch {
    if (feedbackRequest === current && !current.signal.aborted) feedbackError.value = { listing, positive }
  }
  finally {
    if (feedbackRequest === current) feedbackPending.value = false
  }
}

watch([filter, visualReady], () => {
  previewRequest?.abort()
  debouncedTestFilter.cancel()
  previewLoading.value = false
  debouncedTestFilter()
}, { deep: true })

const debouncedTestFilter = debounce(() => testFilter(), 500)

async function testFilter() {
  previewRequest?.abort()
  if (!visualReady.value || (!styleMode.value && !filter.value.searchValue)) return
  const current = new AbortController()
  previewRequest = current
  previewLoading.value = true
  previewError.value = false
  try {
    const f = await filterToCreate(true)
    if (!f || current.signal.aborted) return
    const res = await filterStore.testFilter(f, current.signal)
    if (previewRequest !== current || current.signal.aborted) return
    if (res === null) throw new Error('Preview unavailable')
    matches.value = res.map(i => ({ matchedAt: i.foundAt, listenerId: 0, listingData: i }))
    previewDone.value = true
  }
  catch {
    if (previewRequest === current && !current.signal.aborted) previewError.value = true
  }
  finally {
    if (previewRequest === current) previewLoading.value = false
  }
}

function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value || savingFilter.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onBeforeRouteLeave(() => !savingFilter.value && (!dirty.value || window.confirm(t('styleSearch.unsaved'))))
onBeforeUnmount(() => {
  previewRequest?.abort()
  feedbackRequest?.abort()
  debouncedTestFilter.cancel()
  window.removeEventListener('beforeunload', beforeUnload)
})

const radiusError = ref(false)

// Prefill a new filter from query params, e.g. the "Notify me about new offers" link on a
// product page (utils/notifyFilterUrl.ts builds it, this reads it back). Only applies when
// creating a new filter — editing an existing one always loads its saved values instead —
// and only runs once on mount; every field stays freely editable afterwards.
function applyPrefillFromQuery() {
  if (!isNewFilter.value) return

  const prefill = parseFilterPrefillQuery(route.query, marketplaces.map(m => m.value))
  Object.assign(filter.value, prefill)
}

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
    filter.value.notificationType = activeFilter.targetType === 'UnknownDefaultOpenApi' ? 'Unknown' : activeFilter.targetType ?? 'Unknown'

    activeFilter.filters.forEach((item) => {
      switch (item.name) {
        case 'Radius': {
          const [_lat, _lon, radius, zipcode] = item.value?.split?.(';') ?? ''
          filter.value.searchRadius = Number(radius ?? 0)
          filter.value.zipcode = zipcode ?? ''
          break
        }
        case 'ContainsKeyWord':{
          if (item.value == '') break
          const joinedItems = item.value!.split('|')
          filter.value.keywords = joinedItems.map((i: string) => i.split(','))
          console.log(filter.value.keywords)
          break
        }
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
          // A saved explicit list stays explicit as the advertised sources change.
          filter.value.marketplace = item.value ?? ''
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
        case 'Fuzzyness':
          filter.value.fuzzyness = item.value ?? '2'
          break
        case 'Frequency':
          filter.value.frequency = item.value ?? ''
          break
        case 'Country':
          filter.value.country = item.value ?? ''
          break
        case 'VisualSimilarityFilter':
          filter.value.visualSimilarity = item.value ?? ''
          try {
            styleMode.value = JSON.parse(item.value || '{}').mode === 'style'
          }
          catch { /* Keep legacy mode for malformed saved values. */ }
          break
        case 'ReferenceUrl':
          filter.value.referenceUrl = item.value ?? ''
          break
        case 'ReferenceTitle':
          filter.value.referenceTitle = item.value ?? ''
          break
        case 'ReferenceMarketplace':
          filter.value.referenceMarketplace = item.value ?? ''
          break
        case 'ReferencePrice':
          filter.value.referencePrice = Number(item.value ?? 0)
          break
        case 'ReferenceCurrency':
          filter.value.referenceCurrency = item.value ?? ''
          break
        case 'ReferenceSelector':
          filter.value.referenceSelector = item.value ?? ''
          break
        case 'ReferenceAdditionalSelectors':
          filter.value.referenceAdditionalSelectors = (item.value ?? '')
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0)
          break
        case 'ReferenceLastRefreshedAt':
          filter.value.referenceLastRefreshedAt = item.value ?? ''
          break
      }
    })
  }
  catch (e) {
    console.error(e)
    push.error(`${t('weRanIntoAnError')}\n ${e}`)
  }
}

async function saveFilter() {
  if (!visualReady.value || feedbackPending.value || savingFilter.value) return
  try {
    savingFilter.value = true
    const submittedSnapshot = JSON.stringify(filter.value)
    const f = await filterToCreate()

    if (!f || !visualReady.value || feedbackPending.value || JSON.stringify(filter.value) !== submittedSnapshot) {
      console.log('aborting')
      return
    }
    const saved = await filterStore.saveFilter(f)
    const unchanged = JSON.stringify(filter.value) === submittedSnapshot && visualReady.value && !feedbackPending.value
    if (saved?.id) filter.value.id = saved.id
    savedSnapshot = JSON.stringify({ ...JSON.parse(submittedSnapshot), id: filter.value.id })
    if (!unchanged) {
      push.error(t('styleSearch.savedEarlierVersion'))
      return
    }
    referenceDirty.value = false
    push.success('Filter successfully saved')
    savingFilter.value = false
    await navigateTo(localePath('/overview'))
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

async function filterToCreate(preview = false): Promise<ListingListener | null> {
  if (radiusError.value) {
    return null
  }

  const rawFilter = toRaw(filter.value)

  let notificationTarget = rawFilter.notificationTarget
  if (!preview && rawFilter.notificationType == 'FireBase') {
    notificationTarget = await connectPushNotifications()
  }

  if (!preview && rawFilter.notificationType == 'DiscordWebhook') {
    userStore.notificationSettings.discord.webhookUrl = rawFilter.notificationTarget
  }

  if (!preview && rawFilter.notificationType == 'Email') {
    userStore.notificationSettings.email.address = rawFilter.notificationTarget
  }

  const filterToCreate: ListingListener = {
    name: rawFilter.searchValue.slice(0, 12) || (styleMode.value ? t('styleSearch.title') : ''),
    userId: '',
    id: filter.value.id,
    target: preview ? '' : notificationTarget,
    targetType: preview ? 'Unknown' : rawFilter.notificationType as TargetType,
    // FilterInfo.value is typed as `string` in the generated spec, but this
    // pipeline intentionally stores numeric/boolean filter values (radius,
    // price, toggles) as-is; narrow adapter to keep the wire payload unchanged.
    filters: await handleFilters() as unknown as ListingListener['filters'],
  }

  return filterToCreate
}

async function handleFilters(): Promise<{ name: string, value: string | number | boolean }[]> {
  const rawFilter = toRaw(filter.value)
  const filters: { name: string, value: string | number | boolean }[] = []

  // '2' is the default value or false
  if (rawFilter.fuzzyness != '0') {
    filters.push({ name: 'Fuzzyness', value: rawFilter.fuzzyness })
  }

  // 'EU,US,GB' is the default value
  if (rawFilter.country != 'EU,US,GB')
    filters.push({ name: 'Country', value: rawFilter.country })

  if (rawFilter.frequency != '')
    filters.push({ name: 'Frequency', value: rawFilter.frequency })

  if (rawFilter.minPrice != 0 || rawFilter.maxPrice || rawFilter.maxPrice == 0)
    filters.push({ name: 'PriceRange', value: `${Number(rawFilter.minPrice)}-${Number(rawFilter.maxPrice)}` })

  if (rawFilter.condition != 'all')
    filters.push({ name: 'Condition', value: rawFilter.condition })

  if (rawFilter.deliveryMethod != 'all')
    filters.push({ name: 'DeliveryMethod', value: rawFilter.deliveryMethod })

  if (rawFilter.marketplace != 'all') {
    filters.push({ name: 'IncludePlatforms', value: rawFilter.marketplace })
  }
  else {
    const marketplacesArray = filterFreeMarketplaces(marketplaces)
    filters.push({ name: 'IncludePlatforms', value: marketplacesArray.map(m => m.value).join(',') })
  }

  if (rawFilter.commercialSeller)
    filters.push({ name: 'CommercialSeller', value: true })

  if (rawFilter.zipcode != '') {
    const location = await handleSearchRadius()
    filters.push({ name: 'Radius', value: `${location[0]};${location[1]};${rawFilter.searchRadius};${rawFilter.zipcode}` })
  }

  filters.push({ name: 'SearchTerm', value: rawFilter.searchValue })
  if (rawFilter.totalCost != 0)
    filters.push({ name: 'TotalCost', value: `${rawFilter.totalCost}-${rawFilter.totalCost}` })

  if (rawFilter.keywords[0]!.length != 0) {
    // first join the text writen in the input fields with a comma than join all the groups or input fields with a pipe
    const joinedItems = rawFilter.keywords.map(i => i.join(',')).filter(i => i != '')
    filters.push({ name: 'ContainsKeyWord', value: joinedItems.join('|') })
  }
  if (rawFilter.blacklist.length != 0)
    filters.push({ name: 'NotContainsKeyWord', value: rawFilter.blacklist.join(',') })

  // Visual similarity payload is JSON-encoded base64 thumbnail + CLIP embedding
  // produced client-side via /api/filters/visual-similarity/prepare. Empty when
  // the user did not pick a reference image.
  if (rawFilter.visualSimilarity && rawFilter.visualSimilarity.length > 0)
    filters.push({ name: 'VisualSimilarityFilter', value: rawFilter.visualSimilarity })

  if (rawFilter.referenceUrl)
    filters.push({ name: 'ReferenceUrl', value: rawFilter.referenceUrl })
  if (rawFilter.referenceTitle)
    filters.push({ name: 'ReferenceTitle', value: rawFilter.referenceTitle })
  if (rawFilter.referenceMarketplace)
    filters.push({ name: 'ReferenceMarketplace', value: rawFilter.referenceMarketplace })
  if (rawFilter.referencePrice)
    filters.push({ name: 'ReferencePrice', value: String(rawFilter.referencePrice) })
  filters.push({ name: 'ReferenceCurrency', value: rawFilter.referenceCurrency || 'EUR' })
  if (rawFilter.referenceSelector)
    filters.push({ name: 'ReferenceSelector', value: rawFilter.referenceSelector })
  if (rawFilter.referenceAdditionalSelectors && rawFilter.referenceAdditionalSelectors.length > 0)
    filters.push({ name: 'ReferenceAdditionalSelectors', value: rawFilter.referenceAdditionalSelectors.join('\n') })
  if (rawFilter.referenceLastRefreshedAt)
    filters.push({ name: 'ReferenceLastRefreshedAt', value: rawFilter.referenceLastRefreshedAt })

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
  if (useUserStore().isWebView) {
    const token = useUserStore().notificationToken
    useUserStore().notificationToken = ''
    return token
  }
  const messaging = getMessaging(firebaseApp)
  // vapid key is meant to be public
  const token = await getToken(messaging, { vapidKey: 'BC2o4A75_oGlbklpFN4iVXjdZE3lg6Qci7EZg0NrsRAKyKmySam77NrlUAodBAzKhTECJGj-rgfdbQ0qzWUh9nU' })
  return token
}

onMounted(async () => {
  // Only reads route.query — independent of auth/filter-store state, so it runs first and
  // isn't skipped if checkAuth/loadFilters below ever reject.
  applyPrefillFromQuery()
  savedSnapshot = JSON.stringify(filter.value)
  window.addEventListener('beforeunload', beforeUnload)
  await useUserStore().checkAuth(useFirebaseAuth()!)
  await Promise.allSettled([filterStore.loadFilters()])
  await loadEditParam()
  if (!isNewFilter.value) savedSnapshot = JSON.stringify(filter.value)
})

useSeoMeta({
  title: () => t('aneCreate'),
  ogTitle: () => t('aneCreate'),
  description: () => t('createDescription'),
  ogDescription: () => t('createDescription'),
})
</script>
