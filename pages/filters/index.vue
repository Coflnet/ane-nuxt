<template>
  <div>
    <div class="flex flex-col md:flex-row justify-between items-start mb-8">
      <div>
        <h1>
          <UiHeaderLabel
            :label="$t('filters')"
            :xl="true"
          />
        </h1>
        <UiFooterLabel :label="$t('manageFilters')" />
      </div>
      <UiLinkButton
        aria-label="Create Navigation Button"
        :white="true"
        :primary="true"
        :to="localePath('/filters/create')"
      >
        <Icon
          name="tabler:plus"
          class="size-5 mr-2"
        />
        <span class="mr-1">{{ $t('createFilter') }}</span>
      </UiLinkButton>
    </div>

    <UiDefaultContainer class="p-6">
      <UiHeaderLabel :label="$t('yourFilters')" />

      <UiGrid
        v-if="filters.length > 0"
        :grid-size="3"
        class="mt-4"
        :grid-shink="true"
      >
        <div
          v-for="(filter, index) in filters"
          :key="index"
          class="border border-slate-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow p-4"
        >
          <FiltersFilterViewFilterItem :filter="filter" />
        </div>
      </UiGrid>

      <div
        v-else
        class="py-12 text-center"
      >
        <Icon
          name="tabler:file-sad"
          class="size-11 text-white"
        />
        <UiHeaderLabel :label="$t('noFilters')" />
        <UiFooterLabel :label="$t('tryCreatingFilters')" />
      </div>
    </UiDefaultContainer>
  </div>
</template>

<script setup lang="ts">
import type { FilterFace } from '~/types/FilterType'

const localePath = useLocalePath()
const { t } = useI18n()
const filterStore = useFilterStore()

const filters = computed(() => {
  const response = filterStore.getUserFilters
  const res: FilterFace[] = response.map((i) => {
    const filtersHolder = {
      radius: '',
      keywords: [] as string[],
      priceRange: '',
      IncludePlatforms: '',
    }

    i.filters?.map((i) => {
      if (i.name == 'Radius')
        return filtersHolder.radius = i.value ?? ''
      if (i.name == 'PriceRange')
        return filtersHolder.priceRange = i.value ?? ''
      if (i.name == 'ContainsKeyWord') {
        if (typeof i.value == 'string') {
          return
        }
        return filtersHolder.keywords = JSON.parse(i.value ?? '')
      }
      if (i.name == 'IncludePlatforms')
        return filtersHolder.IncludePlatforms = i.value ?? ''
    })

    return {
      matchCount: i.matchCount ?? 0,
      id: i.id ?? 0,
      name: i.name ?? '',
      marketplace: filtersHolder.IncludePlatforms ?? '',
      keywords: filtersHolder.keywords,
      active: true,
      priceRange: filtersHolder.priceRange,
      location: filtersHolder.radius,
    }
  })

  return res
})

onMounted(async () => {
  await useUserStore().checkAuth(useFirebaseAuth()!)
  filterStore.loadFilters()
})

useSeoMeta({
  title: () => t('aneFilters'),
  ogTitle: () => t('aneFilters'),
  description: () => t('filtersDescription'),
  ogDescription: () => t('filtersDescription'),
})
</script>
