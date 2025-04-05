<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label for="location" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
      <input id="location" v-model="props.filter.location" type="text" placeholder="e.g., Berlin"
        class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
    </div>

    <div>
      <label for="radius" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Radius
        (km)</label>
      <input id="radius" v-model="props.filter.radius" type="number" placeholder="e.g., 50"
        class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
    </div>
  </div>
</template>

<script setup lang='ts'>
const props = defineProps({
  filter: {
    type: Object,
    required: true
  }
})
</script>
