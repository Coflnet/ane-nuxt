<template>
  <div class="flex items-start justify-between mb-3">
    <div>
      <UiHeaderLabel :label="filter.name" />
      <UiFooterLabel :label="filter.marketplace || 'Ebay'" :xs="true" />
    </div>
    <div class="flex flex-row gap-x-1">
      <div class="flex items-center space-x-1">
        <UiTextButton @on-click="navigateTo(localePath(`/filters/create?id=${filter.id}`))">
          <UiIcon name="tabler:edit" />
        </UiTextButton>
      </div>
      <div class="flex items-center space-x-1">
        <FiltersFilterCardDelete :itemId="filter.id" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FilterFace } from '~/types/FilterType';
const localePath = useLocalePath();

defineProps<{ filter: FilterFace }>()

</script>
