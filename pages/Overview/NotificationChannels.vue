<script setup lang="ts">
import ChannelItem from './ChannelItem.vue';

</script>

<template>
  <UiDefaultContainer class="p-6">
    <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">{{ $t('notChan') }}</h2>
    <div class="space-y-4">
      <ChannelItem name="Discord" icon="tabler:brand-discord" :message="$t('con2Chan')"></ChannelItem>
      <ChannelItem :name="$t('email')" icon="tabler:mail" message="user@example.com"></ChannelItem>

    </div>
  </UiDefaultContainer>

</template>
