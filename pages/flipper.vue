<template>
  <div>
    <h1 class="mb-8">
      <UiHeaderLabel
        :label="$t('newFlips')"
        :xl="true"
      />
    </h1>

    <!-- Flipper Tier Banner -->
    <UiDefaultContainer
      v-if="!isFlipperTier"
      class="mb-4 p-4 border border-indigo-500/30 bg-indigo-900/20"
    >
      <div class="flex items-center justify-between flex-wrap gap-3">
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
        <!-- Save Filter & Notify Button -->
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

    <!-- Distance Sort & Location (Flipper tier feature) -->
    <UiDefaultContainer class="mb-4 p-4" :class="{ 'opacity-60 pointer-events-none select-none': !isFlipperTier }">
      <div class="flex flex-wrap gap-3 items-end">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-400">{{ $t('sortBy') }}</label>
          <select
            v-model="sortMode"
            :disabled="!isFlipperTier"
            class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-40 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed"
          >
            <option value="newest">{{ $t('sortNewest') }}</option>
            <option value="profit">{{ $t('sortProfit') }}</option>
            <option value="distance">{{ $t('sortDistance') }}</option>
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
              <Icon name="tabler:current-location" class="w-4 h-4" />
              {{ $t('useGPS') }}
            </button>
          </div>
        </div>
        <div v-if="userLocation" class="flex items-center gap-2 text-xs text-green-400">
          <Icon name="tabler:map-pin" class="w-4 h-4" />
          {{ locationLabel }}
        </div>
        <div v-if="locationError" class="text-xs text-red-400">
          {{ locationError }}
        </div>
        <div v-if="sortMode === 'distance' && filters.maxDistance > 0" class="flex flex-col gap-1">
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
      <div v-if="!isFlipperTier" class="mt-2 flex items-center gap-2">
        <Icon name="tabler:lock" class="w-4 h-4 text-indigo-400" />
        <span class="text-xs text-indigo-400">
          {{ $t('distanceSortFlipperOnly') }}
          <NuxtLink :to="localePath('/subscriptions') + '?discount=EARLY'" class="underline hover:text-indigo-300">{{ $t('upgrade') }}</NuxtLink>
        </span>
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
          <h3 class="text-lg font-bold text-white mb-2">{{ $t('removeBookmark') }}</h3>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import type { Flip } from '~/src/api-client/types.gen'
import { getFlips } from '~/src/api-client'

const STORAGE_KEY_FILTERS = 'flipper-filters'
const STORAGE_KEY_BOOKMARKS = 'flipper-bookmarks'
const STORAGE_KEY_AUTOSCROLL = 'flipper-autoscroll'

const items = ref<Flip[]>([])
const loading = ref(true)
const scrollContainer = ref<HTMLElement | null>(null)

function loadAutoScroll(): boolean {
  if (import.meta.server) return true
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUTOSCROLL)
    return saved === null ? true : saved === 'true'
  } catch { return true }
}
const autoScroll = ref(loadAutoScroll())
watch(autoScroll, (val) => {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY_AUTOSCROLL, String(val))
})
const route = useRoute()
const userStore = useUserStore()
const deleteTarget = ref<Flip | null>(null)
const isFirstLoad = ref(true)
const localePath = useLocalePath()

// --- Flipper tier check ---
const isFlipperTier = computed(() => {
  const plan = userStore.currentPlan?.product
  return plan === 'flipper'
})

// --- Save filter dialog ---
const showSaveFilterDialog = ref(false)
const filterName = ref('')
const filterNotifyType = ref<'firebase' | 'discord' | 'email' | 'none'>('firebase')
const filterNotifyTarget = ref('')

async function saveFlipFilter() {
  if (!filterName.value.trim()) return

  const filterData: Array<{ name: string, value: string }> = []
  // Mark this as a flip notification (not a regular listing filter)
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
  catch (e) {
    console.error('Failed to save filter:', e)
    push.error(useI18n().t('errorSavingFilter'))
  }
}

const FEED_LIMIT = 24
const MAX_FEED_ITEMS = 100

let removeWheelHandler: (() => void) | null = null
let refreshInterval: ReturnType<typeof setInterval> | null = null

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
  const R = 6371 // km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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
    (pos) => {
      userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      locationLabel.value = `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`
      locationError.value = ''
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
    const res = await $fetch<Array<{ lat: string, lon: string, display_name: string }>>(`https://nominatim.openstreetmap.org/search?postalcode=${query}&format=json&limit=1`, {
      headers: { 'User-Agent': 'ane.deals' },
    })
    if (res.length === 0) {
      locationError.value = useI18n().t('zipNotFound')
      return
    }
    userLocation.value = { lat: parseFloat(res[0].lat), lng: parseFloat(res[0].lon) }
    locationLabel.value = res[0].display_name.split(',').slice(0, 2).join(', ')
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
  } catch { return { ...defaultFilters } }
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
  } catch { return [] }
}

function saveBookmarks() {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarkedFlips.value))
}

function isBookmarked(flip: Flip): boolean {
  return bookmarkedFlips.value.some(b => b.listing?.id === flip.listing?.id)
}

function toggleBookmark(flip: Flip) {
  if (isBookmarked(flip)) {
    bookmarkedFlips.value = bookmarkedFlips.value.filter(b => b.listing?.id !== flip.listing?.id)
  } else {
    bookmarkedFlips.value = [...bookmarkedFlips.value, JSON.parse(JSON.stringify(flip))]
  }
  saveBookmarks()
}

