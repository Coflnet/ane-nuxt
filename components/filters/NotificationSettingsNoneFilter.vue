<template>
  <div
    class="flex items-center p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
    <div class="flex items-center h-5">
      <input id="none-notification" v-model="filter.notificationType" type="radio" value="none"
        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
    </div>
    <label for="none-notification" class="ml-3 flex items-center">
      <div class="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-3">
        <XIcon class="w-5 h-5 text-slate-600 dark:text-slate-400" />
      </div>
      <div>
        <p class="font-medium text-slate-900 dark:text-white">None</p>
        <p class="text-xs text-slate-500 dark:text-slate-400">Don't send any notifications</p>
      </div>
    </label>
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
