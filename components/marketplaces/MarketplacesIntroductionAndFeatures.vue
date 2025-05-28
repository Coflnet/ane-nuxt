<template>
  <div>
    <section class="prose prose-lg max-w-none">
      <h3 class="mb-4">
        <UiHeaderLabel
          :label="$t(`${marketplaceName}.introduction.title`)"
          :accent="true"
        />
      </h3>
      <UiFooterLabel :label="$t(`${marketplaceName}.introduction.bodyText`)" />
    </section>

    <!-- Features section -->
    <section class="prose prose-lg max-w-none">
      <h3 class="mb-4 mt-8">
        <UiHeaderLabel
          :label="$t(`marketplacesFeatures.title`, { name: $t(`${marketplaceName}.name`) })"
          :accent="true"
        />
      </h3>
      <div class="mb-6">
        <UiFooterLabel :label="$t('marketplacesFeatures.description')" />
      </div>

      <!-- Feature list -->
      <UiGrid :grid-size="2">
        <UiDefaultContainer class="p-6">
          <div class="mb-2">
            <UiHeaderLabel
              :label="$t('marketplacesFeatures.filtering.title', { name: $t(`${marketplaceName}.name`) })"
              :accent="false"
            />
          </div>
          <UiFooterLabel :label="$t('marketplacesFeatures.description', { name: $t(`${marketplaceName}.name`) })" />
        </UiDefaultContainer>

        <UiDefaultContainer class="p-6">
          <div class="mb-2">
            <UiHeaderLabel
              :label="$t('marketplacesFeatures.notifications.title', { name: $t(`${marketplaceName}.name`) })"
              :accent="false"
            />
          </div>
          <UiFooterLabel
            :label="$t('marketplacesFeatures.notifications.description', { name: $t(`${marketplaceName}.name`) })"
          />
        </UiDefaultContainer>
      </UiGrid>
    </section>
  </div>
</template>

<script setup lang="ts">
defineProps({ marketplaceName: String })
</script>
