<template>
  <div>
    <label :for="name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{{ props.label
    }}</label>
    <input :id="name" type="text" :placeholder="props.placeholder ?? ''" v-model="model"
      class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
      required />
  </div>
</template>

<script setup lang='ts'>
const props = defineProps({
  name: {
    type: String,
    required: true
  },
  placeholder: {
    type: [String, null],
    required: false
  },
  label: {
    type: [String, null],
    required: false
  }
})

const model = defineModel()
</script>
