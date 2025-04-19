<template>
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
    <div>
      <h1>
        <UiHeaderLabel :label="$t('dashboard')" :xl="true" />
      </h1>
      <UiFooterLabel :label="$t('monitorAuctionAndFilters')" />
    </div>
    <UiButton @on-click="navigateTo('/filters/create')" :primary="true">
      <Icon name="tabler:plus" class="size-5" />
      <span class="mr-1">{{ $t('createFilter') }}</span>
    </UiButton>
  </div>

  <OverviewStats :filterCount="filterCount" :matchedAuctions="stats.matchedAuctions"
    :notificationperHour="stats.notificationperHour" />

  <GeneralMatchTable :matches="listingStore.recentMatches" />

  <UiGrid :grid-size="2">
    <TopFilters :top-filters="topFilters" />
    <NotificationChannels />
  </UiGrid>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const stats = ref({
  activeFilters: 0,
  newFilters: 3,
  matchedAuctions: 0,
  newMatches: 14,
  notificationsSent: 65,
  notificationperHour: 0,
  notificationChannels: 3
})

const userStore = useUserStore()
const filterStore = useFilterStore()
const listingStore = useListingStore()

const filterCount = computed(() => {
  return filterStore.filters.length
})


interface topFilter {
  name: string;
  matches: number;
  keywords: string[];
}

const topFilters = ref<{ [id: string]: topFilter }>({})

var apiToken = userStore.token;
apiToken = "Bearer " + apiToken;


async function loadStats() {
  const response = filterStore.getUserFilters;
  stats.value.activeFilters = response.length
  getAverageMatchesPerHour(listingStore.recentMatches)

  var matches = 0;
  filterStore.getUserFilters.map((i) => {
    matches += i.matchCount ?? 0
    if (!topFilters.value.hasOwnProperty(i.id ?? "")) {
      topFilters.value[String(i.id) ?? "" as string] = {
        name: i.name ?? "",
        matches: i.matchCount ?? 0,
        keywords: []
      }
    }
  })

  stats.value.matchedAuctions = matches

}

function getAverageMatchesPerHour(matches: MatchItem[]) {
  if (matches.length < 2) {
    stats.value.notificationperHour = matches.length
    return
  }

  var timestamps = matches.map(m => new Date(m.matchedAt));

  timestamps.sort((a, b) => a.getTime() - b.getTime());
  const first = timestamps[0]!.getTime();
  const last = timestamps[timestamps.length - 1]!.getTime();

  const hours = (last - first) / (1000 * 60 * 60);
  const safeHours = hours == 0 ? 1 : hours;

  stats.value.notificationperHour = Math.round(matches.length / safeHours);
  return
}

function sortTopFilers(): topFilter[] {
  const array = Object.values(topFilters.value);
  const sortedArray = array.sort((a: topFilter, b: topFilter) => b.matches - a.matches);
  return sortedArray
}



onMounted(async () => {
  await Promise.allSettled([filterStore.loadFilters(), listingStore.loadMatches()]);
  loadStats();
  filterStore.loadFilters()
})
</script>
