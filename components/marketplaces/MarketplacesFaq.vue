<template>
  <section class="prose prose-lg max-w-none">
    <h3 class="mb-6">
      <UiHeaderLabel
        :label="$t(`marketplacesFaq.title`)"
        :accent="true"
      />
    </h3>

    <div class="space-y-6">
      <div class="border-b border-gray-200 pb-4">
        <div class="mb-2">
          <UiHeaderLabel
            :label="$t('marketplacesFaq.question1.title', { name: $t(`${marketplaceName}.name`) })"
            :accent="false"
          />
        </div>
        <UiFooterLabel :label="$t('marketplacesFaq.question1.answer', { name: $t(`${marketplaceName}.name`) })" />
      </div>

      <div class="border-b border-gray-200 pb-4">
        <div class="mb-2">
          <UiHeaderLabel
            :label="$t('marketplacesFaq.question2.title', { name: $t(`${marketplaceName}.name`) })"
            :accent="false"
          />
        </div>
        <UiFooterLabel :label="$t('marketplacesFaq.question2.answer', { name: $t(`${marketplaceName}.name`) })" />
      </div>

      <div class="border-b border-gray-200 pb-4">
        <div class="mb-2">
          <UiHeaderLabel
            :label="$t('marketplacesFaq.question3.title', { name: $t(`${marketplaceName}.name`) })"
            :accent="false"
          />
        </div>
        <UiFooterLabel :label="$t('marketplacesFaq.question3.answer', { name: $t(`${marketplaceName}.name`) })" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps({ marketplaceName: String })
</script>
