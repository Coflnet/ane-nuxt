<template>
  <div class="pb-8">
    <FiltersCreateHeader
      :is-new-filter="isNewFilter"
      :item-id="filterId"
    />

    <form
      class="flex flex-wrap items-start gap-6"
      @submit.prevent="saveFilter"
    >
      <fieldset
        :disabled="savingFilter"
        class="min-w-0 flex-[999_1_560px]"
      >
        <FiltersTreeFilterTree>
          <FiltersTreeBranch
            v-bind="branch('looking')"
            @toggle="toggleBranch('looking')"
          >
            <FiltersTreeLookingForBranch
              ref="lookingFor"
              v-model="filter"
              :interpretation="interpretation"
              :attributes-supported="attributesSupported"
              :kleinanzeigen-options="kleinanzeigenOptions"
              :photo-open="photoOpen"
              :suggest-context="suggestContext"
              @import-url="importListing"
              @open-photo="openPhoto(null)"
              @open-reference-photo="openPhoto('other')"
            >
              <FiltersTreeReferenceCard
                :url="filter.referenceUrl"
                :title="filter.referenceTitle"
                :image="reference.preview.value?.listing.imageUrls[0]"
                :loading="reference.loading.value"
                :error="reference.error.value"
                @remove="removeReference"
              />
              <FiltersTreePhotoEntry
                v-if="photoOpen"
                v-model="filter.visualSimilarity"
                :lane="photoLane"
                @choose-lane="choosePhotoLane"
                @change-lane="setPhotoLane"
                @ready="visualReady = $event"
                @dirty="referenceDirty = true"
                @close="closePhoto"
                @focus-search="focusSearch"
              />
            </FiltersTreeLookingForBranch>
          </FiltersTreeBranch>

          <FiltersTreeBranch
            v-bind="branch('condition')"
            @toggle="toggleBranch('condition')"
          >
            <FiltersConditionFilter v-model="filter" />
          </FiltersTreeBranch>

          <FiltersTreeBranch
            v-bind="branch('price')"
            @toggle="toggleBranch('price')"
          >
            <FiltersTreePriceBranch
              v-model="filter"
              :preview="reference.preview.value"
              :loading-reference="reference.loading.value"
              @load-reference="reloadSavedReference"
            />
          </FiltersTreeBranch>

          <FiltersTreeBranch
            v-bind="branch('where')"
            @toggle="toggleBranch('where')"
          >
            <FiltersTreeWhereBranch v-model="filter" />
          </FiltersTreeBranch>

          <FiltersTreeBranch
            v-bind="branch('notify')"
            @toggle="toggleBranch('notify')"
          >
            <FiltersTreeNotifyBranch v-model="filter" />
          </FiltersTreeBranch>

          <FiltersTreeSummary
            :filter="filter"
            :has-photo="!!filter.visualSimilarity"
            :is-new-filter="isNewFilter"
            :saving="savingFilter"
            :disabled="!visualReady || feedback.pending.value"
          />
        </FiltersTreeFilterTree>
      </fieldset>

      <aside class="min-w-0 flex-[1_1_340px] lg:sticky lg:top-4">
        <FiltersTreeMatchingOffers
          :offers="offers.offers.value"
          :above-max="offers.aboveMax.value"
          :max-price="filter.maxPrice"
          :budget-currency="filter.referenceCurrency || 'EUR'"
          :loading="offers.loading.value"
          :error="offers.error.value"
          :done="offers.done.value"
          :enabled="hasSomethingToMatch"
          :style-mode="styleMode"
          :feedback-pending="feedback.pending.value"
          :feedback-failed="!!feedback.failure.value"
          :example-count="feedback.exampleCount.value"
          :feedback-choice="feedback.feedbackChoice"
          :can-feedback="feedback.canGiveFeedback"
          @retry="offers.run"
          @raise-max="(max: number) => { filter.maxPrice = max }"
          @feedback="feedback.addFeedback"
          @clear-feedback="feedback.clearFeedback"
          @retry-feedback="feedback.retry"
        />
      </aside>
    </form>
  </div>
</template>

