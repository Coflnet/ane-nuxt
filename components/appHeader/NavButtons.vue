<template>
  <ClientOnly>
    <div class="flex items-center space-x-4">
      <!-- Language switchers -->
      <div class="flex space-x-3 items-center">
        <UiTextButton v-for="locale in availableLocales" :key="locale.code"
          @on-click="navigateTo(switchLocalePath(locale.code))">
          {{ locale.name }}
        </UiTextButton>
      </div>

      <UiTextButton data-testid="home-navigation-button" @on-click="navigateTo('/overview')">
        {{ $t('appHeaderHome') }}
      </UiTextButton>

      <UiTextButton data-testid="" @on-click="navigateTo('/filters')">
        {{ $t('appHeaderFilters') }}
      </UiTextButton>

      <UiButton :primary="true" @on-click="navigateTo('/auctions')">
        {{ $t('appHeaderAuctions') }}
      </UiButton>

      <!-- User section -->
      <AppHeaderProfileDropdown v-if="userStore.isLoggedIn" />

      <div v-else class="flex space-x-3">
        <UiTextButton @on-click="navigateTo('/login')">
          {{ $t('signIn') }}
        </UiTextButton>

        <UiButton :primary="true" @on-click="navigateTo('/register')">
          {{ $t('register') }}
        </UiButton>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const availableLocales = computed(() => {
  return locales.value.filter(i => i.code !== locale.value)
})

const userStore = useUserStore()
</script>
