<template>
  <div>
    <h1 class="mb-8">
      <UiHeaderLabel
        :label="$t('newFlips')"
        :xl="true"
      />
    </h1>

    <!-- Flipper Tier Banner + Distance Sort & Location -->
    <UiDefaultContainer
      class="mb-4 p-4"
      :class="!isFlipperTier ? 'border border-indigo-500/30 bg-indigo-900/20' : ''"
    >
      <!-- Promo banner for non-flipper users -->
      <div
        v-if="!isFlipperTier"
        class="flex items-center justify-between flex-wrap gap-3 mb-4 pb-4 border-b border-indigo-500/20"
      >
        <div>
          <p class="text-white font-medium">
            {{ $t('flipperTierPromo') }}
          </p>
          <p class="text-sm text-gray-400 mt-1">
            {{ $t('flipperTierPromoDetail') }}
          </p>
        </div>
        <UiLinkButton
          :primary="true"
          :to="localePath('/subscriptions') + '?discount=EARLY'"
        >
          {{ $t('upgrade') }}
        </UiLinkButton>
      </div>

      <!-- Sort & Location controls -->
      <div :class="{ 'opacity-60 pointer-events-none select-none': !isFlipperTier }">
        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-400">{{ $t('sortBy') }}</label>
            <select
              v-model="sortMode"
              :disabled="!isFlipperTier"
              class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-40 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed"
            >
              <option value="newest">
                {{ $t('sortNewest') }}
              </option>
              <option value="profit">
                {{ $t('sortProfit') }}
              </option>
              <option value="distance">
                {{ $t('sortDistance') }}
              </option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-400">{{ $t('location') }}</label>
            <div class="flex gap-2">
              <input
                v-model="locationZip"
                type="text"
                :disabled="!isFlipperTier"
                :placeholder="$t('zipCodePlaceholder')"
                class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-32 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed"
                @keydown.enter="geocodeZip"
              >
              <button
                :disabled="!isFlipperTier"
                class="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                @click="useDeviceLocation"
              >
                <Icon
                  name="tabler:current-location"
                  class="w-4 h-4"
                />
                {{ $t('useGPS') }}
              </button>
            </div>
          </div>
          <div
            v-if="userLocation"
            class="flex items-center gap-2 text-xs text-green-400"
          >
            <Icon
              name="tabler:map-pin"
              class="w-4 h-4"
            />
            {{ locationLabel }}
          </div>
          <div
            v-if="locationError"
            class="text-xs text-red-400"
          >
            {{ locationError }}
          </div>
          <div
            v-if="sortMode === 'distance' && filters.maxDistance > 0"
            class="flex flex-col gap-1"
          >
            <label class="text-xs text-gray-400">{{ $t('maxDistance') }}</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="filters.maxDistance"
                type="number"
                :disabled="!isFlipperTier"
                placeholder="∞"
                class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-24 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed"
              >
              <span class="text-xs text-gray-400">km</span>
            </div>
          </div>
        </div>
        <div
          v-if="!isFlipperTier"
          class="mt-2 flex items-center gap-2"
        >
          <Icon
            name="tabler:lock"
            class="w-4 h-4 text-indigo-400"
          />
          <span class="text-xs text-indigo-400">
            {{ $t('distanceSortFlipperOnly') }}
          </span>
        </div>
      </div>
    </UiDefaultContainer>

    <!-- Filters -->
    <UiDefaultContainer class="mb-4 p-4">
      <div class="flex flex-wrap gap-3 items-end">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-400">{{ $t('search') }}</label>
          <input
            v-model="filters.search"
            type="text"
            :placeholder="$t('searchFlips')"
            class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-48 focus:border-blue-500 focus:outline-none"
          >
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-400">{{ $t('minProfit') }}</label>
          <input
            v-model.number="filters.minProfit"
            type="number"
            placeholder="0"
            class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-24 focus:border-blue-500 focus:outline-none"
          >
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-400">{{ $t('minMarginPct') }}</label>
          <input
            v-model.number="filters.minMarginPct"
            type="number"
            placeholder="0"
            class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-24 focus:border-blue-500 focus:outline-none"
          >
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-400">{{ $t('minRefs') }}</label>
          <input
            v-model.number="filters.minRefs"
            type="number"
            placeholder="0"
            class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-24 focus:border-blue-500 focus:outline-none"
          >
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-400">{{ $t('category') }}</label>
          <input
            v-model="filters.category"
            type="text"
            :placeholder="$t('allCategories')"
            class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-36 focus:border-blue-500 focus:outline-none"
          >
        </div>
        <button
          v-if="hasActiveFilters"
          class="text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-500 transition-colors"
          @click="clearFilters"
        >
          {{ $t('clearFilters') }}
        </button>
        <button
          v-if="hasActiveFilters"
          class="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors font-medium"
          @click="showSaveFilterDialog = true"
        >
          <Icon
            name="tabler:bell-plus"
            class="w-4 h-4"
          />
          {{ $t('saveFilterNotify') }}
        </button>
        <div class="ml-auto flex items-center gap-3">
          <label class="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
            <input
              v-model="autoScroll"
              type="checkbox"
              class="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer"
            >
            {{ $t('autoScroll') }}
          </label>
          <span class="text-xs text-gray-500">{{ filteredItems.length }}/{{ items.length }} {{ $t('flips') }}</span>
        </div>
      </div>
    </UiDefaultContainer>

    <!-- Feed -->
    <UiDefaultContainer class="mb-6 p-6 relative">
      <div
        ref="scrollContainer"
        class="overflow-x-auto py-4 scroll-smooth"
      >
        <div
          class="flex gap-6 w-max"
        >
          <TransitionGroup name="flip-slide">
            <div
              v-for="item in filteredItems"
              :key="item.listing!.id ?? ''"
              class="flip-item"
            >
              <FlipperFlipItem
                :item="item"
                :is-bookmarked="isBookmarked(item)"
                @bookmark="toggleBookmark(item)"
                @click="handleFlipClick(item)"
              />
            </div>
          </TransitionGroup>
        </div>
      </div>
      <div
        v-if="items.length === 0 && !loading"
        class="text-center py-12 text-slate-400"
      >
        {{ $t('noFlipsFound') }}
      </div>
      <div
        v-if="loading"
        class="text-center py-12 text-slate-400"
      >
        {{ $t('loading') }}...
      </div>
    </UiDefaultContainer>

    <!-- Bookmarked Flips -->
    <div v-if="bookmarkedFlips.length > 0">
      <h2 class="mb-4">
        <UiHeaderLabel :label="$t('bookmarkedFlips')" />
      </h2>
      <UiDefaultContainer class="mb-6 p-6 relative">
        <div class="overflow-x-auto py-4">
          <div class="flex gap-6 w-max">
            <div
              v-for="item in bookmarkedFlips"
              :key="'bm-' + (item.listing?.id ?? '')"
            >
              <FlipperFlipItem
                :item="item"
                :is-bookmarked="true"
                :show-delete="true"
                @bookmark="toggleBookmark(item)"
                @delete="confirmDeleteBookmark(item)"
              />
            </div>
          </div>
        </div>
      </UiDefaultContainer>
    </div>

    <!-- Save Filter & Notify Dialog -->
    <Teleport to="body">
      <div
        v-if="showSaveFilterDialog"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="showSaveFilterDialog = false"
      >
        <div class="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
          <h3 class="text-lg font-bold text-white mb-4">
            {{ $t('saveFlipFilter') }}
          </h3>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-gray-400">{{ $t('filterName') }}</label>
              <input
                v-model="filterName"
                type="text"
                :placeholder="$t('nameEg')"
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white mt-1 focus:border-indigo-500 focus:outline-none"
              >
            </div>
            <div>
              <label class="text-xs text-gray-400">{{ $t('notificationsChannels') }}</label>
              <select
                v-model="filterNotifyType"
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white mt-1 focus:border-indigo-500 focus:outline-none"
              >
                <option value="firebase">
                  {{ $t('webPush') }}
                </option>
                <option value="discord">
                  {{ $t('sendDiscordNotifications') }}
                </option>
                <option value="email">
                  {{ $t('sendEmail') }}
                </option>
                <option value="none">
                  {{ $t('dontSendNotifications') }}
                </option>
              </select>
            </div>
            <div v-if="filterNotifyType === 'discord'">
              <label class="text-xs text-gray-400">{{ $t('discordWebHookUrl') }}</label>
              <input
                v-model="filterNotifyTarget"
                type="text"
                placeholder="https://discord.com/api/webhooks/..."
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white mt-1 focus:border-indigo-500 focus:outline-none"
              >
            </div>
            <div v-if="filterNotifyType === 'email'">
              <label class="text-xs text-gray-400">{{ $t('email') }}</label>
              <input
                v-model="filterNotifyTarget"
                type="email"
                placeholder="you@example.com"
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white mt-1 focus:border-indigo-500 focus:outline-none"
              >
            </div>
          </div>
          <div class="flex gap-3 mt-5">
            <button
              class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              @click="showSaveFilterDialog = false"
            >
              {{ $t('cancel') }}
            </button>
            <button
              class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
              @click="saveFlipFilter"
            >
              {{ $t('saveFilterNotify') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="deleteTarget"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="deleteTarget = null"
      >
        <div class="bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-700">
          <h3 class="text-lg font-bold text-white mb-2">
            {{ $t('removeBookmark') }}
          </h3>
          <p class="text-gray-400 text-sm mb-4">
            {{ $t('removeBookmarkConfirm', { title: deleteTarget.listing?.title ?? '' }) }}
          </p>
          <div class="flex gap-3">
            <button
              class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              @click="deleteTarget = null"
            >
              {{ $t('cancel') }}
            </button>
            <button
              class="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              @click="removeBookmark(deleteTarget)"
            >
              {{ $t('delete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- SEO Content -->
    <div class="mt-12 bg-slate-900/50 rounded-xl border border-slate-800 p-8 space-y-6">
      <h2 class="text-xl font-bold text-slate-200">
        {{ $t('flipper.seo.title') }}
      </h2>
      <p class="text-sm text-slate-400 leading-relaxed">
        {{ $t('flipper.seo.intro') }}
      </p>
      <p class="text-sm text-slate-400 leading-relaxed">
        {{ $t('flipper.seo.howItWorks') }}
      </p>
      <p class="text-sm text-slate-400 leading-relaxed">
        {{ $t('flipper.seo.tips') }}
      </p>
      <p class="text-sm text-slate-400 leading-relaxed">
        {{ $t('flipper.seo.examples') }}
      </p>
      <p class="text-sm text-slate-400 leading-relaxed">
        {{ $t('flipper.seo.cta') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { client as apiClient } from '~/src/api-client/client.gen'
import { getFlips, getSubscription, type ActiveSubscription, type Flip } from '~/src/api-client'

type FeedTier = 'free' | 'collector' | 'flipper'
type LiveFlipMessage = {
  type?: string | null
  category?: string | null
  flip?: Flip | null
}

const { t } = useI18n()

const STORAGE_KEY_FILTERS = 'flipper-filters'
const STORAGE_KEY_BOOKMARKS = 'flipper-bookmarks'
const STORAGE_KEY_AUTOSCROLL = 'flipper-autoscroll'
const FEED_LIMIT = 24
const MAX_FEED_ITEMS = 100
const FREE_INITIAL_VISIBLE_COUNT = 10
const FREE_BACKFILL_INTERVAL_MS = 60000
const PREMIUM_BACKFILL_INTERVAL_MS = 120000
const FREE_REPLAY_MIN_INTERVAL_MS = 2000
const FREE_REPLAY_MAX_INTERVAL_MS = 5000
const FREE_REPLAY_FALLBACK_INTERVAL_MS = 3000
const FREE_REPLAY_COMPLETION_BUFFER_MS = 3000

const items = ref<Flip[]>([])
const loading = ref(true)
const scrollContainer = ref<HTMLElement | null>(null)
const route = useRoute()
const userStore = useUserStore()
const deleteTarget = ref<Flip | null>(null)
const localePath = useLocalePath()
const replayQueue = ref<Flip[]>([])
const hasInitializedFeed = ref(false)

let removeWheelHandler: (() => void) | null = null
let refreshInterval: ReturnType<typeof setInterval> | null = null
let replayTimer: ReturnType<typeof setTimeout> | null = null
let liveSocket: WebSocket | null = null
let liveReconnectTimer: ReturnType<typeof setTimeout> | null = null
let liveReconnectAttempt = 0
let allowLiveReconnect = false
let nextFreeBackfillAt: number | null = null

const selectedCategory = computed(() => {
  const category = route.query.category
  return typeof category === 'string' && category.trim() !== '' ? category : '1'
})

function loadAutoScroll(): boolean {
  if (import.meta.server) return true
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUTOSCROLL)
    return saved === null ? true : saved === 'true'
  }
  catch {
    return true
  }
}

const autoScroll = ref(loadAutoScroll())

watch(autoScroll, (value) => {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY_AUTOSCROLL, String(value))
})

const feedTier = computed<FeedTier>(() => {
  const plan = userStore.currentPlan?.product
  if (plan === 'flipper') return 'flipper'
  if (plan) return 'collector'
  return 'free'
})

const isFlipperTier = computed(() => feedTier.value === 'flipper')

// --- Save filter dialog ---
const showSaveFilterDialog = ref(false)
const filterName = ref('')
const filterNotifyType = ref<'firebase' | 'discord' | 'email' | 'none'>('firebase')
const filterNotifyTarget = ref('')

async function saveFlipFilter() {
  if (!filterName.value.trim()) return

  const filterData: Array<{ name: string, value: string }> = []
  filterData.push({ name: 'IsFlipNotification', value: 'true' })
  if (filters.search) filterData.push({ name: 'SearchTerm', value: filters.search })
  if (filters.minProfit > 0) filterData.push({ name: 'MinProfit', value: String(filters.minProfit) })
  if (filters.minRefs > 0) filterData.push({ name: 'MinReferences', value: String(filters.minRefs) })
  if (filters.category) filterData.push({ name: 'ContainsKeyWord', value: JSON.stringify([filters.category]) })

  const targetTypeMap: Record<string, string> = {
    firebase: 'FireBase',
    discord: 'DiscordWebhook',
    email: 'Email',
    none: 'Unknown',
  }

  let target = ''
  if (filterNotifyType.value === 'firebase') target = userStore.notificationToken || ''
  else if (filterNotifyType.value !== 'none') target = filterNotifyTarget.value

  try {
    await $fetch('/api/filters', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userStore.token}` },
      body: {
        userId: userStore.user?.id ?? '',
        name: filterName.value.trim(),
        filters: filterData,
        target,
        targetType: targetTypeMap[filterNotifyType.value],
      },
    })
    showSaveFilterDialog.value = false
    filterName.value = ''
    filterNotifyTarget.value = ''
    push.success(useI18n().t('filterSaved'))
  }
  catch (error) {
    console.error('Failed to save filter:', error)
    push.error(useI18n().t('errorSavingFilter'))
  }
}

// --- Filters (persisted to localStorage) ---
const defaultFilters = { search: '', minProfit: 0, minMarginPct: 0, minRefs: 0, category: '', maxDistance: 0 }
const filters = reactive(loadFilters())

// --- Sort & Location ---
const sortMode = ref<'newest' | 'profit' | 'distance'>('newest')
const userLocation = ref<{ lat: number, lng: number } | null>(null)
const locationZip = ref('')
const locationLabel = ref('')
const locationError = ref('')

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radiusKm = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getFlipDistance(flip: Flip): number | null {
  if (!userLocation.value) return null
  const lat = flip.listing?.latitude
  const lng = flip.listing?.longitude
  if (lat == null || lng == null) return null
  return haversineDistance(userLocation.value.lat, userLocation.value.lng, lat, lng)
}

function useDeviceLocation() {
  locationError.value = ''
  if (!navigator.geolocation) {
    locationError.value = useI18n().t('geolocationNotSupported')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation.value = { lat: position.coords.latitude, lng: position.coords.longitude }
      locationLabel.value = `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`
      if (sortMode.value !== 'distance') sortMode.value = 'distance'
    },
    () => {
      locationError.value = useI18n().t('geolocationDenied')
    },
  )
}

async function geocodeZip() {
  if (!locationZip.value.trim()) return
  locationError.value = ''

  try {
    const query = encodeURIComponent(locationZip.value.trim())
    const result = await $fetch<Array<{ lat: string, lon: string, display_name: string }>>(`https://nominatim.openstreetmap.org/search?postalcode=${query}&format=json&limit=1`, {
      headers: { 'User-Agent': 'ane.deals' },
    })

    if (result.length === 0) {
      locationError.value = useI18n().t('zipNotFound')
      return
    }

    const match = result[0]
    if (!match) {
      locationError.value = useI18n().t('zipNotFound')
      return
    }

    userLocation.value = {
      lat: Number.parseFloat(match.lat),
      lng: Number.parseFloat(match.lon),
    }
    locationLabel.value = match.display_name.split(',').slice(0, 2).join(', ')
    if (sortMode.value !== 'distance') sortMode.value = 'distance'
  }
  catch {
    locationError.value = useI18n().t('zipNotFound')
  }
}

function loadFilters() {
  if (import.meta.server) return { ...defaultFilters }
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FILTERS)
    return saved ? { ...defaultFilters, ...JSON.parse(saved) } : { ...defaultFilters }
  }
  catch {
    return { ...defaultFilters }
  }
}

