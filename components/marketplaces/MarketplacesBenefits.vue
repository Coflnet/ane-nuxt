<template>
  <section class="prose prose-lg max-w-none">
    <h3 class="mb-4">
      <UiHeaderLabel
        :label="$t(`${marketplaceName}.benefits.title`)"
        :accent="true"
      />
    </h3>
    <div class="mb-6">
      <UiFooterLabel :label="$t(`${marketplaceName}.benefits.bodyText`)" />
    </div>

    <ul class="space-y-3">
      <li class="flex items-start space-x-3">
        <svg
          class="w-5 h-5 text-green-500 mt-1 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
        <UiFooterLabel :label="$t(`${marketplaceName}.benefits.benefit1`)" />
      </li>
      <li class="flex items-start space-x-3">
        <svg
          class="w-5 h-5 text-green-500 mt-1 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
        <UiFooterLabel :label="$t(`${marketplaceName}.benefits.benefit2`)" />
      </li>
      <li class="flex items-start space-x-3">
        <svg
          class="w-5 h-5 text-green-500 mt-1 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
        <UiFooterLabel :label="$t(`${marketplaceName}.benefits.benefit3`)" />
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
defineProps({ marketplaceName: String })
</script>
