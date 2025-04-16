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
