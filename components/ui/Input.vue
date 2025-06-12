<template>
  <div class="w-full">
    <UiHeaderLabel
      :label="label ?? ''"
      :sm="true"
      :accent="true"
    />
    <div class="relative">
      <input
        :id="name"
        v-model="model"
        :aria-label="labelAria"
        :disabled="disabled"
        :type="type"
        :placeholder="props.placeholder ?? ''"
        :class="[
          'w-full px-4 py-2 rounded-lg border bg-slate-700  focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none',
          error ? 'border-rose-500' : 'border-slate-600',
          disabled ? 'cursor-not-allowed text-gray-500' : 'text-white',
        ]"
      >
      <div
        v-if="type == 'numeric'"
        class="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400"
      >
        km
      </div>
    </div>
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
  labelAria: String,
})

const model = defineModel()
</script>
