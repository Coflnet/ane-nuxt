<template>
  <div class="relative w-full ">
    <!-- Dropdown toggle button -->
    <UiHeaderLabel
      :label="label"
      :sm="true"
      :accent="true"
    />
    <Listbox
      v-model="selectedItems"
      multiple
    >
      <ListboxButton
        class="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 flex items-center justify-between"
        @click="isOpen = !isOpen"
      >
        {{ selectedLabels }}
        <UiIcon
          name="tabler:chevron-down"
          :bold="true"
          :large="true"
          :class="[{ 'rotate-180': isOpen }, 'transition-all']"
        />
      </ListboxButton>
      <ListboxOptions
        class="absolute z-10 mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 shadow-lg max-h-60 overflow-auto"
      >
        <ListboxOption
          v-for="item in options"
          :key="item.value"
          :value="item"
          class="flex items-center px-4 py-2 cursor-pointer hover:bg-slate-700 focus:bg-slate-700 focus:outline-none"
          :class="{ 'bg-slate-700': isSelected(item) }"
          @click="toggleSelection(item)"
        >
          <div class="flex items-center justify-center w-5 h-5 mr-3 rounded-full border border-slate-400 bg-slate-900">
            <div
              v-if="isSelected(item)"
              class="w-3 h-3 rounded-full bg-indigo-500"
            />
          </div>

          <span class="text-white">{{ $t(item.label) }}</span>
        </ListboxOption>
      </ListboxOptions>
    </Listbox>
  </div>
</template>

<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { UiHeaderLabel } from '#components'

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

const isSelected = (value: { value: string, label: string }): boolean => {
  return selectedItems.value.includes(value)
}

// Toggle selection of an item
const toggleSelection = (value: { value: string, label: string }) => {
  // deselect all other options when the overrideValue is selected
  if (value.value === props.overrideValue) {
    selectedItems.value = [value]
    emit('update:modelValue', [...selectedItems.value])
    return
  }
  if (selectedItems.value.map(item => item.value).includes(props.overrideValue ?? ''))
    selectedItems.value = [value]
  emit('update:modelValue', [...selectedItems.value])
}

onMounted(() => {
  toggleSelection(props.options![0]!)
})
</script>