<script setup lang="ts">
import { getMessaging, getToken } from 'firebase/messaging'
import { useFirebaseApp } from 'vuefire'
import { getLocation } from '~/src/api-client'
import type { ClientModelListingListener as ListingListener } from '~/src/api-client'
import type { Filter, WireFilter } from '~/types/FilterType'
import type { PhotoLane } from '~/components/filters/tree/PhotoEntry.vue'
import type { BranchId } from '~/composables/useFilterTreeAnswers'
import { filterFreeMarketplaces, marketplaces } from '~/constants/CreateFilterConstants'
import { parseFilterPrefillQuery, parseListingUrl, prefillFormFields } from '~/utils/filterPrefill'
import type { FilterPrefill } from '~/utils/filterPrefill'
import { buildFilters, defaultFilterState, parseFilters } from '~/utils/filterWire'
import { applyReferenceListing, applyReferencePrices, clearReference, initialPriceSelectors } from '~/utils/referencePreview'
import { pickDefaultNotification } from '~/utils/notifyDefault'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const filterStore = useFilterStore()
const userStore = useUserStore()
const firebaseApp = useFirebaseApp()
// Injected during setup: onMounted only uses it after an await, where inject() no longer works and an
// anonymous visitor would never be signed in (no token: no preview, no saving).
const firebaseAuth = useFirebaseAuth()

const filterId = computed(() => Number(route.query.id ?? 0))
const isNewFilter = computed(() => route.query.id == '' || route.query.id == undefined)

// Prefill is applied during setup, before the dropdowns mount and fall back to "all".
const prefill: FilterPrefill = isNewFilter.value ? parseFilterPrefillQuery(route.query, marketplaces.map(m => m.value)) : {}
const filter = ref<Filter>({ ...defaultFilterState(), ...prefillFormFields(prefill) } as Filter)

const savingFilter = ref(false)
const referenceDirty = ref(false)
const savedHadAttributes = ref(false)
let savedSnapshot = ''

// ---- photo lane ---------------------------------------------------------------------------
const photoLane = ref<PhotoLane | null>(isNewFilter.value && route.query.mode === 'style' ? 'style' : null)
const photoOpen = ref(!!photoLane.value || prefill.entry === 'photo')
const styleMode = computed(() => photoLane.value === 'style')
const visualReady = ref(!styleMode.value)

function setPhotoLane(lane: PhotoLane | null) {
  if (savingFilter.value || photoLane.value === lane) return
  if ((filter.value.visualSimilarity || referenceDirty.value) && !window.confirm(t('styleSearch.switchMode'))) return
  photoLane.value = lane
  filter.value.visualSimilarity = ''
  referenceDirty.value = false
  visualReady.value = lane !== 'style'
}

function choosePhotoLane(lane: PhotoLane) {
  setPhotoLane(lane)
  if (lane === 'other') focusSearch()
}

function openPhoto(lane: PhotoLane | null) {
  photoOpen.value = true
  openBranch.value = 'looking'
  if (lane) setPhotoLane(lane)
}

function closePhoto() {
  setPhotoLane(null)
  if (!photoLane.value) photoOpen.value = false
}

const lookingFor = ref<{ focus: () => void } | null>(null)
function focusSearch() {
  nextTick(() => lookingFor.value?.focus())
}

// ---- accordion and answers ----------------------------------------------------------------
const openBranch = ref<BranchId | null>('looking')
const derivedNotify = ref<{ type: string } | null>(null)
const answers = useFilterTreeAnswers(filter, {
  hasPhoto: () => !!filter.value.visualSimilarity,
  notifyDerived: () => derivedNotify.value?.type === filter.value.notificationType,
})

function toggleBranch(id: BranchId) {
  openBranch.value = openBranch.value === id ? null : id
}

function branch(id: BranchId) {
  return {
    id,
    title: t(`filterTree.branch.${id}`),
    answer: answers.answers.value[id],
    decided: answers.decided.value[id],
    tag: answers.tag(id),
    open: openBranch.value === id,
  }
}

