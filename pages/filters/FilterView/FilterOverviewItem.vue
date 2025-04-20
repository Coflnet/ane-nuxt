<template>
  <FilterItemHeader :filter="filter" />
  <FilterItemSettings :filter="filter" />

  <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
    <div class="flex items-center space-x-2">
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
        :class="filter.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'">
        {{ filter.active ? 'Active' : 'Paused' }}
      </span>
      <span class="text-sm text-slate-500 dark:text-slate-400">{{ filter.matchCount }} {{ $t('matches') }}</span>
    </div>
  </div>

</template>

<script setup lang="ts">
import FilterItemSettings from './FilterItemSettings.vue';
import FilterItemHeader from './FilterItemHeader.vue';
import type { FilterFace } from '~/types/FilterType';


defineProps<{ filter: FilterFace }>()


</script>
