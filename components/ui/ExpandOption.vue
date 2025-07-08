<template>
  <div class="my-component">
    <UiTextButton
      label-aria="Advanced Options Toggle"
      @on-click="toggleExpanded()"
    >
      <UiFooterLabel
        :label="$t('advancedOptions')"
        :white="true"
      />
      <Icon
        class="size-5 ml-2 mt-1.5"
        :name="isExpanded ? 'tabler:chevron-up' : 'tabler:chevron-down'"
      />
    </UiTextButton>

    <div class="relative w-full transition-all">
      <div
        v-if="isExpanded"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isExpanded = ref(false)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.transition-height {
  transition-property: height, max-height;
  transition-duration: 0.3s;
  /* Adjust the duration as needed */
  transition-timing-function: ease-in-out;
  /* Adjust the timing function as needed */
}
</style>
