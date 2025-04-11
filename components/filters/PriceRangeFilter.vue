<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-0">
    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {{ $t('priceRan') }}
      </label>
      <div class="flex items-center space-x-2">
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">{{
            filter.currency }}</span>
          <input v-model="filter.minPrice" type="number" placeholder="Min"
            class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
        </div>
        <span class="text-slate-500 dark:text-slate-400">-</span>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">{{
            filter.currency }}</span>
          <input v-model="filter.maxPrice" type="number" placeholder="Max"
            class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
        </div>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{{ $t('totalCost') }}</label>
      <div class="flex items-center space-x-2">
        <div class="relative w-full">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">{{
            filter.currency }}</span>
          <input v-model="filter.totalCost" type="number" placeholder="Min"
            class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
        </div>
      </div>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ $t('maxCo') }}</p>
    </div>

  </div>
</template>


<script setup lang='ts'>

defineProps({
  filter: {
    type: Object,
    required: true
  }
})

</script>
