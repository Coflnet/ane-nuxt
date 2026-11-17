<template>
  <div class="space-y-3">
    <FiltersSearchValueMarketplaceFilter v-model="model" />
    <FiltersCreateCountrySection v-model="model" />
  </div>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'

const model = defineModel<Filter>({ required: true })
</script>
