<template>
  <div class="relative w-full">
    <!-- Progress bar container -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium text-gray-500">{{ startLabel }}</span>
      <span class="text-sm font-medium text-gray-500">{{ endLabel }}</span>
    </div>

    <div class="h-5 bg-slate-700 rounded-full overflow-hidden border-1">
      <div
        class="h-full rounded-full transition-all duration-300 ease-in-out bg-gradient-to-r from-indigo-500 to-purple-600"
        :style="{ width: `${progressPercentage}%` }"
      />
    </div>

    <!-- Floating indicator -->
    <div
      v-if="progressPercentage > 10"
      class="absolute top-0 -ml-0.5 transform -translate-x-1/2 transition-all duration-300 ease-in-out"
      :style="{ left: `${progressPercentage}%` }"
    >
      <div
        class="font-medium transform rounded-lg border bg-slate-700 border-slate-600 text-sm p-1 -mt-1 text-gray-200 z-50"
      >
        {{ indicatorText }}
      </div>
      <div class="w-2 h-2 bg-gray-700 border-r border-b border-gray-600 transform rotate-45 mx-auto -mt-1 " />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ProgressBarProps {
  progress: number
  min?: number
  max?: number
  startLabel?: string
  endLabel?: string
  indicatorText?: string
}

const props = withDefaults(defineProps<ProgressBarProps>(), {
  min: 0,
  max: 100,
  startLabel: '0',
  endLabel: '100%',
  color: 'primary',
  showPercentage: true,
  indicatorText: '',
})

// Calculate progress percentage within bounds
const progressPercentage = computed(() => {
  const range = props.max - props.min
  const adjustedProgress = Math.max(props.min, Math.min(props.max, props.progress))
  return ((adjustedProgress - props.min) / range) * 100
})
</script>
