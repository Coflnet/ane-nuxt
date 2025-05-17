<template>
  <div
    ref="dropdownContainer"
    class="relative w-full "
  >
    <!-- Dropdown toggle button -->
    <UiHeaderLabel
      :label="label"
      :sm="true"
      :accent="true"
    />
    <button
      type="button"
      class=" w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 flex items-center justify-between"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggleDropdown"
      @keydown.esc="isOpen = false"
    >
      <span
        v-if="selectedItems.length === 0"
        class="text-slate-400"
      >
        {{ $t('selectMarket') }}
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
      <div
        v-for="option in options"
        :key="option.value"
        class="flex items-center px-4 py-2 cursor-pointer hover:bg-slate-700 focus:bg-slate-700 focus:outline-none"
        :class="{ 'bg-slate-700': isSelected(option) }"
        role="option"
        :aria-selected="isSelected(option)"
        tabindex="0"
        @click="toggleSelection(option)"
        @keydown.enter="toggleSelection(option)"
        @keydown.space.prevent="toggleSelection(option)"
      >
        <div class="flex items-center justify-center w-5 h-5 mr-3 rounded-full border border-slate-400 bg-slate-900">
          <div
            v-if="isSelected(option)"
            class="w-3 h-3 rounded-full bg-indigo-500"
          />
        </div>
        <span class="text-white">{{ $t(option.label) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { UiHeaderLabel } from '#components'

const dropdownContainer = ref<HTMLElement | null>(null) // Ref for the container
const { t } = useI18n()
const model = defineModel<{ value: string, label: string }[]>()
const props = defineProps<{
  options: { value: string, label: string }[]
  overrideValue?: string
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: { value: string, label: string }[]): void
}>()

watch(model, () => {
  selectedItems.value = toRaw(model.value!)
})

const isOpen = ref(false)
const selectedItems = ref<{ value: string, label: string }[]>([])

// create the string that is displayed on the button eq. Ebay, AutoScout24
const selectedLabels = computed(() => {
  if (selectedItems.value.length === 0) return ''
  const rawSelectedItems = selectedItems.value.map(item => toRaw(item)) // Convert Proxies to raw objects
  const selected = props.options
    .filter(option => rawSelectedItems.some(selectedItem =>
      selectedItem.value === option.value && selectedItem.label === option.label, // Compare all relevant properties
    ))
    .map(option => t(option.label))

  if (selected.length <= 3) {
    return selected.join(', ')
  }

  return `${selected.slice(0, 3).join(', ')} +${selected.length - 3}`
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value

  // this is required so you can multiple multi select objects at once
  if (isOpen.value && dropdownContainer.value) {
    window.addEventListener('click', handleGlobalClick)
  }
  else {
    window.removeEventListener('click', handleGlobalClick)
  }
}

const isSelected = (value: { value: string, label: string }): boolean => {
  return selectedItems.value.includes(value)
}

// Toggle selection of an item
const toggleSelection = (value: { value: string, label: string }) => {
  const index = selectedItems.value.indexOf(value)
  if (index === -1) {
    // deselect all other options when the overrideValue is selected
    if (value.value === props.overrideValue) {
      selectedItems.value = [value]
      emit('update:modelValue', [...selectedItems.value])
      return
    }

    // fuck .include and fuck .filter
    if (selectedItems.value.map(item => item.value).includes(props.overrideValue ?? ''))
      selectedItems.value = []

    selectedItems.value.push(value)
  }
  else
    selectedItems.value.splice(index, 1)

  emit('update:modelValue', [...selectedItems.value])
}

const handleGlobalClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (isOpen.value && dropdownContainer.value && !dropdownContainer.value.contains(target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  toggleSelection(props.options![0]!)
})

onBeforeUnmount(() => {
  // Ensure the global listener is removed if the component is unmounted while open
  window.removeEventListener('click', handleGlobalClick)
})
</script>
