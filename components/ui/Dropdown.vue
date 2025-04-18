<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {{ label }}
    </label>
    <select :id="id" :value="modelValue" @input="$emit('update:modelValue', modelValue)"
      class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
      required>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
const modelValue = defineModel();
const props = defineProps<{
  modelValue: string,
  options?: { value: string, label: string }[],
  id?: string,
  label?: string
}>()
</script>
