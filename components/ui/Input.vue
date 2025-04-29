<template>
  <div class="w-full">
    <UiHeaderLabel :label="label ?? ''" :sm="true" :accent="true" />
    <input :data-testid="testId" :id="name" :type="type" :placeholder="props.placeholder ?? ''" v-model="model" :class="[
      'w-full px-4 py-2 rounded-lg border bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400',
      error ? 'border-rose-500' : 'border-slate-600'
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
  testId: String
})

const model = defineModel()
</script>
