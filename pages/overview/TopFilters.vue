<template>

  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
    <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">{{ $t('topF') }}</h2>
    <div class="space-y-4">
      <div v-for="(filter, index) in sortTopFilers()" :key="index" class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div
            class="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
            {{ index + 1 }}
          </div>
          <div>
            <p class="font-medium text-slate-900 dark:text-white">{{ filter.name }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ filter.keywords.join(', ') }}</p>
          </div>
        </div>
        <p class="text-sm font-medium text-slate-900 dark:text-white">{{ filter.matches }} matches</p>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">

const props = defineProps<{
  topFilters: Record<string, topFilter>
}>()

function sortTopFilers(): topFilter[] {
  const array = Object.values(props.topFilters);

  const sortedArray = array.sort((a: topFilter, b: topFilter) => b.matches - a.matches);
  return sortedArray
}

</script>
