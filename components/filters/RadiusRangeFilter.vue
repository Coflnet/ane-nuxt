<template>
  <!-- The grid component does not want to work with this -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-x-8 ">
    <div>
      <UiInput v-model="filter.searchRadius" :label="$t('searchRadius')" type="number" :placeholder="$t('radiusEq', 80)"
        :footer="$t('searchRadiusAroundYou')" :error="radiusError" />
      <p v-if="radiusError" class="mt-1 text-xs text-rose-500">{{ radiusErrorMessage }} </p>
    </div>

    <UiInput v-model="filter.zipcode" :label="$t('zipCode')" type="number" :placeholder="$t('zipCodeEq')"
      :footer="$t('yourZip')" :error="radiusError" />

    <div class="flex items-center mb-4 space-x-2 col-span-2">
      <UiInput v-model="filter.minPrice" :label="$t('priceRange')" type="number" placeholder="" />
      <span class="text-slate-400 mt-3.5">-</span>
      <UiInput v-model="filter.maxPrice" class="mt-5" type="number" placeholder="0" />
    </div>
  </div>
</template>

<script setup lang='ts'>
const { t } = useI18n();
const radiusErrorMessage = computed(() => {
  if (!radiusError) return ''
  return props.filter.marketplace === 'ebay'
    ? t('searchRadiusRequiresEbay')
    : t('zipCodePlease')
})

const props = defineProps({
  filter: {
    type: Object,
    required: true
  },
})

const radiusError = ref(false);

watch([() => props.filter.searchRadius, () => props.filter.zipcode], ([newRadius, newZipcode]) => {
  validateRadiusAndZipcode(newRadius, newZipcode)
}, { immediate: true })

// no zip code with radius entred bad
function validateRadiusAndZipcode(radius: any, zipcode: string) {
  if (radius && !zipcode) {
    radiusError.value = true
    return;
  }
  radiusError.value = false
}

</script>