// ---- interpretation, attribute support, reference listing ---------------------------------
const { interpretation, refresh: refreshInterpretation } = useFilterInterpretation(() => filter.value.searchValue)
const attributesSupported = computed(() => savedHadAttributes.value || filterStore.getFilterOptions.some(option => option.name === 'Attributes'))
const kleinanzeigenOptions = computed(() => {
  // The backend compares the category with every listing, so it only makes sense for Kleinanzeigen alone.
  if (filter.value.marketplace !== 'Kleinanzeigen') return null
  return filterStore.getFilterOptions.find(option => option.name === 'KleinanzeigenKategorie')?.value.options ?? null
})

const reference = useReferencePreview()

/** Pasted/linked listing: suggested search term, reference fields and price chips. */
async function importListing(url: string, options: { saved?: { selector?: string, extras?: string[] }, keepSearch?: boolean } = {}) {
  const { saved } = options
  if (parseListingUrl(filter.value.searchValue.trim())) filter.value.searchValue = ''
  const searchBefore = filter.value.searchValue
  const result = await reference.load({ url, selectedSelector: saved?.selector, additionalSelectors: saved?.extras })
  if (!result) return
  // A term the user typed while the listing loaded (or a reload of a saved filter) wins.
  applyReferenceListing(filter.value, result, { search: !options.keepSearch && filter.value.searchValue === searchBefore })
  answers.markSource('looking', 'listing')
  const confirmed = !saved?.selector || result.selectedReference?.selector === saved.selector
  if (!confirmed) {
    reference.error.value = t('referenceSelectionUnavailable')
    return
  }
  applyReferencePrices(filter.value, result, initialPriceSelectors(result, saved?.selector, saved?.extras), new Date(), { keepCustomMax: !!saved })
  if (filter.value.referenceSelector) answers.markSource('price', 'listing')
}

/** Edit mode: fetch the saved reference again so its price parts can be re-picked. */
function reloadSavedReference() {
  const { referenceUrl, referenceSelector, referenceAdditionalSelectors } = filter.value
  if (referenceUrl) void importListing(referenceUrl, { saved: { selector: referenceSelector, extras: referenceAdditionalSelectors }, keepSearch: true })
}

function removeReference() {
  clearReference(filter.value)
  reference.reset()
}

// ---- matching offers and style feedback ---------------------------------------------------
const feedback = useStyleFeedback({
  visual: computed({ get: () => filter.value.visualSimilarity, set: (value: string) => { filter.value.visualSimilarity = value } }),
  saving: savingFilter,
  ready: visualReady,
  apiBase: useApiBaseUrl(),
  token: () => userStore.token,
  fetcher: $fetch as <T>(url: string, options: Record<string, unknown>) => Promise<T>,
})

const hasSomethingToMatch = computed(() => !!filter.value.searchValue.trim() || (styleMode.value && !!filter.value.visualSimilarity))

/** Everything that changes which offers match; notification edits do not refetch. */
function matchSignature() {
  return JSON.stringify({ ...filter.value, notificationType: '', notificationTarget: '', name: '', id: 0 })
}

const offers = useMatchingOffers({
  buildRequest: () => filterToCreate(true),
  test: (listener, signal) => filterStore.testFilter(listener, signal),
  includeAboveMax: true,
  signature: matchSignature,
  enabled: () => visualReady.value && hasSomethingToMatch.value,
  delay: () => (filter.value.visualSimilarity ? 1200 : 600),
})

const suggestContext = computed(() => ({
  searchTerm: filter.value.searchValue,
  filterNames: buildFilters(filter.value, wireContext(null)).map(entry => entry.name),
}))

// ---- leaving with unsaved changes ---------------------------------------------------------
const dirty = computed(() => referenceDirty.value || (!!savedSnapshot && savedSnapshot !== JSON.stringify(filter.value)))

function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value || savingFilter.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onBeforeRouteLeave(() => !savingFilter.value && (!dirty.value || window.confirm(t('styleSearch.unsaved'))))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

async function takeSnapshot() {
  await nextTick()
  savedSnapshot = JSON.stringify(filter.value)
}

