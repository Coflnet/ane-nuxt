<template>
  <UiGrid :grid-size="3">
    <CountryDropDown :model-value="model" />
    <div>
      <UiInput
        v-model="model!.searchRadius"
        :label="$t('searchRadius')"
        type="number"
        :placeholder="$t('radiusEq', 80)"
        :footer="$t('searchRadiusAroundYou')"
        :error="radiusError"
      />
      <p
        v-if="radiusError"
        class="mt-1 text-xs text-rose-500"
      >
        {{ radiusErrorMessage }}
      </p>
    </div>

    <UiInput
      v-model="model!.zipcode"
      :label="$t('zipCode')"
      type="number"
      :placeholder="$t('zipCodeEq')"
      :footer="$t('yourZip')"
      :error="radiusError"
    />
  </UiGrid>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'
import CountryDropDown from '~/components/ui/CountryDropDown.vue'

const { t } = useI18n()
const radiusError = ref(false)
const model = defineModel<Filter>()

const radiusErrorMessage = computed(() => {
  if (!radiusError.value) return ''
  return model.value!.marketplace === 'ebay'
    ? t('searchRadiusRequiresEbay')
    : t('zipCodePlease')
})

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
