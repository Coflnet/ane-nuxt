<template>
  <div>
    <FiltersFilterViewItemHeader :filter="filter" />
    <a
      aria-label="Edit Filter"
      :href="localePath(`/filters/create?id=${useFilterStore().getSimplifiedFilters[filter.id ?? '']![1]}`)"
    >
      <FiltersFilterViewItemSettings :filter="filter" />
      <div class="flex items-center justify-between pt-3 border-t border-slate-700">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-slate-500 dark:text-slate-400">{{ filter.matchCount }} {{ $t('matches') }}</span>
        </div>
      </div>
    </a>
  </div>
</template>

<script setup lang="ts">
import type { FilterFace } from '~/types/FilterType'

const localePath = useLocalePath()

defineProps<{ filter: FilterFace }>()
</script>
