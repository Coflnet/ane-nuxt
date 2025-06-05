<template>
  <div class="relative flex items-center group w-full justify-center">
    <button
      type="button"
      class="inline-flex items-center justify-center w-full"
      @click.stop="toggleTooltip"
      @mouseenter="showTooltip"
      @mouseleave="hideTooltip"
    >
      <slot />
    </button>

    <div
      v-if="!disabled"
      :class="{
        'opacity-0 scale-95 hidden': !isOpen,
        'opacity-100 scale-100 block': isOpen,
        'group-hover:opacity-100 group-hover:scale-100 group-hover:block': true,
      }"
      class="absolute transition-all font-medium transform rounded-lg border bg-slate-700 text-white border-slate-600
        text-sm px-2 py-1 w-64   bottom-full text-center z-50 mb-2"
    >
      {{ text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  text?: string
  disabled?: boolean }>()

const isOpen = ref<boolean>(false)
let timeoutId: number | null = null

const toggleTooltip = (): void => {
  isOpen.value = !isOpen.value
}

const showTooltip = (): void => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  isOpen.value = true
}

const hideTooltip = (): void => {
  timeoutId = setTimeout(() => {
    isOpen.value = false
  }, 100)
}

const handleClickOutside = (event: MouseEvent): void => {
  const target = event.target as HTMLElement
  const tooltipTrigger = target.closest('.group')

  if (!tooltipTrigger || !tooltipTrigger.contains(target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