function saveFilters() {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters))
}

const hasActiveFilters = computed(() =>
  filters.search !== '' || filters.minProfit > 0 || filters.minMarginPct > 0 || filters.minRefs > 0 || filters.category !== '' || filters.maxDistance > 0,
)

function clearFilters() {
  Object.assign(filters, defaultFilters)
}

watch(filters, saveFilters)

// --- Bookmarks (persisted to localStorage) ---
const bookmarkedFlips = ref<Flip[]>(loadBookmarks())

function loadBookmarks(): Flip[] {
  if (import.meta.server) return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BOOKMARKS)
    return saved ? JSON.parse(saved) : []
  }
  catch {
    return []
  }
}

function saveBookmarks() {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarkedFlips.value))
}

function isBookmarked(flip: Flip): boolean {
  return bookmarkedFlips.value.some(bookmark => bookmark.listing?.id === flip.listing?.id)
}

function toggleBookmark(flip: Flip) {
  if (isBookmarked(flip)) {
    bookmarkedFlips.value = bookmarkedFlips.value.filter(bookmark => bookmark.listing?.id !== flip.listing?.id)
  }
  else {
    bookmarkedFlips.value = [...bookmarkedFlips.value, JSON.parse(JSON.stringify(flip))]
  }
  saveBookmarks()
}

