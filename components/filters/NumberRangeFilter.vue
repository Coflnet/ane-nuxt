<template>
  <div class="min-w-0 bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
    <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 break-words">
      {{ title }}
    </h3>
    <div class="flex items-center gap-2">
      <div class="relative flex-1 min-w-0">
        <span
          v-if="unit"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs"
        >{{ unit }}</span>
        <input
          v-model="minValue"
          :type="positive ? 'text' : 'number'"
          :inputmode="positive ? 'decimal' : undefined"
          :aria-invalid="invalid"
          :min="positive ? 0 : bounds?.min"
          :max="positive ? undefined : maxValue ?? bounds?.max"
          :step="step"
          :placeholder="bounds ? String(bounds.min) : undefined"
          :aria-label="`${title} min`"
          class="min-h-11 w-full pl-3 pr-8 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          :data-testid="`${testId}-min`"
          @change="apply"
        >
      </div>
      <span class="text-slate-500 text-xs flex-shrink-0">–</span>
      <div class="relative flex-1 min-w-0">
        <span
          v-if="unit"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs"
        >{{ unit }}</span>
        <input
          v-model="maxValue"
          :type="positive ? 'text' : 'number'"
          :inputmode="positive ? 'decimal' : undefined"
          :aria-invalid="invalid"
          :min="positive ? 0 : minValue ?? bounds?.min"
          :max="positive ? undefined : bounds?.max"
          :step="step"
          :placeholder="bounds ? String(bounds.max) : undefined"
          :aria-label="`${title} max`"
          class="min-h-11 w-full pl-3 pr-8 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          :data-testid="`${testId}-max`"
          @change="apply"
        >
      </div>
    </div>
    <p
      v-if="invalid"
      role="alert"
      class="mt-2 text-sm text-rose-300"
    >
      {{ invalidMessage }}
    </p>
    <div
      v-if="bounds"
      class="flex justify-between text-xs text-slate-500 mt-2"
    >
      <span>{{ bounds.min }}{{ unit }}</span>
      <span>{{ bounds.max }}{{ unit }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { measurementNumber } from '~/utils/specFilters'

/** Min/max number inputs (like the battery range) for attributes whose values are numbers in a range. */
const props = withDefaults(defineProps<{
  title: string
  bounds?: { min: number, max: number }
  positive?: boolean
  invalidMessage?: string
  selectedMin?: number
  selectedMax?: number
  step?: number | string
  unit?: string
  testId?: string
}>(), {
  bounds: undefined,
  positive: false,
  invalidMessage: '',
  selectedMin: undefined,
  selectedMax: undefined,
  step: 1,
  unit: '',
  testId: 'range-filter',
})

const emit = defineEmits<{
  apply: [range: { min: number | null, max: number | null }]
}>()

// '' is what a cleared number input yields
const invalid = ref(false)
const minValue = ref<number | string | null>(props.selectedMin ?? null)
const maxValue = ref<number | string | null>(props.selectedMax ?? null)

watch(() => [props.selectedMin, props.selectedMax], ([min, max]) => {
  invalid.value = false
  minValue.value = min ?? null
  maxValue.value = max ?? null
})

function toNumber(value: number | string | null): number | null {
  if (props.positive) return measurementNumber(String(value ?? ''))
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function apply() {
  let min = toNumber(minValue.value)
  let max = toNumber(maxValue.value)
  invalid.value = props.positive && ((minValue.value != null && minValue.value !== '' && min === null)
    || (maxValue.value != null && maxValue.value !== '' && max === null)
    || (min !== null && max !== null && min > max))
  if (invalid.value) return
  if (min !== null && max !== null && min > max) [min, max] = [max, min]
  emit('apply', { min, max })
}
</script>
