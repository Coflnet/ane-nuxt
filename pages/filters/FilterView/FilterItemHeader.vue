<template>
  <div class="flex items-start justify-between mb-3">
    <div>
      <UiHeaderLabel :label="filter.name"></UiHeaderLabel>
      <UiFooterLabel :label="filter.marketplace || 'Ebay'" :xs="true" />
    </div>
    <div class="flex flex-row gap-x-1">
      <div class="flex items-center space-x-1">
        <UiTextButton @on-click="navigateTo(`/filters/create?id=${filter.id}`)">
          <UiIcon name="tabler:edit" />
        </UiTextButton>
      </div>
      <div class="flex items-center space-x-1">
        <FilterCardDelete :itemId="filter.id" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FilterCardDelete from '~/components/filters/FilterCardDelete.vue';
import type { FilterFace } from '~/types/FilterType';

defineProps<{ filter: FilterFace }>()

</script>