// ---- loading ------------------------------------------------------------------------------
function markPrefillSources() {
  const kind = prefill.source
  if (!kind || kind === 'photo') return
  if (prefill.searchValue || prefill.attributes) answers.markSource('looking', kind)
  if (prefill.condition) answers.markSource('condition', kind)
  if (prefill.minPrice !== undefined || prefill.maxPrice !== undefined) answers.markSource('price', kind)
  if (prefill.marketplace) answers.markSource('where', kind)
}

async function importPrefilledListing() {
  if (prefill.url) return importListing(prefill.url)
  if (!prefill.referenceUrl) return
  await importListing(prefill.referenceUrl, { saved: { selector: prefill.referenceSelector, extras: prefill.referenceAdditionalSelectors } })
}

function loadEditParam() {
  if (isNewFilter.value) return
  const saved = filterStore.getUserFilters.find(item => Number(item.id ?? 0) === filterId.value)
  if (!saved?.filters) {
    console.error('Filter not found')
    return
  }
  filter.value = {
    ...parseFilters(saved.filters),
    name: saved.name ?? '',
    id: saved.id ?? 0,
    notificationTarget: saved.target ?? '',
    notificationType: saved.targetType === 'UnknownDefaultOpenApi' ? 'Unknown' : saved.targetType ?? 'Unknown',
  }
  savedHadAttributes.value = saved.filters.some(item => item.name === 'Attributes')
  restorePhotoLane(filter.value.visualSimilarity)
}

function restorePhotoLane(payload: string) {
  if (!payload) return
  try {
    photoLane.value = JSON.parse(payload).mode === 'style' ? 'style' : 'other'
  }
  catch {
    photoLane.value = 'other'
  }
  photoOpen.value = true
}

/** New filters start with the user's usual channel (see utils/notifyDefault.ts). */
function preselectNotification() {
  if (!isNewFilter.value || filter.value.notificationType !== 'Unknown') return
  const choice = pickDefaultNotification({
    filters: filterStore.getUserFilters,
    isWebView: userStore.isWebView,
    pushAllowed: userStore.isWebView || (typeof Notification !== 'undefined' && Notification.permission === 'granted'),
    isLoggedIn: userStore.isLoggedIn,
    savedEmail: userStore.notificationSettings.email.address,
    accountEmail: userStore.getUser?.email,
    savedDiscordWebhook: userStore.notificationSettings.discord.webhookUrl,
  })
  if (!choice.derived) return
  filter.value.notificationType = choice.type
  filter.value.notificationTarget = choice.target
  derivedNotify.value = { type: choice.type }
  if (choice.type === 'FireBase') requestAppPushToken()
}

function requestAppPushToken() {
  if (!userStore.isWebView || !window.sendToFlutter) return
  window.sendToFlutter({ action: 'requestNotifications' })
  if (!userStore.notificationToken) window.sendToFlutter({ action: 'generateNotificationToken' })
}

/** Attribute chips need the backend to support `Attributes`; prefilled chips are dropped otherwise. */
async function loadFilterOptions() {
  try {
    await filterStore.loadFilterOptions()
  }
  catch {
    return
  }
  if (!attributesSupported.value) filter.value.attributes = {}
}

onMounted(async () => {
  window.addEventListener('beforeunload', beforeUnload)
  const options = loadFilterOptions()
  await takeSnapshot()
  try {
    await userStore.checkAuth(firebaseAuth!)
    await Promise.allSettled([filterStore.loadFilters()])
    loadEditParam()
    preselectNotification()
  }
  catch (e) {
    console.error(e)
    push.error(`${t('weRanIntoAnError')}\n ${e}`)
  }
  await takeSnapshot()
  refreshInterpretation()
  await keepPristine(async () => {
    await options
    markPrefillSources()
    await importPrefilledListing()
  })
  offers.schedule()
})

/** Re-takes the snapshot after automatic changes, unless the user changed something before they started. */
async function keepPristine(work: () => Promise<void>) {
  const untouched = savedSnapshot === JSON.stringify(filter.value)
  await work()
  if (untouched) await takeSnapshot()
}

// ---- saving -------------------------------------------------------------------------------
/** Definite answers only (a location, or null for an unknown zip); failed lookups are retried. */
const locationCache = new Map<string, [string, string] | null>()