function handleFlipClick(flip: Flip) {
  if (!isBookmarked(flip)) {
    bookmarkedFlips.value = [...bookmarkedFlips.value, JSON.parse(JSON.stringify(flip))]
    saveBookmarks()
  }
}

function confirmDeleteBookmark(flip: Flip) {
  deleteTarget.value = flip
}

function removeBookmark(flip: Flip) {
  bookmarkedFlips.value = bookmarkedFlips.value.filter(b => b.listing?.id !== flip.listing?.id)
  saveBookmarks()
  deleteTarget.value = null
}

// --- Data loading ---
function getAuthHeaders() {
  if (!userStore.token) return undefined
  return { Authorization: `Bearer ${userStore.token}` }
}

async function loadFlips(isRefresh = false) {
  if (!isRefresh) loading.value = true
  try {
    await userStore.checkAuth(useFirebaseAuth()!)
    const headers = getAuthHeaders()

    const response = await getFlips({
      composable: '$fetch',
      path: { category: '1' },
      query: { limit: FEED_LIMIT },
      ...(headers ? { headers } : {}),
    })

    if (response) {
      const newItems = (Array.isArray(response) ? response : Array.from(response)) as Flip[]

      const existingIds = new Set(items.value.map(i => i.listing?.id))
      const added = newItems.filter(i => !existingIds.has(i.listing?.id))
      
if (added.length > 0) {
        let toAddImmediately = added
        let toAddLater: typeof added = []

        if (isFirstLoad.value && added.length >= 3) {
          // Hold back 2 newest to animate in at 5s and 10s
          toAddLater = added.slice(-2)
          toAddImmediately = added.slice(0, -2)
        }

        // Append new items to the right end (newest = rightmost)
        items.value = [...items.value, ...toAddImmediately].slice(-MAX_FEED_ITEMS)

        if (isFirstLoad.value) {
          isFirstLoad.value = false
          // First load: start at left (oldest), smooth-scroll right to newest
          await nextTick()
          const el = scrollContainer.value
          if (el) {
            el.scrollLeft = 0
            setTimeout(() => {
              el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
            }, 300)

            // Simulate 2 more flips arriving
            if (toAddLater.length > 0) {
              const addNewItem = async (item: Flip) => {
                const existing = new Set(items.value.map(i => i.listing?.id))
                if (existing.has(item.listing?.id)) return
                items.value = [...items.value, item].slice(-MAX_FEED_ITEMS)
                await nextTick()
                if (autoScroll.value && scrollContainer.value) {
                  scrollContainer.value.scrollTo({ left: scrollContainer.value.scrollWidth, behavior: 'smooth' })
                }
              }

              if (toAddLater[0]) setTimeout(() => addNewItem(toAddLater[0]!), 8000)
              if (toAddLater[1]) setTimeout(() => addNewItem(toAddLater[1]!), 15000)
            }
          }
        } else {
          // Subsequent refresh: scroll right to reveal new items if autoScroll is on
          if (autoScroll.value) {
            await nextTick()
            const el = scrollContainer.value
            if (el) {
              el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
            }
          }
        }
      } else if (items.value.length === 0) {
        items.value = newItems
        isFirstLoad.value = false
      }
    } else if (!isRefresh) {
       items.value = []
    }
  }
  catch (e) {
    console.error('Failed to load flips:', e)
    if (!isRefresh) items.value = []
  }
  finally {
    if (!isRefresh) loading.value = false
  }
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
      const q = filters.search.toLowerCase()
      const title = (listing?.title ?? '').toLowerCase()
      const desc = (listing?.descriptionShort ?? '').toLowerCase()
      if (!title.includes(q) && !desc.includes(q)) return false
    }

    if (filters.category) {
      const cat = filters.category.toLowerCase()
      const listingCat = (listing?.category ?? '').toLowerCase()
      const sellKeys = (item.recentSells ?? []).map(s => (s.key ?? '').toLowerCase())
      if (!listingCat.includes(cat) && !sellKeys.some(k => k.includes(cat))) return false
    }

    // Max distance filter
    if (filters.maxDistance > 0 && userLocation.value) {
      const dist = getFlipDistance(item)
      if (dist != null && dist > filters.maxDistance) return false
    }

    return true
  })

  // Sort
  if (sortMode.value === 'profit') {
    result = [...result].sort((a, b) => (b.potentialProfit ?? 0) - (a.potentialProfit ?? 0))
  }
  else if (sortMode.value === 'distance' && userLocation.value) {
    result = [...result].sort((a, b) => {
      const da = getFlipDistance(a)
      const db = getFlipDistance(b)
      // Items without coordinates go to the end
      if (da == null && db == null) return 0
      if (da == null) return 1
      if (db == null) return -1
      return da - db
    })
  }

  return result
})

onMounted(() => {
  loadFlips()
  // Flipper tier gets faster refresh (15s vs 60s)
  const interval = isFlipperTier.value ? 15000 : 60000
  refreshInterval = setInterval(() => loadFlips(true), interval)

  if (scrollContainer.value) {
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault()
      const el = scrollContainer.value!
      el.scrollLeft += e.deltaY
    }

    scrollContainer.value.addEventListener('wheel', wheelHandler, { passive: false })
    removeWheelHandler = () => scrollContainer.value?.removeEventListener('wheel', wheelHandler)
  }
})

onBeforeUnmount(() => {
  removeWheelHandler?.()
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

watch(() => route.query.category, () => {
  items.value = []
  loadFlips()
})

useHead({
  title: 'Flipper Dashboard',
  meta: [
    { name: 'description', content: 'Real-time marketplace flipping opportunities' },
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
