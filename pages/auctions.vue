<template>
  <div>
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Matched Auctions</h1>
        <p class="mt-2 text-slate-500 dark:text-slate-400">Auctions that match your filters</p>
      </div>
      <div class="mt-4 md:mt-0 flex items-center space-x-2 hidden">
        <select v-model="selectedFilter"
          class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400">
          <option value="all">All Filters</option>
          <!-- <option v-for="filter in filters" :key="filter.id" :value="filter.id">{{ filter.name }}</option> -->
        </select>

        <select v-model="sortOption"
          class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-6">
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="(auction, index) in paginatedAuctions" :key="index"
            class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div class="relative">
              <img :src="auction.image ?? ''" alt="Auction thumbnail" class="w-full h-48 object-cover" />
              <div class="absolute top-2 right-2">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  {{ auction.marketplace }}
                </span>
              </div>
            </div>

            <div class="p-4">
              <div class="flex items-start justify-between mb-2">
                6 <h3 class="font-medium text-lg text-slate-900 dark:text-white line-clamp-2">{{ auction.title }}</h3>

              </div>

              <div class="flex items-center justify-between mb-3">
                <p class="font-bold text-xl text-slate-900 dark:text-white">{{ auction.price }}</p>
              </div>



              <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <span class="text-sm text-slate-500 dark:text-slate-400">Matched filter:</span>
                  <span class="ml-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">{{
                    (auction.matchedAt)
                  }}</span>
                </div>
                <a :href="auction.url ?? ''" target="_blank"
                  class="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200">
                  View
                  <ExternalLinkIcon class="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div v-if="auctions.length === 0" class="py-12 text-center">
          <SearchXIcon class="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-1">No auctions found</h3>
          <p class="text-slate-500 dark:text-slate-400">Try adjusting your filters or check back later</p>
        </div>
      </div>
    </div>

    <div class="flex justify-center">
      <nav class="inline-flex rounded-md shadow-sm">
        <button @click="prevPage" :disabled="currentPage === 1"
          class="px-3 py-2 rounded-l-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">
          <ChevronLeftIcon class="w-5 h-5" />
        </button>

        <button v-for="page in totalPages" :key="page" @click="goToPage(page)"
          class="px-4 py-2 border border-slate-300 dark:border-slate-600" :class="{
            'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400': currentPage === page,
            'bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700': currentPage !== page
          }">
          {{ page }}
        </button>

        <button @click="nextPage" :disabled="currentPage === totalPages"
          class="px-3 py-2 rounded-r-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">
          <ChevronRightIcon class="w-5 h-5" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { HeartIcon, MapPinIcon, ExternalLinkIcon, ChevronLeftIcon, ChevronRightIcon, SearchXIcon } from 'lucide-vue-next'
import { getFilters, getMatches } from '~/src/api-client'

const selectedFilter = ref('all')
const sortOption = ref('newest')
const userStore = useUserStore()
const filters = ref<{ [id: number]: string }>();
const auctions = ref<MatchItem[]>([])

var oldestAuction = new Date()

var apiToken = userStore.token;
apiToken = "Bearer " + apiToken;

const perPage = 6;
const totalPages = ref(10);
const currentPage = ref(1);
const paginatedAuctions = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return auctions.value.slice(start, start + perPage);
});


function loadedCache() {
  var cache = userStore.loadAuctionCache();
  auctions.value = cache[1]

  console.log("oldest")
  oldestAuction = new Date(auctions.value.at(-1)!.matchedAt)

  loadMoreAuctions()
}
async function loadMoreAuctions() {
  const matches = await getMatches({
    query: { before: auctions.value.at(-1)?.matchedAt, limit: 6 },
    composable: "$fetch",
    headers: { Authorization: apiToken },
  })
  matches.map((item) => {
    auctions.value.push({
      title: item.listingData?.title ?? null,
      marketplace: item.listingData?.platform,
      price: item.listingData?.price,
      matchedAt: item.matchedAt ?? "",
      filter: item.listenerId ?? undefined,
      url: getUrl(item.listingData?.platform ?? "", item.listingData?.id ?? ""),
      image: item?.listingData?.imageUrls![0]
    });

  })

  if (auctions.value.length >= 1) {
    console.log(auctions)
    console.log(auctions.value.at(-1))
    oldestAuction = new Date(auctions.value.at(-1)!.matchedAt)
    console.log(oldestAuction)
  }
}

function goToPage(page: number) {
  if (page !== currentPage.value) {
    currentPage.value = page;
    loadMoreAuctions();
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    if (currentPage.value <= auctions.value.length / 6)
      loadMoreAuctions();
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function getUrl(listing: string, id: string) {
  if (listing === 'Ebay') {
    if (navigator.language == "de") {
      return `https://www.ebay.de/itm/` + id;
    }
    return `https://www.ebay.com/itm/` + id;
  }
  if (listing === 'Kleinanzeigen') {
    return `https://www.kleinanzeigen.de/s-anzeige/copy/${id}-1-1`;
  }
  return "";
}

function timeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diff = (now.getTime() - past.getTime()) / 1000;
  if (diff < 900) {
    return `${Math.floor(diff / 60)} minutes ago`;
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

onMounted(() => {
  loadedCache()
})

</script>
