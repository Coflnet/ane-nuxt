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
              <img :src="auction.listingData?.imageUrls![0] ?? ''" alt="Auction thumbnail"
                class="w-10 h-10 rounded-md object-cover" />
              <div>
                <p class="font-medium">{{ auction.listingData?.title }}</p>
                <UiFooterLabel v-if="'marketplace' in auction" :label="auction.listingData?.platform" :xs="true" />
              </div>
            </div>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-white" v-if="'filter' in auction">{{
            filters.getSimplifiedFilters[auction.listenerId ?? 0] }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-white">{{ $t('dollarSign') }}
            {{ auction.listingData?.price }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-white">{{ auction.listingData?.descriptionShort }}</td>
          <td class="px-4 py-3 text-sm font-medium text-white"> {{ timeAgo(auction) }}</td>
          <td class="px-4 py-3 text-sm">
            <div class="flex items-center space-x-2 ml-2.5">
              <a :href="listingStore.constructListingUrl(auction.listingData) ?? ''" target="_blank"
                class="p-1 rounded-md hover:bg-slate-700" title="View auction">
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
import type { FilterMatch } from '~/src/api-client';

const props = defineProps({
  matches: {
    type: Array<FilterMatch>,
    required: true
  },
  title: {
    type: String,
    default: 'Recent Matches'
  }
})

const filters = useFilterStore()
const listingStore = useListingStore()


function timeAgo(auction: FilterMatch): string {

  const past = new Date(auction.matchedAt ?? '');
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

</script>
