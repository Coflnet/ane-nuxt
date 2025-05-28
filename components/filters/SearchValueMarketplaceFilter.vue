<template>
  <UiGrid :grid-size="2">
    <!-- Search Value -->
    <UiInput
      v-model="model!.searchValue"
      :name="$t('searchValue')"
      :placeholder="$t('cameraEg')"
      :label="$t('searchValue')"
    />
    <!-- Marketplace select -->
    <UiMultiSelect
      v-model="selectedMarketplaces"
      :options="marketplaces"
      :label="$t('marketplaces')"
      override-value="all"
    />
    <!-- Search Frequency -->
    <UiDropdown
      v-model="model!.frequency"
      :options="[{ value: 'day', label: 'frequencyDay' }, { value: '12hour', label: 'every12Frequency' }]"
      :label="$t('frequency')"
    />
  </UiGrid>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'
import { marketplaces } from '~/constants/Marketplaces'

const premiumMarkets = ref(false)
const model = defineModel<Filter>()

const selectedMarketplaces = ref<{ value: string, label: string, premium?: boolean }[]>([])

watch(() => model.value!.marketplace, () => {
  selectedMarketplaces.value = []
  model.value?.marketplace.split(',').map((condidtionName) => {
    const item = marketplaces.find(m => m.value == condidtionName)
    if (item)
      selectedMarketplaces.value.push(item)
  })
})

// constuct the string send to backend here instead of in handleFilters()
watch(selectedMarketplaces, () => {
  if (selectedMarketplaces.value.map(item => item.value).includes('all')) {
    model.value!.marketplace = ''
    return
  }
  model.value!.marketplace = selectedMarketplaces.value.map(i => i.value).join(',')
})

watch(selectedMarketplaces, (_) => {
  premiumMarkets.value = false
  if (selectedMarketplaces.value.some(marketplace => marketplace.premium == true))
    premiumMarkets.value = true
}, { deep: true })
</script>
