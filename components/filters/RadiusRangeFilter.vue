<template>
  <div class="grid grid-cols-2 md:grid-cols-2 ">
    <div class="flex flex-row w-full gap-x-8 pr-10">
      <div class="w-full ">
        <label for="search-radius" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {{ $t('searradi') }}
        </label>
        <div class="flex items-center gap-2">
          <input id="search-radius" v-model="filter.searchRadius" type="number" placeholder="e.g., 10" min="0" :class="[
            'w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400',
            radiusError ? 'border-rose-500 dark:border-rose-500' : 'border-slate-300 dark:border-slate-600'
          ]" />
        </div>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {{ $t('radi') }}
        </p>
        <p v-if="radiusError" class="mt-1 text-xs text-rose-500">
          {{ radiusErrorMessage }}
        </p>

      </div>
      <div class="w-full">
        <label for="zip-code" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{{ $t('zip') }}
        </label>
        <div class="flex items-center gap-2">
          <input id="search-radius" v-model="filter.zipcode" type="text" placeholder="e.g., xxxxx" min="0" :class="[
            'w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400',
            radiusError && filter.marketplace != 'ebay' ? 'border-rose-500 dark:border-rose-500' : 'border-slate-300 dark:border-slate-600'
          ]" />
        </div>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ $t('yourZip') }}</p>
      </div>
    </div>
    <div class="flex flex-row, w-full relative">
      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 absolute">
        {{ $t('priceRan') }}
      </label>
      <div class="flex items-center space-x-2 w-full mt-1">
        <div class="relative w-full">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">{{
            filter.currency }}</span>
          <input v-model="filter.minPrice" type="number" placeholder="Min"
            class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
        </div>
        <span class="text-slate-500 dark:text-slate-400">-</span>
        <div class="relative w-full">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">{{
            filter.currency }}</span>
          <input v-model="filter.maxPrice" type="number" placeholder="Max"
            class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
const radiusErrorMessage = computed(() => {
  console.log(props.filter.marketplace)
  if (!radiusError) return ''
  return props.filter.marketplace === 'ebay'
    ? 'Search radius does not work with Ebay'
    : 'Please enter a zip code when using search radius'
})

const props = defineProps({
  filter: {
    type: Object,
    required: true
  },
})

const radiusError = ref(false);

watch([() => props.filter.searchRadius, () => props.filter.zipcode], ([newRadius, newZipcode]) => {
  validateRadiusAndZipcode(newRadius, newZipcode)
}, { immediate: true })

function validateRadiusAndZipcode(radius: any, zipcode: string) {
  if (radius && !zipcode) {
    radiusError.value = true
  } else {
    radiusError.value = false
  }
}

</script>
