<template>
  <div>
    <h1 class="mb-8">
      <UiHeaderLabel
        :label="$t('newFlips')"
        :xl="true"
      />
    </h1>
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
          <div
            v-for="item in filteredItems"
            :key="item.listing!.id ?? ''"
          >
            <FlipperFlipItem :item="item" />
          </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import type { Flip } from '~/src/api-client/types.gen'
import { getFlips } from '~/src/api-client'

const selectedMarketplace = ref('all')
const items = ref<Flip[]>([])
const loading = ref(true)
const scrollContainer = ref<HTMLElement | null>(null)
const route = useRoute()
const userStore = useUserStore()

const FEED_LIMIT = 24
const MAX_FEED_ITEMS = 100

let removeWheelHandler: (() => void) | null = null
let refreshInterval: ReturnType<typeof setInterval> | null = null

function getAuthHeaders() {
  if (!userStore.token) {
    return undefined
  }

  return { Authorization: `Bearer ${userStore.token}` }
}

async function loadFlips(isRefresh = false) {
  if (!isRefresh) loading.value = true
  try {
    await userStore.checkAuth(useFirebaseAuth()!)

    const headers = getAuthHeaders()

    // 1 is the partition key for combined flips
    const response = await getFlips({
      composable: '$fetch',
      path: { category: '1' },
      query: { limit: FEED_LIMIT },
      ...(headers ? { headers } : {}),
    })

    if (response) {
      const newItems = Array.isArray(response) ? response : Array.from(response)
      
      const el = scrollContainer.value
      // Check if user is scrolled to the very right (since it's RTL, scrollLeft is ~0)
      const isAtRight = !el || Math.abs(el.scrollLeft) <= 10

      const existingIds = new Set(items.value.map(i => i.listing?.id))
      const added = newItems.filter(i => !existingIds.has(i.listing?.id))
      
      if (added.length > 0) {
        items.value = [...added, ...items.value].slice(0, MAX_FEED_ITEMS)
        
        if (isAtRight) {
          nextTick(() => {
            if (scrollContainer.value) {
              scrollContainer.value.scrollLeft = 0
            }
          })
        }
      } else if (items.value.length === 0) {
        items.value = newItems
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

const filteredItems = computed(() => {
  if (selectedMarketplace.value === 'all') {
    return items.value
  }
  return items.value.filter(item =>
    item.listing?.platform?.toLowerCase() === selectedMarketplace.value,
  )
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
