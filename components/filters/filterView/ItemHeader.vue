<template>
  <div class="flex items-start justify-between mb-3">
    <a
      :href="editHref"
    >
      <UiHeaderLabel :label="filter.name" />
      <UiFooterLabel
        class="truncate w-48"
        :label="filter.marketplace || 'Kleinanzeigen'"
        :xs="true"
      />
    </a>
    <div class="flex flex-row gap-x-1">
      <div class="flex items-center space-x-1">
        <UiTextButton @on-click="goToEdit">
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
const filterStore = useFilterStore()

const props = defineProps<{ filter: FilterFace }>()

const editHref = computed(() => localePath(`/filters/create?id=${filterStore.getSimplifiedFilters[props.filter.id ?? '']![1]}`))

function goToEdit() {
  navigateTo(editHref.value)
}
</script>
