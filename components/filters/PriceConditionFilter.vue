<template>
  <!-- The grid component does not want to work with this -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-x-8 pt-2 mt-4">
    <UiMultiSelect
      v-model="condiditonSelected"
      label-aria="Condition Select"
      class="col-span-2"
      :label="$t('condition')"
      :options="condidtion"
      override-value="all"
    />

    <div class="flex items-center mb-4 space-x-2 col-span-2 mt-4">
      <UiInput
        v-model="model!.minPrice"
        label-aria="Min Price Input"
        :label="$t('priceRange')"
        type="number"
        placeholder=""
      />
      <span class="text-slate-400 mt-3.5">-</span>
      <UiInput
        v-model="model!.maxPrice"
        label-aria="Max Price Input"
        class="mt-5"
        type="number"
        placeholder="0"
      />
    </div>
  </div>
</template>

<script setup lang='ts'>
import type { Filter } from '~/types/FilterType'
import { condidtion } from '~/constants/CreateFilterConstants'

const condiditonSelected = ref<{ value: string, label: string }[]>([])

const model = defineModel<Filter>()

// reconstuct the selected conditions from a string updated when editing a filter
watch(() => model.value!.condition, () => {
  condiditonSelected.value = []
  model.value?.condition.split(',').map((condidtionName) => {
    const marketplaceItem = condidtion.find(m => m.value == condidtionName)
    if (marketplaceItem)
      condiditonSelected.value.push(marketplaceItem)
  })
})

// constuct the string send to backend here instead of in handleFilters()
watch(condiditonSelected, () => {
  if (condiditonSelected.value.map(item => item.value).includes('all')) {
    model.value!.condition = ''
    return
  }
  model.value!.condition = condiditonSelected.value.map(i => i.value).join(',')
})
</script>
