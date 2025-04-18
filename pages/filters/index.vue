<template>
  <div class="flex justify-between items-start mb-8">
    <div>
      <h1>
        <HeaderLabel :label="$t('filters')" :xl="true" />
      </h1>
      <UiFooterLabel :label="$t('manageFilters')"></UiFooterLabel>
    </div>
    <UiButton @on-click="navigateTo('/filters/create')" :primary="true">
      <Icon name="tabler:plus" class="size-5" />
      <span class="mr-1">{{ $t('createFilter') }}</span>
    </UiButton>
  </div>

  <UiDefaultContainer class="p-6">
    <UiHeaderLabel :label="$t('yourFilters')" />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
      <div v-for="(filter, index) in filters" :key="index"
        class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow p-4">
        <FilterOverviewItem :filter="filter" />
      </div>
    </div>
  </UiDefaultContainer>

</template>

<script setup lang="ts">
import FilterOverviewItem from './index/FilterOverviewItem.vue';

const filterStore = useFilterStore();

const filters = computed(() => {
  const response = filterStore.getUserFilters;
  let res: FilterFace[] = response.map((i) => {
    var filtersHolder = {
      radius: '',
      keywords: [] as string[],
      priceRange: '',
      IncludePlatforms: ''
    }

    i.filters?.map((i) => {
      if (i.name == "Radius")
        return filtersHolder.radius = i.value ?? "";
      if (i.name == "PriceRange")
        return filtersHolder.priceRange = i.value ?? ""
      if (i.name == "ContainsKeyWord") {
        if (typeof i.value == 'string') {
          return;
        }
        return filtersHolder.keywords = JSON.parse(i.value ?? "")
      }
      if (i.name == "IncludePlatforms")
        return filtersHolder.IncludePlatforms = i.value ?? ""
    })


    return {
      matchCount: i.matchCount ?? 0,
      id: i.id ?? 0,
      name: i.name ?? "",
      marketplace: filtersHolder.IncludePlatforms ?? "",
      keywords: filtersHolder.keywords,
      active: true,
      priceRange: filtersHolder.priceRange,
      location: filtersHolder.radius
    }
  })

  return res;
})

onMounted(() => {
  filterStore.loadFilters();
});

</script>
