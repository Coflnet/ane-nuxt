<template>
  <section class="prose prose-lg max-w-none">
    <h3 class="mb-4">
      <UiHeaderLabel
        :label="$t(`marketplaceSteps.howItWorks`)"
        :accent="true"
      />
    </h3>
    <div class="mb-6">
      <UiFooterLabel :label="$t('marketplaceSteps.bodyText')" />
    </div>

    <!-- Steps -->
    <div class="space-y-4">
      <div class="flex items-start space-x-4">
        <div
          class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold"
        >
          1
        </div>
        <div>
          <UiHeaderLabel
            :label="$t('marketplaceSteps.step1.title', { name: $t(`${marketplaceName}.name`) })"
            :accent="false"
          />
          <UiFooterLabel :label="$t(`marketplaceSteps.step1.description`, { name: $t(`${marketplaceName}.name`) })" />
        </div>
      </div>

      <div class="flex items-start space-x-4">
        <div
          class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold"
        >
          2
        </div>
        <div>
          <UiHeaderLabel
            :label="$t('marketplaceSteps.step2.title', { name: $t(`${marketplaceName}.name`) })"
            :accent="false"
          />
          <UiFooterLabel :label="$t(`marketplaceSteps.step2.description`, { name: $t(`${marketplaceName}.name`) })" />
        </div>
      </div>

      <div class="flex items-start space-x-4">
        <div
          class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold"
        >
          3
        </div>
        <div>
          <UiHeaderLabel
            :label="$t('marketplaceSteps.step3.title', { name: $t(`${marketplaceName}.name`) })"
            :accent="false"
          />
          <UiFooterLabel :label="$t('marketplaceSteps.step3.description', { name: $t(`${marketplaceName}.name`) })" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps({ marketplaceName: String })
</script>
