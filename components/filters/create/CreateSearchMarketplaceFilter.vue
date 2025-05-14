<template>
  <UiGrid :grid-size="2">
    <UiInput
      v-model="filter.searchValue"
      :name="$t('searchValue')"
      :placeholder="$t('cameraEg')"
      :label="$t('searchValue')"
    />
    <UiMultiSelect
      v-model="selectedMarketplaces"
      :options="marketplaces"
      :label="$t('marketplaces')"
    />
  </UiGrid>
</template>
