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
          :label="$t(`${marketplaceName}.features.title`)"
          :accent="true"
        />
      </h3>
      <div class="mb-6">
        <UiFooterLabel :label="$t(`${marketplaceName}.features.description`)" />
      </div>

      <!-- Feature list -->
      <UiGrid :grid-size="2">
        <UiDefaultContainer class="p-6">
          <div class="mb-2">
            <UiHeaderLabel
              :label="$t(`${marketplaceName}.features.filtering.title`)"
              :accent="false"
            />
          </div>
          <UiFooterLabel :label="$t(`${marketplaceName}.features.filtering.description`)" />
        </UiDefaultContainer>

        <UiDefaultContainer class="p-6">
          <div class="mb-2">
            <UiHeaderLabel
              :label="$t(`${marketplaceName}.features.notifications.title`)"
              :accent="false"
            />
          </div>
          <UiFooterLabel :label="$t(`${marketplaceName}.features.notifications.description`)" />
        </UiDefaultContainer>
      </UiGrid>
    </section>
  </div>
</template>

<script setup lang="ts">
defineProps({ marketplaceName: String })
</script>
