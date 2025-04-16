<template>
  <div class="relative">
    <img :src="auction.image ?? ''" alt="Auction thumbnail" class="w-full h-48 object-cover"
      :class="auction.image == '' ? 'hidden' : ''" />
    <div :class="auction.image == '' ? '' : 'hidden'" class="h-48 items-center flex flex-col justify-center">
      <SearchXIcon class="w-16 h-16 text-slate-400 mx-auto mb-4 mt-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-1">{{ $t('noImg') }}</h3>

    </div>
    <div class="absolute top-2 right-2">
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
        {{ auction.marketplace }}
      </span>
    </div>
  </div>

  <div class="p-4">
    <div class="flex items-start justify-between mb-2">
      <h3 class="font-medium text-lg text-slate-900 dark:text-white line-clamp-2">{{ auction.title }}</h3>
    </div>

    <div class="flex items-center justify-between mb-3">
      <p class="font-bold text-xl text-slate-900 dark:text-white">${{ auction.price }}</p>
    </div>

    <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
      <div>
        <span class="text-sm text-slate-500 dark:text-slate-400">{{ $t('matchFilter') }}</span>
        <span class="ml-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">{{ auction.matchedAt
          }}</span>
      </div>
      <a :href="auction.url ?? ''" target="_blank"
        class="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200">
        View
        <ExternalLinkIcon class="w-4 h-4 ml-1" />
      </a>
    </div>
  </div>

</template>

<script setup lang="ts">
defineProps<{ auction: MatchItem }>()
</script>
