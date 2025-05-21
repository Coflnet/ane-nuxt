<template>
  <div class="my-component">
    <UiTextButton @on-click="toggleExpanded()">
      <UiFooterLabel
        :label="$t('advancedOptions')"
        :white="true"
      />
      <Icon
        class="size-5 ml-2 mt-1.5"
        :name="isExpanded ? 'tabler:chevron-up' : 'tabler:chevron-down'"
      />
    </UiTextButton>
    <div
      class="overflow-hidden transition-all duration-300 mt-5"
      :style="{ maxHeight: isExpanded ? '500px' : '0' }"
    >
      <slot />
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
