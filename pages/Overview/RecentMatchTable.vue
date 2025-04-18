<template>
  <UiDefaultContainer class="mb-6 p-6">
    <UiHeaderLabel :label="$t('dashboard')" class="mb-4" />
    <table class="w-full">
      <TableHeader />
      <tbody>
        <tr v-for="(auction, index) in listingStore.recentMatches" :key="index"
          class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
          <td class="px-4 py-3 text-sm text-slate-900 dark:text-white">
            <div class="flex items-center space-x-3">
              <img :src="auction.image ?? ''" alt="Auction thumbnail" class="w-10 h-10 rounded-md object-cover" />
              <div>
                <p class="font-medium">{{ auction.title }}</p>
                <UiFooterLabel :label="auction.marketplace" :xs="true" />
              </div>
            </div>
          </td>
          <td class="px-4 py-3 text-sm text-slate-900 dark:text-white">{{ filters.getSimplifiedFilters[auction.filter ??
            0] }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{{ auction.price }}</td>
          <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{{ timeAgo(auction.matchedAt) }}</td>
          <td class="px-4 py-3 text-sm">
            <div class="flex items-center space-x-2 ml-2.5">
              <a :href="auction.url ?? ''" target="_blank"
                class="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700" title="View auction">
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
const { t } = useI18n();
import TableHeader from './TableHeader.vue';

const listingStore = useListingStore()
const filters = useFilterStore()

function timeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diff = (now.getTime() - past.getTime()) / 1000;
  if (diff < 900) {
    return t('justNow');
  } if (diff < 3600) {
    return `${Math.floor(diff / 60)} minutes ago`;
  } if (diff < 86400) {
    return `${Math.floor(diff / 3600)} hours ago`;
  } if (diff < 604800) {
    return `${Math.floor(diff / 86400)} days ago`;
  } else {
    return `${Math.floor(diff / 604800)} weeks ago`;
  }
}
</script>
