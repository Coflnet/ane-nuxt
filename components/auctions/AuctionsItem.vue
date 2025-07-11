<template>
  <div class="relative">
    <a
      :href="auctionUrl"
      aria-label="Auction link"
    >
      <img
        :src="auction.listingData!.imageUrls![0] ?? ''"
        alt="Auction thumbnail"
        class="w-full h-48 object-cover rounded-t-lg"
        :class="auction.listingData!.imageUrls!.length == 0 ? 'hidden' : ''"
      >
      <div
        :class="auction.listingData!.imageUrls!.length == 0 ? '' : 'hidden'"
        class="h-48 items-center flex flex-col justify-center"
      >
        <Icon
          name="tabler:search"
          class="w-16 h-16 text-slate-400 mx-auto mb-4 mt-3"
        />
        <UiHeaderLabel :label="$t('noImageForAuction')" />
      </div>
      <div class="absolute top-2 right-2">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900 text-indigo-200"
        >
          {{ auction.listingData!.platform }}
        </span>
      </div>
    </a>
  </div>

  <div class="p-4">
    <div class="flex justify-between">
      <a :href="auctionUrl">
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-medium text-lg text-white line-clamp-2">
            {{ auction.listingData!.title }}
          </h3>
        </div>
      </a>
      <AuctionsItemPopover :auction="auction">
        <Icon
          class="size-5 text-slate-400"
          name="tabler:dots-vertical"
        />
      </AuctionsItemPopover>
    </div>

    <div class="flex items-center justify-between mb-3">
      <UiHeaderLabel
        :label="useFormat().formatCurrency(
          auction.listingData!.price ?? 0,
          auction.listingData?.currency ?? '',
          useI18n().locale.value,
        )"
      />
    </div>

    <div class="flex items-center justify-between pt-3 border-t border-slate-700">
      <div class="flex items-center space-x-1">
        <span class="text-sm text-slate-400">{{ $t('matchFilter') }}</span>
        <UiLinkLabel
          :href="localePath(`/filters/create?id=${filterStore.getSimplifiedFilters[auction.listenerId ?? 0]![1]}`)"
        >
          {{ filterStore.getSimplifiedFilters[auction.listenerId ?? 0]![0] }}
        </UiLinkLabel>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon, UiHeaderLabel } from '#components'
import type { FilterMatch } from '#hey-api'
import { useFormat } from '~/composable/useFormat'

const { locale } = useI18n()
const localePath = useLocalePath()

const filterStore = useFilterStore()
const listingStore = useListingStore()

const props = defineProps<{
  auction: FilterMatch
}>()

const auctionUrl = computed(() => {
  if (!props.auction.listingData)
    return ''
  const url = listingStore.constructListingUrl(props.auction.listingData, locale.value)
  if (!url)
    return ''
  return url
})
</script>
