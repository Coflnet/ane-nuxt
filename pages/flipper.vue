<template>
  <div>
    <h1 class="mb-8">
      <UiHeaderLabel
        :label="$t('newFlips')"
        :xl="true"
      />
    </h1>

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
        <div class="ml-auto text-xs text-gray-500">
          {{ filteredItems.length }}/{{ items.length }} {{ $t('flips') }}
        </div>
      </div>
    </UiDefaultContainer>

    <!-- Feed -->
    <UiDefaultContainer class="mb-6 p-6 relative">
      <div
        ref="scrollContainer"
        class="overflow-x-auto py-4"
        style="direction: rtl;"
      >
        <div
          class="flex gap-6 w-max "
          style="direction: ltr;"
        >
          <TransitionGroup name="flip-slide">
            <div
              v-for="item in filteredItems"
              :key="item.listing!.id ?? ''"
              :class="{ 'flip-hidden': hiddenIds.has(item.listing!.id ?? '') }"
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
        <div class="overflow-x-auto py-4" style="direction: rtl;">
          <div class="flex gap-6 w-max" style="direction: ltr;">
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

const items = ref<Flip[]>([])
const loading = ref(true)
const scrollContainer = ref<HTMLElement | null>(null)
const route = useRoute()
const userStore = useUserStore()
const deleteTarget = ref<Flip | null>(null)
const hiddenIds = ref<Set<string>>(new Set())
const isFirstLoad = ref(true)

const FEED_LIMIT = 24
const MAX_FEED_ITEMS = 100

let removeWheelHandler: (() => void) | null = null
let refreshInterval: ReturnType<typeof setInterval> | null = null

// --- Filters (persisted to localStorage) ---
const defaultFilters = { search: '', minProfit: 0, minMarginPct: 0, minRefs: 0, category: '' }
const filters = reactive(loadFilters())

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
  filters.search !== '' || filters.minProfit > 0 || filters.minMarginPct > 0 || filters.minRefs > 0 || filters.category !== '',
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
      
      const el = scrollContainer.value
      const isAtRight = !el || Math.abs(el.scrollLeft) <= 10

      const existingIds = new Set(items.value.map(i => i.listing?.id))
      const added = newItems.filter(i => !existingIds.has(i.listing?.id))
      
      if (added.length > 0) {
        if (isFirstLoad.value) {
          // First load: show all items but hide first two, then reveal with 5s stagger
          items.value = [...added, ...items.value].slice(0, MAX_FEED_ITEMS)
          isFirstLoad.value = false

          const revealIds = added.slice(0, 2).map(i => i.listing?.id ?? '')
          hiddenIds.value = new Set(revealIds)

          // Reveal first item after 5s, second after 10s
          for (let i = 0; i < revealIds.length; i++) {
            const id = revealIds[i]
            if (id) {
              setTimeout(() => {
                hiddenIds.value = new Set([...hiddenIds.value].filter(x => x !== id))
              }, (i + 1) * 5000)
            }
          }
        } else {
          // Subsequent loads: hide new items, add them, then reveal with stagger
          const addedIds = added.map(i => i.listing?.id ?? '').filter(Boolean)
          hiddenIds.value = new Set([...hiddenIds.value, ...addedIds])
          items.value = [...added, ...items.value].slice(0, MAX_FEED_ITEMS)
          
          // Stagger reveal each new item 300ms apart
          addedIds.forEach((id, i) => {
            setTimeout(() => {
              hiddenIds.value = new Set([...hiddenIds.value].filter(x => x !== id))
            }, (i + 1) * 300)
          })
        }
        
        if (isAtRight) {
          nextTick(() => {
            if (scrollContainer.value) {
              scrollContainer.value.scrollLeft = 0
            }
          })
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
  return items.value.filter((item) => {
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

    return true
  })
})

onMounted(() => {
  loadFlips()
  refreshInterval = setInterval(() => loadFlips(true), 60000)

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
/* Smooth scroll-in for new flip items */
.flip-item {
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.flip-hidden {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* TransitionGroup animations for items entering/leaving */
.flip-slide-enter-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.flip-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.flip-slide-enter-from {
  opacity: 0;
  transform: translateX(-40px) scale(0.9);
}
.flip-slide-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}
.flip-slide-move {
  transition: transform 0.5s ease;
}
</style>
