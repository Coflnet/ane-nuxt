<template>
  <ClientOnly>
    <div class="flex items-center space-x-4">
      <UiTextButton data-testid="home-navigation-button" @on-click="navigateTo(localePath('/overview'))">
        {{ $t('appHeaderHome') }}
      </UiTextButton>

      <UiTextButton data-testid="" @on-click="navigateTo(localePath('/filters'))">
        {{ $t('appHeaderFilters') }}
      </UiTextButton>

      <UiButton :primary="true" @on-click="navigateTo(localePath('/auctions'))">
        {{ $t('appHeaderAuctions') }}
      </UiButton>

      <!-- User section -->
      <AppHeaderProfileDropdown v-if="userStore.isLoggedIn" />

      <div v-else class="flex space-x-3">
        <UiTextButton @on-click="navigateTo(localePath('/login'))">
          {{ $t('signIn') }}
        </UiTextButton>

        <UiButton :primary="true" @on-click="navigateTo(localePath('/register'))">
          {{ $t('register') }}
        </UiButton>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
const localePath = useLocalePath();

const userStore = useUserStore()

</script>
