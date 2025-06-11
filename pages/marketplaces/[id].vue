<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Main heading -->
    <div class="mb-6">
      <UiHeaderLabel
        :label="$t(`${marketplaceName}.title`)"
        :accent="true"
      />
    </div>

    <!-- Subtitle -->
    <h2 class="text-xl text-gray-600 mb-8">
      <UiFooterLabel :label="$t(`${marketplaceName}.subtitle`)" />
    </h2>

    <!-- Main content sections -->
    <div class="space-y-8">
      <MarketplacesIntroductionAndFeatures :marketplace-name="marketplaceName" />

      <MarketplacesHowItWorks :marketplace-name="marketplaceName" />

      <MarketplacesBenefits :marketplace-name="marketplaceName" />

      <MarketplacesFaq :marketplace-name="marketplaceName" />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const marketplaceName = ref(route.params.id as string)
const { t } = useI18n()

definePageMeta({
  layout: 'landing',
})

useSeoMeta({
  title: () => t('aneMarketplaces', { name: t(`${marketplaceName.value}Marketplace`) }),
  ogTitle: () => t('aneMarketplaces', { name: t(`${marketplaceName.value}Marketplace`) }),
  description: () => t('aneDescription', { name: t(`${marketplaceName.value}Marketplace`) }),
  ogDescription: () => t('aneDescription', { name: t(`${marketplaceName.value}Marketplace`) }),
})
</script>
