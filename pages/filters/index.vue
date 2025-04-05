<template>
  <div>
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Filters</h1>
        <p class="mt-2 text-slate-500 dark:text-slate-400">Manage your auction search filters</p>
      </div>
      <FiltersCreateFilterButton />
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-6">
      <div class="p-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4 md:mb-0">Your Filters</h2>
          <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div class="relative">
              <SearchIcon
                class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input type="text" placeholder="Search filters..."
                class="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
            </div>
            <select
              class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400">
              <option value="all">All Marketplaces</option>
              <option value="ebay">eBay</option>
              <option value="kleinanzeigen">eBay Kleinanzeigen</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FiltersFilterCard v-for="(f, index) in filterStore.filters" :key="index" :filter="f" />
        </div>
      </div>

      <div class="flex justify-center">
        <nav class="inline-flex rounded-md shadow-sm">
          <button
            class="px-3 py-2 rounded-l-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
            <ChevronLeftIcon class="w-5 h-5" />
          </button>
          <button
            class="px-4 py-2 border-t border-b border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700">
            1
          </button>
          <button
            class="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            2
          </button>
          <button
            class="px-4 py-2 border-t border-b border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700">
            3
          </button>
          <button
            class="px-3 py-2 rounded-r-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
            <ChevronRightIcon class="w-5 h-5" />
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import type { FiltersFilterCard } from '#components';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, TagIcon, MapPinIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'

const filterStore = useFilterStore();
console.log(`filters loaded: ${filterStore.filters}`)

onMounted(() => {
  filterStore.loadFilters();
});

</script>