function handleFlipClick(flip: Flip) {
  if (isBookmarked(flip)) return
  bookmarkedFlips.value = [...bookmarkedFlips.value, JSON.parse(JSON.stringify(flip))]
  saveBookmarks()
}

function confirmDeleteBookmark(flip: Flip) {
  deleteTarget.value = flip
}

function removeBookmark(flip: Flip) {
  bookmarkedFlips.value = bookmarkedFlips.value.filter(bookmark => bookmark.listing?.id !== flip.listing?.id)
  saveBookmarks()
  deleteTarget.value = null
}

function getAuthHeaders() {
  if (!userStore.token) return undefined
  return { Authorization: `Bearer ${userStore.token}` }
}

function isActiveSubscription(subscription: ActiveSubscription): boolean {
  return !subscription.endsAt || new Date(subscription.endsAt) > new Date()
}

function pickCurrentPlan(subscriptions: ActiveSubscription[]): ActiveSubscription | null {
  const activeSubscriptions = subscriptions.filter(isActiveSubscription)
  return activeSubscriptions.find(subscription => subscription.product === 'flipper') ?? activeSubscriptions[0] ?? null
}

async function syncCurrentPlan() {
  await userStore.checkAuth(useFirebaseAuth()!)
  if (!userStore.token) {
    userStore.currentPlan = null
    return
  }

  try {
    const subscriptions = await getSubscription({
      composable: '$fetch',
      headers: { Authorization: `Bearer ${userStore.token}` },
    })
    userStore.currentPlan = pickCurrentPlan(subscriptions)
  }
  catch (error) {
    console.error('Failed to refresh current plan:', error)
  }
}

