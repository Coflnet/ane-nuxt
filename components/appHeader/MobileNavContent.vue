<template>
  <div class="flex flex-col space-y-4 w-full max-w-sm">
    <div class="flex justify-center space-x-3">
      <UiTextButton v-for="locale in availableLocales" :key="locale.code"
        @on-click="handleNavClick(switchLocalePath(locale.code))">
        {{ locale.name }}
      </UiTextButton>
    </div>

    <div v-if="userStore.isLoggedIn">
      <UiTextButton @on-click="handleNavClick('/overview')">
        {{ $t('appHeaderHome') }}
      </UiTextButton>
      <UiTextButton @on-click="handleNavClick('/filters')">
        {{ $t('appHeaderFilters') }}
      </UiTextButton>
      <UiButton :primary="true" @on-click="handleNavClick('/auctions')">
        {{ $t('appHeaderAuctions') }}
      </UiButton>
      <UiTextButton @on-click="handleNavClick('/profile')"> {{ $t('profile') }} </UiTextButton>
      <AppHeaderProfileDropdown v-if="userStore.isLoggedIn" />
    </div>

    <div v-else>
      <UiTextButton @on-click="handleNavClick('/login')">
        {{ $t('signIn') }}
      </UiTextButton>
      <UiButton :primary="true" @on-click="handleNavClick('/register')">
        {{ $t('register') }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">

const emit = defineEmits(['link-click']);

const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();
const router = useRouter();

const availableLocales = computed(() => {
  return locales.value.filter(i => i.code !== locale.value);
});

const userStore = useUserStore();

const handleNavClick = (path: string) => {
  router.push(path);
  emit('link-click'); // Emit event to tell the parent (header) to close the menu
};
</script>
