<template>
  <UiDefaultContainer class="p-6">
    <UiHeaderLabel :label="$t('notificationsChannels')" />

    <div class="space-y-4 mt-4">
      <ChannelItem
        name="Discord"
        icon="tabler:brand-discord"
        :message="$t('connectedToXChannels', 2)"
      />
      <ChannelItem
        :name="$t('email')"
        icon="tabler:mail"
        message="user@example.com"
      />
    </div>
  </UiDefaultContainer>
</template>

<script setup lang="ts">
import ChannelItem from './ChannelItem.vue'
</script>
