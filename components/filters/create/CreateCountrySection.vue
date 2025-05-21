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

      <UiInput
        v-model="model!.searchRadius"
        :disabled="model?.zipcode == ''"
        :label="$t('searchRadius')"
        type="numeric"
        :placeholder="$t('radiusEq', 80)"
        :footer="$t('searchRadiusAroundYou')"
      />
    </div>
  </UiGrid>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'

const model = defineModel<Filter>()

const deliveryKindSelected = ref<{ value: string, label: string }[]>([])
const deliveryKind = [
  { value: 'all', label: 'allDelivery' },
  { value: 'shipping', label: 'shippingDelivery' },
  { value: 'pickup', label: 'pickupDelivery' },
]

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
