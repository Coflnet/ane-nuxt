<template>
  <div class="w-full">
    <UiHeaderLabel :label="label ?? ''" :sm="true" :accent="true" />
    <input :id="name" :type="type" :placeholder="props.placeholder ?? ''" v-model="model" :class="[
      'w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400',
      error ? 'border-rose-500 dark:border-rose-500' : 'border-slate-300 dark:border-slate-600'
    ]" />
    <FooterLabel v-if="!error" :label="footer" :xs="true" />
  </div>
</template>

<script setup lang='ts'>
import FooterLabel from './FooterLabel.vue';

const props = defineProps({
  name: String,
  type: String,
  placeholder: String,
  label: String,
  footer: String,
  error: Boolean,
})

const model = defineModel()
</script>
