<template>
  <div class="relative w-full ">
    <!-- Dropdown toggle button -->
    <div class="flex">
      <UiHeaderLabel
        :label="label"
        :accent="true"
        :sm="true"
      />
      <UiTooltipHover
        v-if="hoverText"
        :text="hoverText"
      >
        <div
          class="border bg-slate-700 text-white border-slate-800 text-sm rounded-full size-6 text-center ml-2 -translate-y-0.5"
        >
          ?
        </div>
      </UiTooltipHover>
    </div>
    <Listbox
      :model-value="selectedItems"
      by="value"
      multiple
      @update:model-value="updateSelection"
    >
      <ListboxButton
        :aria-label="labelAria ?? 'Multi Select Dropdown'"
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
        class="absolute z-10 mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 shadow-lg"
      >
        <ListboxOption
          v-for="item in options"
          :key="item.value"
          :aria-label="`${item.label} Item`"
          :value="item"
          class="flex items-center px-4 py-2 cursor-pointer hover:bg-slate-700 focus:bg-slate-700 focus:outline-none"
          :class="{ 'bg-slate-700': isSelected(item) }"
        >
          <div class="flex items-center justify-center w-5 h-5 mr-3 rounded-full border border-slate-400 bg-slate-900">
            <div
              v-if="isSelected(item)"
              class="w-3 h-3 rounded-full bg-indigo-500"
            />
          </div>

          <div class="w-full justify-between flex">
            <span class="text-white">{{ $t(item.label) }}</span>
            <UiTooltipHover
              v-if="item.premium"
              :text="$t('premiumHoverExplanation')"
              class="max-w-28"
            >
              <div
                class="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 text-white font-medium"
              >
                {{ $t('premium') }}
              </div>
            </UiTooltipHover>
          </div>
        </ListboxOption>
      </ListboxOptions>
    </Listbox>
  </div>
</template>

<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { UiHeaderLabel } from '#components'
import type { Options } from '~/constants/CreateFilterConstants'

const { t } = useI18n()
const selectedItems = defineModel<Options[]>({ default: () => [] })
const props = defineProps<{
  options: Options[]
  overrideValue?: string
  label?: string
  hoverText?: string
  labelAria?: string
}>()

const isOpen = ref(false)

// create the string that is displayed on the button eq. Kleinanzeigen, AutoScout24
const selectedLabels = computed(() => {
  if (selectedItems.value.length === 0) return ''
  const selected = props.options
    .filter(option => selectedItems.value.some(item => item.value === option.value))
    .map(option => t(option.label))

  if (selected.length <= 3) {
    return selected.join(', ')
  }

  return `${selected.slice(0, 3).join(', ')} +${selected.length - 3}`
})

const isSelected = (value: Options): boolean => selectedItems.value.some(item => item.value === value.value)

function updateSelection(items: Options[]) {
  const override = items.find(item => item.value === props.overrideValue)
  selectedItems.value = override && !selectedItems.value.some(item => item.value === props.overrideValue)
    ? [override]
    : items.filter(item => item.value !== props.overrideValue)
}

onMounted(() => {
  if (selectedItems.value.length === 0 && props.options[0])
    selectedItems.value = [props.options[0]]
})
</script>
