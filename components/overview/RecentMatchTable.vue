<template>
  <UiDefaultContainer class="mb-6 p-6">
    <UiHeaderLabel :label="props.title" class="mb-4" />
    <table class="w-full">
      <OverviewTableHeader />
      <tbody>
        <tr v-for="(auction, index) in props.matches" :key="index"
          class="border-b border-slate-700 hover:bg-slate-700/50">
          <td class="px-4 py-3 text-sm text-white">
            <div class="flex items-center space-x-3">
              <img :src="imageUrl(auction)" alt="Auction thumbnail" class="w-10 h-10 rounded-md object-cover" />
              <div>
                <p class="font-medium">{{ auction.title }}</p>
                <UiFooterLabel v-if="'marketplace' in auction" :label="auction.marketplace" :xs="true" />
              </div>
            </div>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-white" v-if="'filter' in auction">{{
            filters.getSimplifiedFilters[auction.filter ??
            0] }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-white">{{ $t('dollarSign') }}{{
            auction.price
            }}</td>
          <td class="px-4 py-3 text-sm font-medium text-white" v-if="description(auction)">{{
            description(auction) }}</td>
          <td class="px-4 py-3 text-sm font-medium text-white"> {{ timeAgo(auction) }}</td>
          <td class="px-4 py-3 text-sm">
            <div class="flex items-center space-x-2 ml-2.5">
              <a :href="url(auction)" target="_blank" class="p-1 rounded-md hover:bg-slate-700" title="View auction">
                <Icon name="tabler:external-link" class="size-5 text-slate-400" />
              </a>

            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </UiDefaultContainer>
</template>

<script setup lang="ts">
import humanizeDuration from 'humanize-duration'

const props = defineProps({
  matches: {
    type: Object as PropType<Array<MatchItem> | Array<Listing>>,
    required: true
  },
  title: {
    type: String,
    default: 'Recent Matches'
  }
})

const filters = useFilterStore()
const listingStore = useListingStore()

function imageUrl(auction: MatchItem | Listing): string {
  if ('image' in auction && auction.image) {
    return auction.image;
  }

  if ('imageUrls' in auction && auction.imageUrls) {
    return auction.imageUrls[0] ?? '';
  }

  return ''
}

function description(auction: MatchItem | Listing): string {
  if ('descriptionShort' in auction && auction.descriptionShort) {
    if (auction.descriptionShort.length > 100) {
      return auction.descriptionShort.substring(0, 100) + '...';
    }
    return auction.descriptionShort;
  }

  if ('description' in auction && auction.description) {
    if (auction.description.length > 100) {
      return auction.description.substring(0, 100) + '...';
    }
    return auction.description;
  }
  return '';
}

function timeAgo(auction: MatchItem | Listing): string {
  let timestamp = '';

  if ('matchedAt' in auction && auction.matchedAt) {
    timestamp = auction.matchedAt;
  } else if ('foundAt' in auction && auction.foundAt) {
    timestamp = auction.foundAt;
  } else if ('createdAt' in auction && auction.createdAt) {
    timestamp = auction.createdAt;
  }

  const past = new Date(timestamp);
  const t = Math.round(new Date().getTime() - past.getTime())

  const str = humanizeDuration(t, {
    units: ["d", "h", "m"],
    largest: 1,
    round: true,
    language: navigator.language?.startsWith('de') ? 'de' : 'en',
    fallbacks: ['en', 'de']
  })
  return str
}

function url(auction: MatchItem | Listing): string {
  if ('url' in auction && auction.url) {
    return auction.url;
  }

  const constructedUrl = listingStore.constructListingUrl(auction);
  if (constructedUrl) {
    return constructedUrl;
  }

  return ''
}
</script>
