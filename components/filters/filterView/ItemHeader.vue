<template>
  <div class="flex items-start justify-between mb-3">
    <div>
      <UiHeaderLabel :label="filter.name" />
      <UiFooterLabel
        class="truncate w-48"
        :label="filter.marketplace || 'Ebay'"
        :xs="true"
      />
    </div>
    <div class="flex flex-row gap-x-1">
      <div class="flex items-center space-x-1">
        <UiLinkButton
          :aria-label="`Edit Filter ${filter.name}`"
          :white="true"
          :to="localePath(`/filters/create?id=${filter.id}`)"
        >
          <UiIcon name="tabler:edit" />
        </UiLinkButton>
      </div>
      <div class="flex items-center space-x-1">
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
