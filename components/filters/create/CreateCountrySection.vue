<template>
  <div>
    <UiGrid :grid-size="3">
      <UiCountryDropDown :model-value="model" />
      <UiInput
        v-model="model!.zipcode"
        :label="$t('zipCode')"
        type="number"
        :placeholder="$t('zipCodeEq')"
        :footer="$t('yourZip')"
        :error="radiusError"
      />

      <div>
        <UiInput
          v-model="model!.searchRadius"
          :disabled="model?.zipcode == ''"
          :label="$t('searchRadius')"
          type="number"
          :placeholder="$t('radiusEq', 80)"
          :footer="$t('searchRadiusAroundYou')"
        />
      </div>
    </UiGrid>
  </div>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'

const { t } = useI18n()
const radiusError = ref(false)
const model = defineModel<Filter>()

watch([() => model.value!.searchRadius, () => model.value!.zipcode], ([newRadius, newZipcode]) => {
  validateRadiusAndZipcode(newRadius, newZipcode)
}, { immediate: true })

function validateRadiusAndZipcode(radius: number | null, zipcode: string) {
  if (radius && !zipcode) {
    radiusError.value = true
    return
  }
  radiusError.value = false
}
</script>