function getFlipTimestamp(flip: Flip): number {
  const value = flip.foundAt ?? flip.listing?.foundAt ?? flip.listing?.createdAt ?? ''
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function getFlipKey(flip: Flip): string {
  return flip.listing?.id ?? `${getFlipTimestamp(flip)}:${flip.listing?.title ?? ''}:${flip.listing?.price ?? ''}`
}

function sortByFoundAt(flips: Flip[]): Flip[] {
  return [...flips].sort((left, right) => getFlipTimestamp(left) - getFlipTimestamp(right))
}

function trimFeed(flips: Flip[]): Flip[] {
  return sortByFoundAt(flips).slice(-MAX_FEED_ITEMS)
}

function getKnownFlipKeys(): Set<string> {
  const knownKeys = new Set<string>()
  for (const item of items.value)
    knownKeys.add(getFlipKey(item))
  for (const item of replayQueue.value)
    knownKeys.add(getFlipKey(item))
  return knownKeys
}

function prepareIncomingFlips(flips: Flip[]): Flip[] {
  const knownKeys = getKnownFlipKeys()
  return sortByFoundAt(flips).filter((flip) => {
    const key = getFlipKey(flip)
    if (knownKeys.has(key)) return false
    knownKeys.add(key)
    return true
  })
}

async function scrollToLatest(behavior: ScrollBehavior = 'smooth') {
  await nextTick()
  if (!scrollContainer.value) return
  scrollContainer.value.scrollTo({ left: scrollContainer.value.scrollWidth, behavior })
}

async function commitFlips(flips: Flip[], behavior: ScrollBehavior = 'smooth', forceScroll = false) {
  if (flips.length === 0) return
  const wasEmpty = items.value.length === 0
  items.value = trimFeed([...items.value, ...flips])
  if (forceScroll || autoScroll.value || wasEmpty)
    await scrollToLatest(behavior)
}

function stopReplayLoop() {
  if (!replayTimer) return
  clearTimeout(replayTimer)
  replayTimer = null
}

function getFreeReplayDelayMs(queueLength = replayQueue.value.length): number {
  if (queueLength <= 0)
    return FREE_REPLAY_MIN_INTERVAL_MS

  if (!nextFreeBackfillAt)
    return FREE_REPLAY_FALLBACK_INTERVAL_MS

  const remainingWindowMs = Math.max(
    FREE_REPLAY_MIN_INTERVAL_MS,
    nextFreeBackfillAt - Date.now() - FREE_REPLAY_COMPLETION_BUFFER_MS,
  )
  const calculatedDelayMs = Math.floor(remainingWindowMs / queueLength)

  return Math.min(
    FREE_REPLAY_MAX_INTERVAL_MS,
    Math.max(FREE_REPLAY_MIN_INTERVAL_MS, calculatedDelayMs),
  )
}

function scheduleReplayTick(forceReschedule = false) {
  if (replayQueue.value.length === 0) {
    stopReplayLoop()
    return
  }

  if (forceReschedule)
    stopReplayLoop()

  if (replayTimer)
    return

  replayTimer = setTimeout(async () => {
    replayTimer = null

    const nextFlip = replayQueue.value.shift()
    if (!nextFlip) {
      stopReplayLoop()
      return
    }

    await commitFlips([nextFlip])
    scheduleReplayTick()
  }, getFreeReplayDelayMs())
}

async function enqueueReplayFlips(flips: Flip[]) {
  if (flips.length === 0) return

  const shouldPrimeImmediately = items.value.length === 0 && replayQueue.value.length === 0
  replayQueue.value = [...replayQueue.value, ...flips]

  if (shouldPrimeImmediately) {
    const initialVisibleCount = Math.min(FREE_INITIAL_VISIBLE_COUNT, replayQueue.value.length)
    const initialFlips = replayQueue.value.splice(0, initialVisibleCount)
    if (initialFlips.length > 0)
      await commitFlips(initialFlips, 'auto', true)
  }

  scheduleReplayTick(true)
}

async function appendIncomingFlips(flips: Flip[]) {
  const incoming = prepareIncomingFlips(flips)
  if (incoming.length === 0) return

  if (feedTier.value === 'free') {
    await enqueueReplayFlips(incoming)
    return
  }

  const initialLoad = items.value.length === 0
  await commitFlips(incoming, initialLoad ? 'auto' : 'smooth', initialLoad)
}

function clearLiveReconnectTimer() {
  if (!liveReconnectTimer) return
  clearTimeout(liveReconnectTimer)
  liveReconnectTimer = null
}

function disconnectLiveFlips() {
  allowLiveReconnect = false
  clearLiveReconnectTimer()

  if (!liveSocket) return

  const socket = liveSocket
  liveSocket = null
  if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
    socket.close()
}

function buildLiveFlipsUrl(): string | null {
  if (!userStore.token) return null

  const url = new URL(`/api/flips/live/${selectedCategory.value}`, apiClient.getConfig().baseURL)
  url.searchParams.set('token', userStore.token)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

function scheduleLiveReconnect() {
  if (!allowLiveReconnect) return

  clearLiveReconnectTimer()
  const delay = Math.min(30000, 1000 * 2 ** Math.min(liveReconnectAttempt, 5))
  liveReconnectTimer = setTimeout(() => {
    liveReconnectTimer = null
    void connectLiveFlips()
  }, delay)
}

async function connectLiveFlips() {
  if (feedTier.value === 'free') return
  if (liveSocket && (liveSocket.readyState === WebSocket.OPEN || liveSocket.readyState === WebSocket.CONNECTING)) return

  const url = buildLiveFlipsUrl()
  if (!url) return

  allowLiveReconnect = true
  const socket = new WebSocket(url)
  liveSocket = socket

  socket.onopen = () => {
    liveReconnectAttempt = 0
  }

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as LiveFlipMessage
      if (message.type !== 'flip' || !message.flip) return
      void appendIncomingFlips([message.flip])
    }
    catch (error) {
      console.error('Failed to parse live flip message:', error)
    }
  }

  socket.onerror = () => {
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
      socket.close()
  }

  socket.onclose = () => {
    if (liveSocket === socket)
      liveSocket = null

    if (!allowLiveReconnect) return
    liveReconnectAttempt += 1
    scheduleLiveReconnect()
  }
}

