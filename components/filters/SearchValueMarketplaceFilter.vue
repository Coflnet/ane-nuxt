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
      :options="resolvedMarketplaceOptions"
      :label="$t('marketplace')"
      override-value="all"
    />
    <!-- Search Frequency -->
    <UiDropdown
      v-if="premiumMarkets"
      v-model="model!.frequency"
      :options="frequency"
      :label="$t('frequency')"
      :disabled-string="$t('hasBasicPlanRestriction')"
      :disabled="hasBasicPlan"
    />
  </UiGrid>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'
import type { Options } from '~/constants/CreateFilterConstants'
import { marketplaces, frequency } from '~/constants/CreateFilterConstants'

const hasBasicPlan = useUserStore().currentPlan?.product == 'basic' || !useUserStore().currentPlan?.product

const premiumMarkets = ref(false)
const model = defineModel<Filter>()

const resolvedMarketplaceOptions = computed<Options[]>(() => [
  ...marketplaces,
  // Preserve saved explicit selections even if a source is no longer advertised.
  ...model.value!.marketplace.split(',').filter(value => value && !marketplaces.some(option => option.value === value))
    .map(value => ({ value, label: value })),
])

const selectedMarketplaces = computed({
  get: () => resolvedMarketplaceOptions.value.filter(option => model.value!.marketplace.split(',').includes(option.value)),
  set: (items: Options[]) => {
    model.value!.marketplace = items.map(item => item.value).join(',')
  },
})

watch(selectedMarketplaces, (_) => {
  premiumMarkets.value = false
  if (selectedMarketplaces.value.some(marketplace => marketplace.premium == true)) {
    premiumMarkets.value = true
    // the default value or every 10 minutes
    model.value!.frequency = '*/20 * * * *'
    if (useUserStore().currentPlan?.product == 'basic' || !useUserStore().currentPlan?.product)
      model.value!.frequency = '0 */6 * * *'
  }
}, { deep: true })
</script>
