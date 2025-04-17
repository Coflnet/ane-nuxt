<template>
  <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
        <Icon :name="icon" class="size-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div>
        <p class="font-medium text-slate-900 dark:text-white">{{ name }}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ message }}</p>
      </div>
    </div>
    <div class="flex items-center">
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Active
      </span>
    </div>
  </div>

</template>

<script setup lang="ts">

defineProps({ name: String, icon: String, message: String })

</script>
