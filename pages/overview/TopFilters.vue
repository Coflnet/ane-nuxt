<template>
  <UiDefaultContainer class="p-6">
    <UiHeaderLabel :label="$t('topF')" />
    <div class="space-y-4 mt-4">
      <div v-for="(filter, index) in sortTopFilers()" :key="index" class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div
            class="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
            {{ index + 1 }}
          </div>
          <div>

            <UiFooterLabel :label="filter.name" :white="true" />
            <UiFooterLabel :label="filter.keywords.join(', ')" />
            <p class="text-xs text-slate-400">{{ filter.keywords.join(', ') }}</p>
          </div>
        </div>

        <UiFooterLabel :label="`${filter.matches} ${$t('matches')}`" :white="true" :xs="true" />
      </div>
    </div>
  </UiDefaultContainer>

</template>

<script setup lang="ts">
import type { TopFilter } from '~/types/FilterType';

const props = defineProps<{
  topFilters: Record<string, TopFilter>
}>()

function sortTopFilers(): TopFilter[] {
  const array = Object.values(props.topFilters);

  const sortedArray = array.sort((a: TopFilter, b: TopFilter) => b.matches - a.matches);
  return sortedArray.slice(0, 4)
}

</script>
