<template>
  <div class="mb-8">
    <UiTextButton @on-click="navigateTo(localePath('/filters'))">
      <Icon name="tabler:arrow-left" class="mr-2" />
      {{ $t('backToFilters') }}
    </UiTextButton>
    <UiHeaderLabel :label="isNewFilter ? $t('createFilter') : $t('editFilter')" :xl="true" class="mt-2" />

    <p class="mt-2 text-slate-400">{{ }}</p>
    <UiFooterLabel :label="isNewFilter ? $t('setUpNewAuctionFilter') : $t('updateExistingFilter')" />
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath();

defineProps({
  isNewFilter: Boolean
})
</script>
