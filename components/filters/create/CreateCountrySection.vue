<template>
  <div class="mt-3">
    <UiGrid :grid-size="3">
      <UiCountryDropDown :model-value="model" />
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
    </UiGrid>
  </div>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'

const model = defineModel<Filter>()
</script>
