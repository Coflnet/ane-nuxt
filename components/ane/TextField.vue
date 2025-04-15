<template>
  <div class="w-full">
    <label :for="name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{{ props.label
      }}</label>
    <input :id="name" :type="type" :placeholder="props.placeholder ?? ''" v-model="model" :class="[
      'w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400',
      radiusError ? 'border-rose-500 dark:border-rose-500' : 'border-slate-300 dark:border-slate-600'
    ]" />
    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
      {{ footer }}
    </p>

  </div>
</template>

<script setup lang='ts'>
const props = defineProps({
  name: String,
  type: String,
  placeholder: String,
  label: String,
  footer: String,
  radiusError: Boolean,
})

const model = defineModel()
</script>
