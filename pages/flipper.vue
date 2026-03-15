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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import type { Flip } from '~/src/api-client/types.gen'
import { getFlips } from '~/src/api-client'
import { useCategories } from '~/composable/useCategories'

const selectedMarketplace = ref('all')
const items = ref<Flip[]>([])
const loading = ref(true)
const scrollContainer = ref<HTMLElement | null>(null)
const route = useRoute()
const userStore = useUserStore()
const { fetchTopLevelCategories } = useCategories()

const FEED_LIMIT = 24
const PER_CATEGORY_LIMIT = 3

let removeWheelHandler: (() => void) | null = null

function getAuthHeaders() {
  if (!userStore.token) {
    return undefined
  }

  return { Authorization: `Bearer ${userStore.token}` }
}

function getFeedCategories(categoryLabels: string[]) {
  const requestedCategory = typeof route.query.category === 'string'
    ? route.query.category.trim()
    : ''

  if (requestedCategory) {
    return [requestedCategory]
  }

  return categoryLabels
}

function mergeFlips(flipsByCategory: Flip[][]) {
  const seenListingIds = new Set<string>()

  return flipsByCategory
    .flat()
    .filter((flip) => {
      const listingId = flip.listing?.id
      if (!listingId || seenListingIds.has(listingId)) {
        return false
      }

      seenListingIds.add(listingId)
      return true
    })
    .sort((left, right) => {
      const rightFoundAt = Date.parse(right.foundAt ?? '')
      const leftFoundAt = Date.parse(left.foundAt ?? '')

      if (!Number.isNaN(rightFoundAt) && !Number.isNaN(leftFoundAt) && rightFoundAt !== leftFoundAt) {
        return rightFoundAt - leftFoundAt
      }

      return (right.potentialProfit ?? 0) - (left.potentialProfit ?? 0)
    })
    .slice(0, FEED_LIMIT)
}

async function loadFlips() {
  loading.value = true
  try {
    await userStore.checkAuth(useFirebaseAuth()!)

    const topLevelCategories = await fetchTopLevelCategories()
    const categoryLabels = topLevelCategories
      .map(category => category.label?.trim())
      .filter((category): category is string => Boolean(category))
    const feedCategories = getFeedCategories(categoryLabels)
    const headers = getAuthHeaders()

    if (feedCategories.length === 0) {
      items.value = []
      return
    }

    const flipResponses = await Promise.allSettled(
      feedCategories.map(category =>
        getFlips({
          composable: '$fetch',
          path: { category },
          query: { limit: PER_CATEGORY_LIMIT },
          ...(headers ? { headers } : {}),
        }),
      ),
    )

    const successfulResponses = flipResponses
      .filter((result): result is PromiseFulfilledResult<Flip[]> => result.status === 'fulfilled' && Array.isArray(result.value))
      .map(result => result.value)

    items.value = mergeFlips(successfulResponses)
  }
  catch (e) {
    console.error('Failed to load flips:', e)
    items.value = []
  }
  finally {
    loading.value = false
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
  if (scrollContainer.value) {
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault()
      scrollContainer.value!.scrollLeft += e.deltaY
    }

    scrollContainer.value.addEventListener('wheel', wheelHandler)
    removeWheelHandler = () => scrollContainer.value?.removeEventListener('wheel', wheelHandler)
  }
})

onBeforeUnmount(() => {
  removeWheelHandler?.()
})

watch(() => route.query.category, () => {
  loadFlips()
})

useHead({
  title: 'Flipper Dashboard',
  meta: [
    { name: 'description', content: 'Real-time marketplace flipping opportunities' },
  ],
})
</script>
