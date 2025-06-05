<template>
  <div>
    <label
      :for="id"
      class="block text-sm font-medium text-slate-300 mb-1"
    >
      {{ label }}
    </label>

    <UiTooltipHover
      v-if="disabled"
      :text="$t('hasBasicPlanRestriction')"
    >
      <select
        :id="id"
        v-model="model"
        class="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        :class="disabled ? 'cursor-not-allowed opacity-80' : ''"
        required
        :disabled="disabled"
      >
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ $t(option.label) }}
        </option>
      </select>
    </UiTooltipHover>
  </div>
</template>

<script setup lang="ts">
const model = defineModel<string>()

defineProps<{
  options?: { value: string, label: string }[]
  id?: string
  label?: string
  disabled?: boolean
}>()
</script>
