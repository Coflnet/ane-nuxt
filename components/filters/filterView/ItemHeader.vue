<template>
  <div class="flex items-start justify-between mb-3">
    <a
      :href="localePath(`/filters/create?id=${useFilterStore().getSimplifiedFilters[filter.id ?? '']![1]}`)"
    >
      <UiHeaderLabel :label="filter.name" />
      <UiFooterLabel
        class="truncate w-48"
        :label="filter.marketplace || 'Ebay'"
        :xs="true"
      />
    </a>
    <div class="flex flex-row gap-x-1">
      <div class="flex items-center space-x-1">
        <UiTextButton @on-click="navigateTo(localePath(`/filters/create?id=${useFilterStore().getSimplifiedFilters[filter.id ?? '']![1]}`))">
          <UiIcon
            name="tabler:edit"
            :large="true"
          />
        </UiTextButton>
        <FiltersFilterCardDelete :item-id="filter.id" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FilterFace } from '~/types/FilterType'

const localePath = useLocalePath()

defineProps<{ filter: FilterFace }>()
</script>
