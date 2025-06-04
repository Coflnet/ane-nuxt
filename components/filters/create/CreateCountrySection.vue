<template>
  <UiGrid
    :grid-size="3"
    class="mt-3"
  >
    <UiCountryDropDown :model-value="model" />
    <UiMultiSelect
      v-model="deliveryKindSelected"
      :label="$t('deliveryMethod')"
      :options="deliveryKind"
      override-value="all"
    />
    <div class="flex space-x-4">
      <UiInput
        v-model="model!.zipcode"
        :label="$t('zipCode')"
        type="number"
        :placeholder="$t('zipCodeEq')"
        :footer="$t('yourZip')"
      />

      <FiltersNotificationSettingsRadius :model-value="model" />
    </div>
  </UiGrid>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'
import { deliveryKind } from '~/constants/CreateFilterConstants'

const model = defineModel<Filter>()

const deliveryKindSelected = ref<{ value: string, label: string }[]>([])

watch(() => model.value!.deliveryMethod, () => {
  deliveryKindSelected.value = []
  model.value?.deliveryMethod.split(',').map((condidtionName) => {
    const item = deliveryKind.find(m => m.value == condidtionName)
    if (item)
      deliveryKindSelected.value.push(item)
  })
})

// constuct the string send to backend here instead of in handleFilters()
watch(deliveryKindSelected, () => {
  if (deliveryKindSelected.value.map(item => item.value).includes('all')) {
    model.value!.deliveryMethod = ''
    return
  }
  model.value!.deliveryMethod = deliveryKindSelected.value.map(i => i.value).join(',')
})
</script>
