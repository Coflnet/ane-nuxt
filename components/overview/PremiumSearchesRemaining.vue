<template>
  <UiDefaultContainer class="p-6 justify-center">
    <UiHeaderLabel :label="$t('remainingSearches')" />
    <div class="flex flex-col h-full justify-center pb-4">
      <UiProgressBar
        :progress="40"
        :min="10"
        :max="80"
        :end-label="'Searches 80'"
        :indicator-text="`${$t('remainingRequests')} ${80 - 40}`"
      />
      <UiFooterLabel :label="'Resets in 3 weeks'" />
    </div>
  </UiDefaultContainer>
</template>