function restartLiveTransport() {
  disconnectLiveFlips()
  if (feedTier.value !== 'free')
    void connectLiveFlips()
}

function restartRefreshLoop() {
  if (refreshInterval)
    clearInterval(refreshInterval)

  const interval = feedTier.value === 'free' ? FREE_BACKFILL_INTERVAL_MS : PREMIUM_BACKFILL_INTERVAL_MS
  nextFreeBackfillAt = feedTier.value === 'free' ? Date.now() + interval : null

  refreshInterval = setInterval(() => {
    if (feedTier.value === 'free')
      nextFreeBackfillAt = Date.now() + FREE_BACKFILL_INTERVAL_MS
    void loadFlips(true)
  }, interval)

  if (feedTier.value === 'free')
    scheduleReplayTick(true)
}

function resetFeedState() {
  items.value = []
  replayQueue.value = []
  loading.value = true
  stopReplayLoop()
  disconnectLiveFlips()
  nextFreeBackfillAt = null
}

async function loadFlips(isRefresh = false) {
  if (!isRefresh) loading.value = true

  try {
    await userStore.checkAuth(useFirebaseAuth()!)
    if (feedTier.value === 'free' && !nextFreeBackfillAt)
      nextFreeBackfillAt = Date.now() + FREE_BACKFILL_INTERVAL_MS
    const headers = getAuthHeaders()
    const response = await getFlips({
      composable: '$fetch',
      path: { category: selectedCategory.value },
      query: { limit: FEED_LIMIT },
      ...(headers ? { headers } : {}),
    })

    const newItems = (Array.isArray(response) ? response : Array.from(response ?? [])) as Flip[]
    if (!newItems.length && !isRefresh && items.value.length === 0) {
      items.value = []
      replayQueue.value = []
      return
    }

    await appendIncomingFlips(newItems)
  }
  catch (error) {
    console.error('Failed to load flips:', error)
    if (!isRefresh) {
      items.value = []
      replayQueue.value = []
    }
  }
  finally {
    if (!isRefresh) loading.value = false
  }
}

