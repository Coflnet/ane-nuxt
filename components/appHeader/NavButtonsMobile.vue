<template>
  <ClientOnly>
    <div class="flex flex-col space-y-6">
      <div class="flex flex-col space-y-4">
        <div class="flex">
          <UiHeaderLabel :label="$t('account')" :accent="true" />

          <div v-if="userStore.isLoggedIn" class="w-full flex justify-center">
            <AppHeaderProfileDropdown />
          </div>

        </div>

        <div v-if="!userStore.isLoggedIn" class="flex flex-col space-y-3">
          <UiTextButton @on-click="navigateAndClose('/login')" class="justify-start">
            <Icon name="lucide:log-in" class="w-5 h-5 mr-2" />
            {{ $t('signIn') }}
          </UiTextButton>

          <UiButton :primary="true" @on-click="navigateAndClose('/register')" class="justify-start">
            <Icon name="lucide:user-plus" class="w-5 h-5 mr-2" />
            {{ $t('register') }}
          </UiButton>
        </div>
      </div>

      <div class="flex flex-col space-y-4">
        <UiHeaderLabel :label="$t('navigation')" :accent="true" />

        <div class="flex flex-col space-y-2">
          <UiTextButton data-testid="home-navigation-button" @on-click="navigateAndClose('/overview')"
            class="justify-start">
            <Icon name="lucide:home" class="w-5 h-5 mr-2" />
            {{ $t('appHeaderHome') }}
          </UiTextButton>

          <UiTextButton @on-click="navigateAndClose('/filters')" class="justify-start">
            <Icon name="lucide:filter" class="w-5 h-5 mr-2" />
            {{ $t('appHeaderFilters') }}
          </UiTextButton>

          <UiButton :primary="true" @on-click="navigateAndClose('/auctions')" class="justify-start">
            <Icon name="lucide:gavel" class="w-5 h-5 mr-2" />
            {{ $t('appHeaderAuctions') }}
          </UiButton>
        </div>
      </div>

      <div class="flex flex-col space-y-4">
        <UiHeaderLabel :label="$t('language')" :accent="true" />

        <div class="flex space-x-3">
          <UiTextButton v-for="locale in availableLocales" :key="locale.code"
            @on-click="navigateAndClose(switchLocalePath(locale.code))">
            {{ locale.name }}
          </UiTextButton>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const userStore = useUserStore()
const router = useRouter()

const availableLocales = computed(() => {
  return locales.value.filter(i => i.code !== locale.value)
})

const emit = defineEmits(['navigate'])

const navigateAndClose = (path: string) => {
  router.push(path)
  emit('navigate')
}
</script>
