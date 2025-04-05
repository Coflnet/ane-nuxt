<template>
  <div
    class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
    <div class="p-4">
      <div class="flex items-start justify-between mb-3">
        <div>
          <h3 class="font-medium text-lg text-slate-900 dark:text-white">{{ props.filter?.name }}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ props.filter?.targetType }}</p>
        </div>
        <div class="flex items-center space-x-1">
          <button class="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700" title="Edit filter">
            <EditIcon class="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
          <button class="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700" title="Delete filter">
            <TrashIcon class="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <!--
              <div class="space-y-2 mb-4">
                <div v-if="filter.keywords.length > 0" class="flex flex-wrap gap-1">
                  <span v-for="(keyword, i) in filter.keywords" :key="i"
                    class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {{ keyword }}
                  </span>
                </div>

              <div v-if="filter.priceRange" class="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <TagIcon class="w-4 h-4 mr-1" />
                <span>{{ filter.priceRange }}</span>
              </div>


              <div v-if="filter.location" class="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <MapPinIcon class="w-4 h-4 mr-1" />
                <span>{{ filter.location }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
              <div class="flex items-center space-x-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="filter.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'">
                  {{ filter.active ? 'Active' : 'Paused' }}
                </span>
                <span class="text-sm text-slate-500 dark:text-slate-400">{{ filter.matchCount }} matches</span>
              </div>
              <NuxtLink :to="`/auctions?filter=${filter.id}`"
                class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                View matches
              </NuxtLink>
            </div>
            -->
    </div>
  </div>
</template>

<script setup lang='ts'>
import type { ListingListener } from '~/src/api-client'

const props = defineProps({
  filter: Object as PropType<ListingListener>
})

onMounted(() => {
  // This is a placeholder for any setup logic you might need
  console.log('FilterCard mounted with filter:', props.filter)
})

</script>