async function refreshFeed() {
  resetFeedState()
  await loadFlips()
  restartRefreshLoop()
  restartLiveTransport()
}

// --- Filtering ---
const filteredItems = computed(() => {
  let result = items.value.filter((item) => {
    const listing = item.listing
    const profit = item.potentialProfit ?? 0
    const price = listing?.price ?? 0
    const median = item.medianPrice ?? 0
    const marginPct = price > 0 ? ((median - price) / price) * 100 : 0
    const refs = item.recentSells?.length ?? 0

    if (filters.minProfit > 0 && profit < filters.minProfit) return false
    if (filters.minMarginPct > 0 && marginPct < filters.minMarginPct) return false
    if (filters.minRefs > 0 && refs < filters.minRefs) return false

    if (filters.search) {
      const query = filters.search.toLowerCase()
      const title = (listing?.title ?? '').toLowerCase()
      const description = (listing?.descriptionShort ?? '').toLowerCase()
      if (!title.includes(query) && !description.includes(query)) return false
    }

    if (filters.category) {
      const category = filters.category.toLowerCase()
      const listingCategory = (listing?.category ?? '').toLowerCase()
      const sellKeys = (item.recentSells ?? []).map(sell => (sell.key ?? '').toLowerCase())
      if (!listingCategory.includes(category) && !sellKeys.some(key => key.includes(category))) return false
    }

    if (filters.maxDistance > 0 && userLocation.value) {
      const distance = getFlipDistance(item)
      if (distance != null && distance > filters.maxDistance) return false
    }

    return true
  })

  if (sortMode.value === 'profit') {
    result = [...result].sort((left, right) => (right.potentialProfit ?? 0) - (left.potentialProfit ?? 0))
  }
  else if (sortMode.value === 'distance' && userLocation.value) {
    result = [...result].sort((left, right) => {
      const leftDistance = getFlipDistance(left)
      const rightDistance = getFlipDistance(right)
      if (leftDistance == null && rightDistance == null) return 0
      if (leftDistance == null) return 1
      if (rightDistance == null) return -1
      return leftDistance - rightDistance
    })
  }

  return result
})

