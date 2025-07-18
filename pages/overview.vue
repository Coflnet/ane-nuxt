<template>
  <div>
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1>
          <UiHeaderLabel
            :label="$t('dashboard')"
            :xl="true"
          />
        </h1>
        <UiFooterLabel :label="$t('monitorAuctionAndFilters')" />
      </div>
      <UiCreateFilterButton />
    </div>

    <OverviewStats
      :filter-count="filterCount"
      :matched-auctions="stats.matchedAuctions"
      :notificationper-hour="stats.notificationperHour"
    />

    <OverviewRecentMatchTable
      :matches="listingStore.recentMatches"
      :title="$t('recentMatches')"
      :overview="true"
      :loading="loading"
    />

    <UiGrid :grid-size="2">
      <OverviewTopFilters :top-filters="topFilters" />
      <OverviewPremiumSearchesRemaining />
    </UiGrid>
    <OverviewReferedPopup v-model="openRefered" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FilterMatch } from '~/src/api-client'

import type { TopFilter } from '~/types/FilterType'

const { t } = useI18n()

const openRefered = ref(false)

const loading = ref(true)

const stats = ref({
  activeFilters: 0,
  newFilters: 3,
  matchedAuctions: 0,
  newMatches: 14,
  notificationsSent: 65,
  notificationperHour: 0,
  notificationChannels: 3,
})

const filterStore = useFilterStore()
const listingStore = useListingStore()

const filterCount = computed(() => {
  return filterStore.filters.length
})

const topFilters = ref<{ [id: string]: TopFilter }>({})

async function loadStats() {
  const response = filterStore.getUserFilters
  stats.value.activeFilters = response.length
  getAverageMatchesPerHour(listingStore.recentMatches)

  let matches = 0
  filterStore.getUserFilters.map((i) => {
    matches += i.matchCount ?? 0
    if (!topFilters.value.hasOwnProperty(i.id ?? '')) {
      topFilters.value[String(i.id) as string] = {
        name: i.name ?? '',
        id: String(i.id),
        matches: i.matchCount ?? 0,
        keywords: [],
      }
    }
  })

  stats.value.matchedAuctions = matches
}

function getAverageMatchesPerHour(matches: FilterMatch[]) {
  if (matches.length < 2) {
    stats.value.notificationperHour = matches.length
    return
  }

  const timestamps = matches.map(m => new Date(m.matchedAt ?? ''))

  timestamps.sort((a, b) => a.getTime() - b.getTime())
  const first = timestamps[0]!.getTime()
  const last = timestamps[timestamps.length - 1]!.getTime()

  const hours = (last - first) / (1000 * 60 * 60)
  const safeHours = hours == 0 ? 1 : hours

  stats.value.notificationperHour = Math.round(matches.length / safeHours)
  return
}

onMounted(async () => {
  await useUserStore().checkAuth(useFirebaseAuth()!)

  await Promise.allSettled([filterStore.loadFilters(), listingStore.loadMatches()])
  loadStats()
  filterStore.loadFilters()
  loading.value = false
})

useSeoMeta({
  title: () => t('aneDashboard'),
  ogTitle: () => t('aneDashboard'),
  description: () => t('overviewDescription'),
  ogDescription: () => t('overviewDescription'),
})
</script>
