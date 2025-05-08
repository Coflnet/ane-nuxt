<template>
  <div class="relative w-full">
    <!-- Dropdown toggle button -->
    <UiFooterLabel :label="label" />
    <button
      type="button"
      class="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 flex items-center justify-between"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggleDropdown"
      @keydown.esc="isOpen = false"
    >
      <span
        v-if="selectedItems.length === 0"
        class="text-slate-400"
      >
        {{ $t('placeholder') }}
      </span>
      <span
        v-else
        class="truncate"
      >
        {{ selectedLabels }}
      </span>
      <UiIcon
        name="tabler:chevron-down"
        :bold="true"
        :class="[{ 'rotate-180': isOpen }, 'transition-all']"
      />
    </button>

    <!-- Dropdown menu -->
    <div
      v-if="isOpen"
      class="absolute z-10 mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 shadow-lg max-h-60 overflow-auto"
      role="listbox"
      aria-multiselectable="true"
    >
      <div class="py-1">
        <div
          v-for="option in options"
          :key="option.value"
          class="flex items-center px-4 py-2 cursor-pointer hover:bg-slate-700 focus:bg-slate-700 focus:outline-none"
          :class="{ 'bg-slate-700': isSelected(option.value) }"
          role="option"
          :aria-selected="isSelected(option.value)"
          tabindex="0"
          @click="toggleSelection(option.value)"
          @keydown.enter="toggleSelection(option.value)"
          @keydown.space.prevent="toggleSelection(option.value)"
        >
          <div class="flex items-center justify-center w-5 h-5 mr-3 rounded-full border border-slate-400 bg-slate-900">
            <div
              v-if="isSelected(option.value)"
              class="w-3 h-3 rounded-full bg-indigo-500"
            />
          </div>
          <span class="text-white">{{ option.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const model = defineModel<string[]>()
const props = defineProps<{
  options: { value: string, label: string }[]
  id?: string
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const isOpen = ref(false)
const selectedItems = ref<string[]>([...model.value ?? ''])

const selectedLabels = computed(() => {
  if (selectedItems.value.length === 0) return ''

  const selected = props.options
    .filter(option => selectedItems.value.includes(option.value))
    .map(option => option.label)

  if (selected.length <= 3) {
    return selected.join(', ')
  }

  return `${selected.slice(0, 3).join(', ')} +${selected.length - 3}`
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

// Check if an item is selected
const isSelected = (value: string): boolean => {
  return selectedItems.value.includes(value)
}

// Toggle selection of an item
const toggleSelection = (value: string) => {
  const index = selectedItems.value.indexOf(value)
  if (index === -1) {
    selectedItems.value.push(value)
  }
  else {
    selectedItems.value.splice(index, 1)
  }
  emit('update:modelValue', [...selectedItems.value])
}

// Watch for external changes to modelValue
watch(() => model.value, (newValue) => {
  selectedItems.value = [...newValue ?? '']
}, { deep: true })

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const dropdown = document.querySelector('[role="listbox"]')
  const button = document.querySelector('[aria-haspopup="listbox"]')

  if (isOpen.value && dropdown && button
    && !dropdown.contains(target)
    && !button.contains(target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