/** undefined = the lookup itself failed. */
async function lookupZip(zip: string): Promise<[string, string] | null | undefined> {
  try {
    const location = await getLocation({ path: { zip }, composable: '$fetch' })
    if (location.lat == 0 && location.lon == 0) return null
    return [String(location.lat), String(location.lon)]
  }
  catch (error) {
    console.error('Error fetching location:', error)
    return undefined
  }
}

/** Resolves the zip code; problems are only reported when saving, not for previews while typing. */
async function resolveLocation(zip: string, report: boolean): Promise<[string, string] | null> {
  if (!locationCache.has(zip)) {
    const result = await lookupZip(zip)
    if (result === undefined) {
      if (report) push.error(t('issueGettingLocationData'))
      return null
    }
    locationCache.set(zip, result)
  }
  const location = locationCache.get(zip) ?? null
  if (!location && report) push.error(t('invalidZipCode'))
  return location
}

function wireContext(location: [string, string] | null) {
  return {
    freeMarketplaces: filterFreeMarketplaces(marketplaces).map(m => m.value),
    location,
    attributesSupported: attributesSupported.value,
  }
}

async function saveFilter() {
  if (!visualReady.value || feedback.pending.value || savingFilter.value) return
  try {
    savingFilter.value = true
    const submittedSnapshot = JSON.stringify(filter.value)
    const f = await filterToCreate()

    if (!f || !visualReady.value || feedback.pending.value || JSON.stringify(filter.value) !== submittedSnapshot) {
      console.log('aborting')
      return
    }
    const saved = await filterStore.saveFilter(f)
    const unchanged = JSON.stringify(filter.value) === submittedSnapshot && visualReady.value && !feedback.pending.value
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
  const rawFilter = toRaw(filter.value)
  const filters = await handleFilters(preview)
  if (!filters) return null
  return {
    name: rawFilter.searchValue.slice(0, 12) || (styleMode.value ? t('styleSearch.title') : ''),
    userId: '',
    id: rawFilter.id,
    target: preview ? '' : await notificationTarget(rawFilter),
    targetType: preview ? 'Unknown' : rawFilter.notificationType,
    // FilterInfo.value is typed as `string` in the generated spec, but this pipeline
    // intentionally keeps boolean values (CommercialSeller) as they were saved.
    filters: filters as unknown as ListingListener['filters'],
  }
}

/** Side effects of saving with a channel: push token, remembered webhook/address. */
async function notificationTarget(rawFilter: Filter): Promise<string> {
  if (rawFilter.notificationType === 'FireBase') return connectPushNotifications()
  if (rawFilter.notificationType === 'DiscordWebhook') userStore.notificationSettings.discord.webhookUrl = rawFilter.notificationTarget
  if (rawFilter.notificationType === 'Email') userStore.notificationSettings.email.address = rawFilter.notificationTarget
  return rawFilter.notificationTarget
}

/** The wire filters, or null when the zip code cannot be resolved. */
async function handleFilters(preview = false): Promise<WireFilter[] | null> {
  const rawFilter = toRaw(filter.value)
  const location = rawFilter.zipcode ? await resolveLocation(rawFilter.zipcode, !preview) : null
  if (rawFilter.zipcode && !location) return null
  return buildFilters(rawFilter, wireContext(location))
}

async function connectPushNotifications(): Promise<string> {
  if (userStore.isWebView) {
    const token = userStore.notificationToken
    userStore.notificationToken = ''
    return token
  }
  const messaging = getMessaging(firebaseApp)
  // vapid key is meant to be public
  return await getToken(messaging, { vapidKey: 'BC2o4A75_oGlbklpFN4iVXjdZE3lg6Qci7EZg0NrsRAKyKmySam77NrlUAodBAzKhTECJGj-rgfdbQ0qzWUh9nU' })
}

useSeoMeta({
  title: () => t('aneCreate'),
  ogTitle: () => t('aneCreate'),
  description: () => t('createDescription'),
  ogDescription: () => t('createDescription'),
})
</script>
