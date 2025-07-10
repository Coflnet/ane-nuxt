<template>
  <div class="w-full justify-between flex">
    <div class="mb-8">
      <UiTextButton @on-click="navigateTo(localePath('/filters'))">
        <Icon
          name="tabler:arrow-left"
          class="mr-2"
        />
        {{ $t('backToFilters') }}
      </UiTextButton>
      <UiHeaderLabel
        :label="isNewFilter ? $t('createFilter') : $t('editFilter')"
        :xl="true"
        class="mt-2"
      />
      <UiFooterLabel :label="isNewFilter ? $t('setUpNewAuctionFilter') : $t('updateExistingFilter')" />
    </div>
    <UiButton :warning="true">
      Delete
    </UiButton>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

defineProps({
  isNewFilter: Boolean,
})
</script>
