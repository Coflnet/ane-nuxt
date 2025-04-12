<template>
  <div>
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">{{ $t('dash') }}</h1>
        <p class="mt-2 text-slate-500 dark:text-slate-400">{{ $t('monitor') }}</p>
      </div>
      <NuxtLink to="/filters/create"
        class="mt-4 md:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2">
        <PlusIcon class="w-5 h-5" />
        <span>{{ $t('create') }}</span>
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-slate-900 dark:text-white">{{ $t('act') }}</h3>
          <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
            <FilterIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <p class="text-3xl font-bold text-slate-900 dark:text-white">{{ filterCount }}</p>

      </div>

      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-slate-900 dark:text-white">{{ $t('totalM') }}</h3>
          <div class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <TagIcon class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <p class="text-3xl font-bold text-slate-900 dark:text-white">{{ stats.matchedAuctions }}</p>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-slate-900 dark:text-white">{{ $t('apr') }}</h3>
          <div class="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center">
            <BellIcon class="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
        </div>
        <p class="text-3xl font-bold text-slate-900 dark:text-white">{{ stats.notificationperHour }}</p>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-8">
      <div class="p-6">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">{{ $t('recen') }}</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700">
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Auction</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Filter</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Price</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Matched</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(auction, index) in listingStore.recentMatches" :key="index"
                class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td class="px-4 py-3 text-sm text-slate-900 dark:text-white">
                  <div class="flex items-center space-x-3">
                    <img :src="auction.image ?? ''" alt="Auction thumbnail" class="w-10 h-10 rounded-md object-cover" />
                    <div>
                      <p class="font-medium">{{ auction.title }}</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400">{{ auction.marketplace }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-slate-900 dark:text-white">{{ filters[auction.filter ?? 0] }}</td>
                <td class="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{{ auction.price }}</td>
                <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{{ timeAgo(auction.matchedAt) }}</td>
                <td class="px-4 py-3 text-sm">
                  <div class="flex items-center space-x-2 ml-2.5">
                    <a :href="auction.url ?? ''" target="_blank"
                      class="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700" title="View auction">
                      <ExternalLinkIcon class="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </a>

                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">{{ $t('topF') }}</h2>
        <div class="space-y-4">
          <div v-for="(filter, index) in sortTopFilers()" :key="index" class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div
                class="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {{ index + 1 }}
              </div>
              <div>
                <p class="font-medium text-slate-900 dark:text-white">{{ filter.name }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ filter.keywords.join(', ') }}</p>
              </div>
            </div>
            <p class="text-sm font-medium text-slate-900 dark:text-white">{{ filter.matches }} matches</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">{{ $t('notChan') }}</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <MessageSquareIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p class="font-medium text-slate-900 dark:text-white">Discord</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ $t('con2Chan') }}</p>
              </div>
            </div>
            <div class="flex items-center">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <MailIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p class="font-medium text-slate-900 dark:text-white">{{ $t('email') }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">user@example.com</p>
              </div>
            </div>
            <div class="flex items-center">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hidden">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <BellIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p class="font-medium text-slate-900 dark:text-white">{{ $t('webp') }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ $t('browNot') }}</p>
              </div>
            </div>
            <div class="flex items-center">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                {{ $t('setup') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BellIcon, FilterIcon, TagIcon, ExternalLinkIcon, HeartIcon, MessageSquareIcon, MailIcon, PlusIcon, List } from 'lucide-vue-next'
import { getMatches, type Platform } from '~/src/api-client';

// Mock data for dashboard
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


const filters = ref<Record<number, string>>({});

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

function timeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diff = (now.getTime() - past.getTime()) / 1000;
  if (diff < 900) {
    return "Just now";
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)} minutes ago`;
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)} hours ago`;
  } else if (diff < 604800) {
    return `${Math.floor(diff / 86400)} days ago`;
  } else {
    return `${Math.floor(diff / 604800)} weeks ago`;
  }
}

onMounted(async () => {
  await Promise.allSettled([filterStore.loadFilters(), listingStore.loadMatches()]);
  loadStats();
})
</script>
