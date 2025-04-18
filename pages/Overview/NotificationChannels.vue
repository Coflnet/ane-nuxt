<template>
  <UiDefaultContainer class="p-6">
    <UiHeaderLabel :label="$t('notificationsChannels')" />

    <div class="space-y-4 mt-4">
      <ChannelItem name="Discord" icon="tabler:brand-discord" :message="$t('connect2Channels')"></ChannelItem>
      <ChannelItem :name="$t('email')" icon="tabler:mail" message="user@example.com"></ChannelItem>

    </div>
  </UiDefaultContainer>

</template>

<script setup lang="ts">
import ChannelItem from './ChannelItem.vue';

</script>
