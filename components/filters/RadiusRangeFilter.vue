<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-x-8 ">
    <div>
      <AneTextField v-model="filter.searchRadius" :label="$t('searradi')" type="number" placeholder="e.g., 10"
        :footer="$t('radi')" :radiusError="radiusError" />
      <p v-if="radiusError" class="mt-1 text-xs text-rose-500">{{ radiusErrorMessage }} </p>
    </div>

    <AneTextField v-model="filter.zipcode" :label="$t('zip')" type="number" placeholder="e.g., xxxxx"
      :footer="$t('yourZip')" :radiusError="radiusError" />

    <div class="flex items-center mb-4 space-x-2 col-span-2">
      <AneTextField v-model="filter.minPrice" :label="$t('priceRan')" type="number" placeholder="" />
      <span class="text-slate-500 dark:text-slate-400 mt-3.5">-</span>
      <AneTextField v-model="filter.maxPrice" class="mt-5" type="number" placeholder="0" />
    </div>

  </div>
</template>

<script setup lang='ts'>
import { AneTextField } from '#components';

const { t } = useI18n();
const radiusErrorMessage = computed(() => {
  console.log(props.filter.marketplace)
  if (!radiusError) return ''
  return props.filter.marketplace === 'ebay'
    ? t('searNoEbay')
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

// Validate if the user has inputed a zip code along with the radius as the user location is required
function validateRadiusAndZipcode(radius: any, zipcode: string) {
  if (radius && !zipcode) {
    radiusError.value = true
  } else {
    radiusError.value = false
  }
}

</script>
