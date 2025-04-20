<template>
  <div class="space-y-2 mb-4">
    <div v-if="filter.keywords.length > 0" class="flex flex-wrap gap-1">
      <span v-for="(keyword, i) in filter.keywords" :key="i"
        class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
        {{ keyword }}
      </span>
    </div>

    <div v-if="filter.priceRange" class="flex items-center text-sm text-slate-500 dark:text-slate-400">
      <TagIcon class="w-4 h-4 mr-1" />
      <span>{{ handleMixMaxString(filter.priceRange) }}</span>
    </div>
    <div v-if="filter.location" class="flex items-center text-sm text-slate-500 dark:text-slate-400">
      <MapPinIcon class="w-4 h-4 mr-1" />
      <span>{{ handleLocationString(filter.location) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MapPinIcon, TagIcon } from 'lucide-vue-next';
import type { FilterFace } from '~/types/FilterType';


defineProps<{ filter: FilterFace }>()

function handleMixMaxString(value: string): string {
  if (value == "")
    return "";
  const [min, max] = value.split('-')
  return `$${min} - $${max}`
}

function handleLocationString(value: string): string {
  if (value == "")
    return "";
  const [_lon, _lat, radius] = value.split(';')
  return `${radius} KM`
}
</script>
