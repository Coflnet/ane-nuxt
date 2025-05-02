<template>
  <UiDefaultContainer class="mb-6 p-6">
    <UiHeaderLabel :label="props.title" class="mb-4" />
    <table class="w-full">
      <OverviewTableHeader :headers="tableHeader" />
      <tbody>
        <tr v-for="(auction, index) in props.matches" :key="index"
          class="border-b border-slate-700 hover:bg-slate-700/50">
          <td class="px-4 py-3 text-sm text-white">
            <div class="flex items-center space-x-3">
              <img :src="auction.listingData?.imageUrls![0] ?? ''" alt="Auction thumbnail"
                class="w-10 h-10 rounded-md object-cover" />
              <div>
                <p class="font-medium line-clamp-2">{{ auction.listingData?.title }}</p>
                <UiFooterLabel v-if="'marketplace' in auction" :label="auction.listingData?.platform" :xs="true" />
              </div>
            </div>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-white hidden md:table-cell" v-if="overview">{{
            filters.getSimplifiedFilters[auction.listenerId ?? 0] }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-white">
            {{ $t('dollarSign') }}{{ auction.listingData?.price }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-white max-w-9 " v-if="!overview">
            <!-- the <p> is required because <td> handles line clamping weird -->
            <p class="line-clamp-2 md:line-clamp-3">{{ auction.listingData?.descriptionShort }}</p>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-white hidden md:table-cell"> {{ timeAgo(auction) }}</td>
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
import { useWindowSize } from '@vueuse/core';
import humanizeDuration from 'humanize-duration'
import type { FilterMatch } from '~/src/api-client';

const { width } = useWindowSize()

const props = defineProps({
  overview: { type: Boolean },
  matches: {
    type: Array<FilterMatch>,
    required: true
  },
  title: {
    type: String,
    default: 'Recent Matches'
  },
})

const tableHeader = computed(() => {
  if (props.overview)
    // change the header for mobile 768 is equivalent tailwinds md
    return width.value > 768 ? ['auction', 'filter', 'price', 'matched', 'actions'] : ['auction', 'price', 'actions']

  return ['auction', 'price', 'description', 'actions']
});

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
