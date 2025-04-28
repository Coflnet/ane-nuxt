<template>
  <ClientOnly>
    <div class="flex flex-row">
      <div class="flex flex-row space-x-3 items-center">
        <UiTextButton @on-click="navigateTo('/overview')">{{ $t('appHeaderHome') }}</UiTextButton>
        <UiTextButton @on-click="navigateTo('/filters')">{{ $t('appHeaderFilters') }}</UiTextButton>
        <UiButton :primary="true" @on-click="navigateTo('/auctions')">{{ $t('appHeaderAuctions') }}</UiButton>

        <AppHeaderProfileDropdown v-if="userStore.isLoggedIn" />
      </div>
      <div v-if="!userStore.isLoggedIn" class="flex ml-5 space-x-3">
        <UiTextButton @on-click="navigateTo('/login')">{{ $t('signIn') }}</UiTextButton>
        <UiButton :primary="true" @on-click="navigateTo('/register')">{{ $t('register') }}</UiButton>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">

const userStore = useUserStore()

</script>
