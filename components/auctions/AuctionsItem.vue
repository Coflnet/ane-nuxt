<template>
  <div class="relative">
    <img :src="auction.image ?? ''" alt="Auction thumbnail" class="w-full h-48 object-cover rounded-t-lg"
      :class="auction.image == '' ? 'hidden' : ''" />
    <div :class="auction.image == '' ? '' : 'hidden'" class="h-48 items-center flex flex-col justify-center">
      <Icon name="tabler:search" class="w-16 h-16 text-slate-400 mx-auto mb-4 mt-3" />
      <UiHeaderLabel :label="$t('noImageForAuction')" />

    </div>
    <div class="absolute top-2 right-2">
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900 text-indigo-200">
        {{ auction.marketplace }}
      </span>
    </div>
  </div>

  <div class="p-4">
    <div class="flex items-start justify-between mb-2">
      <h3 class="font-medium text-lg text-white line-clamp-2">{{ auction.title }}</h3>
    </div>

    <div class="flex items-center justify-between mb-3">
      <UiHeaderLabel :label="`$${auction.price}`" />
    </div>

    <div class="flex items-center justify-between pt-3 border-t border-slate-700">
      <div>
        <span class="text-sm text-slate-400">{{ $t('matchFilter') }}</span>
        <span class="ml-1 text-sm font-medium text-indigo-400">{{
          filterStore.getSimplifiedFilters[auction.filter ?? 0] }}</span>
      </div>
      <UiLinkLabel :href="auction.url ?? ''">
        {{ $t('view') }}
        <Icon name="tabler:external-link" class="ml-1" />
      </UiLinkLabel>

    </div>
  </div>

</template>

<script setup lang="ts">
import { Icon, UiHeaderLabel } from '#components';

const filterStore = useFilterStore()
defineProps<{ auction: MatchItem }>()
</script>
