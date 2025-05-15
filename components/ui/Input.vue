<template>
  <div class="w-full">
    <UiHeaderLabel
      :label="label ?? ''"
      :sm="true"
      :accent="true"
    />
    <input
      :id="name"
      v-model="model"
      :disabled="disabled"
      :type="type"
      :placeholder="props.placeholder ?? ''"
      :class="[
        'w-full px-4 py-2 rounded-lg border bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400',
        error ? 'border-rose-500' : 'border-slate-600',
        disabled ? 'cursor-not-allowed' : '',
      ]"
    >
    <FooterLabel
      v-if="!error"
      :label="footer"
      :xs="true"
    />
  </div>
</template>

<script setup lang='ts'>
import FooterLabel from './FooterLabel.vue'

const props = defineProps({
  name: String,
  type: String,
  placeholder: String,
  label: String,
  footer: String,
  error: Boolean,
  disabled: Boolean,
})

const model = defineModel()
</script>
