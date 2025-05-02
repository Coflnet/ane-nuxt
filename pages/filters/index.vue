<template>
  <div class="flex flex-col md:flex-row justify-between items-start mb-8">
    <div>
      <h1>
        <UiHeaderLabel :label="$t('filters')" :xl="true" />
      </h1>
      <UiFooterLabel :label="$t('manageFilters')"></UiFooterLabel>
    </div>
    <UiButton @on-click="navigateTo(localePath('/filters/create'))" :primary="true">
      <Icon name="tabler:plus" class="size-5" />
      <span class="mr-1">{{ $t('createFilter') }}</span>
    </UiButton>
  </div>

  <UiDefaultContainer class="p-6">
    <UiHeaderLabel :label="$t('yourFilters')" />

    <UiGrid :grid-size="3" class="mt-4" :grid-shink="true" v-if="filters.length > 0">
      <div v-for="(filter, index) in filters" :key="index"
        class="border border-slate-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow p-4">
        <FiltersFilterViewFilterItem :filter="filter" />
      </div>
    </UiGrid>

    <div v-else class="py-12 text-center">
      <Icon name="tabler:file-sad" class="size-11 text-white" />
      <UiHeaderLabel :label="$t('noFilters')" />
      <UiFooterLabel :label="$t('tryCreatingFilters')" />
    </div>
  </UiDefaultContainer>

</template>

<script setup lang="ts">
import type { FilterFace } from '~/types/FilterType';

const localePath = useLocalePath();

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

onMounted(async () => {
  await useUserStore().checkAuth(useFirebaseAuth()!);
  filterStore.loadFilters();
});

</script>
