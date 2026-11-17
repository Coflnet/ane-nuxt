<template>
  <UiMultiSelect
    v-model="conditionSelected"
    label-aria="Condition Select"
    :label="$t('condition')"
    :options="condidtion"
    override-value="all"
  />
</template>

<script setup lang='ts'>
import type { Filter } from '~/types/FilterType'
import { condidtion } from '~/constants/CreateFilterConstants'

const model = defineModel<Filter>()
const conditionSelected = ref<{ value: string, label: string }[]>([])

// Rebuild the selection from the saved/prefilled string; immediate, so a prefilled
// condition is selected before the dropdown falls back to its "all" default on mount.
watch(() => model.value!.condition, (condition) => {
  const selected = condidtion.filter(option => condition.split(',').includes(option.value))
  // '' (any, or a saved filter without Condition) shows "all" like a fresh dropdown does.
  conditionSelected.value = selected.length ? selected : condidtion.slice(0, 1)
}, { immediate: true })

watch(conditionSelected, () => {
  if (conditionSelected.value.some(item => item.value === 'all')) {
    model.value!.condition = 'all'
    return
  }
  model.value!.condition = conditionSelected.value.map(i => i.value).join(',')
})
</script>
