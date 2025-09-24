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
    <div class="flex">
      <div class="mr-6 w-20">
        <UiCheckbox
          v-model="isEbay"
          :label="$t('useEbayMarketplace')"
        />
      </div>
      <UiMultiSelect

        v-model="selectedMarketplaces"
        :disabled="isEbay"
        :options="resolvedMarketplaceOptions"
        :label="$t('marketplace')"
        override-value="all"
      />
    </div>
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
import { marketplaces, usMarketplaces, frequency, detectLocationNA } from '~/constants/CreateFilterConstants'

const hasBasicPlan = useUserStore().currentPlan?.product == 'basic' || !useUserStore().currentPlan?.product

const premiumMarkets = ref(false)
const model = defineModel<Filter>()
const isEbay = ref(false)

const resolvedMarketplaceOptions = ref<Options[]>(detectLocationNA() ? usMarketplaces : marketplaces)

const selectedMarketplaces = ref<Options[]>([])

watch(isEbay, (newVal) => {
  if (newVal) {
    model.value!.marketplace = 'Ebay'
  }
})

watch(() => model.value!.marketplace, () => {
  if (model.value?.marketplace == 'Ebay') {
    isEbay.value = true
    return
  }

  selectedMarketplaces.value = []
  model.value?.marketplace.split(',').map((condidtionName) => {
    const item = resolvedMarketplaceOptions.value.find(m => m.value == condidtionName)
    if (item)
      selectedMarketplaces.value.push(item)
  })
})

// constuct the string send to backend here instead of in handleFilters()
watch(selectedMarketplaces, () => {
  if (selectedMarketplaces.value.map(item => item.value).includes('all')) {
    model.value!.marketplace = 'all'
    return
  }
  model.value!.marketplace = selectedMarketplaces.value.map(i => i.value).join(',')
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
