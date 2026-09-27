<template>
  <div>
    <FiltersFilterViewItemHeader :filter="filter" />
    <span
      v-if="filter.isFlipNotification"
      class="inline-block text-xs font-medium px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-2"
    >
      {{ $t('flipNotification') }}
    </span>
    <a
      aria-label="Edit Filter"
      :href="editHref"
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
const filterStore = useFilterStore()

const props = defineProps<{ filter: FilterFace }>()

const editHref = computed(() => localePath(`/filters/create?id=${filterStore.getSimplifiedFilters[props.filter.id ?? '']![1]}`))
</script>