onMounted(async () => {
  await syncCurrentPlan()
  await loadFlips()
  restartRefreshLoop()
  restartLiveTransport()
  hasInitializedFeed.value = true

  if (scrollContainer.value) {
    const wheelHandler = (event: WheelEvent) => {
      event.preventDefault()
      scrollContainer.value!.scrollLeft += event.deltaY
    }

    scrollContainer.value.addEventListener('wheel', wheelHandler, { passive: false })
    removeWheelHandler = () => scrollContainer.value?.removeEventListener('wheel', wheelHandler)
  }
})

onBeforeUnmount(() => {
  removeWheelHandler?.()
  if (refreshInterval)
    clearInterval(refreshInterval)
  stopReplayLoop()
  disconnectLiveFlips()
  clearLiveReconnectTimer()
})

watch([feedTier, selectedCategory, () => userStore.token], async ([nextTier, nextCategory, nextToken], [previousTier, previousCategory, previousToken]) => {
  if (!hasInitializedFeed.value) return

  if (nextToken !== previousToken)
    await syncCurrentPlan()

  if (nextTier === previousTier && nextCategory === previousCategory && nextToken === previousToken)
    return

  await refreshFeed()
})

useHead({
  title: computed(() => t('flipper.seo.title')),
  meta: [
    { name: 'description', content: computed(() => t('flipper.seo.intro')) },
  ],
})
</script>

<style scoped>
/* Smooth scroll-in for new flip items from the right */
.flip-item {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

/* TransitionGroup animations - new items slide in from the right */
.flip-slide-enter-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.flip-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.flip-slide-enter-from {
  opacity: 0;
  transform: translateX(80px) scale(0.9);
}
.flip-slide-leave-to {
  opacity: 0;
  transform: translateX(-40px) scale(0.9);
}
.flip-slide-move {
  transition: transform 0.5s ease;
}
</style>
