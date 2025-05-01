<template>
  <ClientOnly>
    <div class="flex flex-row">
      <div v-if="userStore.isLoggedIn" class="flex flex-row space-x-3 items-center">
        <UiTextButton v-for="locale in availableLocales" :key="locale.code"
          @on-click="navigateTo(switchLocalePath(locale.code))">
          {{ locale.name }}
        </UiTextButton>

        <UiTextButton @on-click="navigateTo('/overview')">{{ $t('appHeaderHome') }}</UiTextButton>
        <UiTextButton @on-click="navigateTo('/filters')">{{ $t('appHeaderFilters') }}</UiTextButton>
        <UiButton :primary="true" @on-click="navigateTo('/auctions')">{{ $t('appHeaderAuctions') }}</UiButton>

        <HeaderProfileDropdown />
      </div>
      <div v-else>
        <UiTextButton v-for="locale in availableLocales" :key="locale.code"
          @on-click="navigateTo(switchLocalePath(locale.code))">
          {{ locale.name }}
        </UiTextButton>

        <UiTextButton @on-click="navigateTo('/login')">{{ $t('signIn') }}</UiTextButton>
        <UiButton :primary="true" @on-click="navigateTo('/register')">{{ $t('register') }}</UiButton>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import HeaderProfileDropdown from './HeaderProfileDropdown.vue';

const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const availableLocales = computed(() => {
  return locales.value.filter(i => i.code !== locale.value)
})

const userStore = useUserStore()

</script>
