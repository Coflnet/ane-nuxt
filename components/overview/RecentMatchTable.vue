<template>
  <UiDefaultContainer class="mb-6 p-6">
    <UiHeaderLabel
      :label="props.title"
      class="mb-4"
    />
    <table
      v-if="matches.length > 0 || loading"
      class="w-full"
    >
      <OverviewTableHeader :headers="tableHeader" />
      <tbody>
        <tr
          v-for="(auction, index) in props.matches"
          :key="index"
          class="border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer"
          @click="tableClicked(auction)"
        >
          <td class="px-4 py-3 text-sm text-white">
            <div class="flex items-center space-x-3">
              <img
                :src="auction.listingData?.imageUrls![0] ?? ''"
                loading="lazy"
                alt="Auction thumbnail"
                class="w-10 h-10 rounded-md object-cover"
              >
              <div>
                <p class="font-medium line-clamp-2">
                  {{ auction.listingData?.title }}
                </p>
                <UiFooterLabel
                  v-if="'marketplace' in auction"
                  :label="auction.listingData?.platform"
                  :xs="true"
                />
              </div>
            </div>
          </td>
          <td
            v-if="overview"
            class="px-4 py-3 text-sm font-medium text-white hidden md:table-cell"
          >
            {{
              filters.getSimplifiedFilters[auction.listenerId ?? 0] }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-white">
            {{ useFormat().formatCurrency(auction.listingData?.price ?? 0) }}
          </td>
          <td
            v-if="!overview"
            class="px-4 py-3 text-sm font-medium text-white hidden md:table-cell"
          >
            <!-- the <p> is required because <td> handles line clamping weird -->
            <p class="line-clamp-3">
              {{ auction.listingData?.descriptionShort }}
            </p>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-white hidden md:table-cell">
            {{ timeAgo(auction) }}
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-else
      class="py-12 text-center"
    >
      <Icon
        name="tabler:file-sad"
        class="size-11 text-white"
      />
      <UiHeaderLabel :label="$t('noAuctions')" />
      <UiFooterLabel :label="$t('createOrAdjustFilters')" />
    </div>
  </UiDefaultContainer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import humanizeDuration from 'humanize-duration'
import type { FilterMatch } from '~/src/api-client'
import { useFormat } from '~/composable/useFormat'

const { width } = useWindowSize()
const { locale } = useI18n()

const props = defineProps({
  overview: { type: Boolean },
  matches: {
    type: Array<FilterMatch>,
    required: true,
  },
  title: {
    type: String,
    default: 'Recent Matches',
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
})

async function tableClicked(auction: FilterMatch) {
  navigateTo(listingStore.constructListingUrl(auction.listingData, locale.value), {
    external: true,
    open: {
      target: '_blank',
    },
  })
}

const tableHeader = computed(() => {
  if (width.value > 768)
    return props.overview ? ['auction', 'filter', 'price', 'matched'] : ['auction', 'price', 'description', 'matched']

  return ['auction', 'price']
})

const filters = useFilterStore()
const listingStore = useListingStore()

function timeAgo(auction: FilterMatch): string {
  const past = new Date(auction.matchedAt ?? '')
  const t = Math.round(new Date().getTime() - past.getTime())

  const str = humanizeDuration(t, {
    units: ['d', 'h', 'm'],
    largest: 1,
    round: true,
    language: navigator.language?.startsWith('de') ? 'de' : 'en',
    fallbacks: ['en', 'de'],
  })
  return str
}
</script>
