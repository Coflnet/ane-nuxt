<template>
  <ClientOnly>
    <div class="flex flex-col space-y-6">
      <div class="flex flex-col space-y-4">
        <div class="flex">
          <UiHeaderLabel
            :label="$t('account')"
            :accent="true"
          />

          <div
            v-if="userStore.isLoggedIn"
            class="w-full flex justify-center"
          >
            <AppHeaderProfileDropdown />
          </div>
        </div>

        <div
          v-if="!userStore.isLoggedIn"
          class="space-y-3"
        >
          <UiTextButton
            class="justify-start"
            @on-click="navigateAndClose('/login')"
          >
            <Icon
              name="lucide:log-in"
              class="w-5 h-5 mr-2"
            />
            {{ $t('signIn') }}
          </UiTextButton>

          <UiButton
            :primary="true"
            class="justify-start"
            @on-click="navigateAndClose('/register')"
          >
            <Icon
              name="lucide:user-plus"
              class="w-5 h-5 mr-2"
            />
            {{ $t('register') }}
          </UiButton>
        </div>
      </div>

      <div class="flex flex-col space-y-4">
        <UiHeaderLabel
          :label="$t('navigation')"
          :accent="true"
        />

        <div class="flex flex-col space-y-2">
          <UiTextButton
            data-testid="home-navigation-button"
            class="justify-start"
            @on-click="navigateAndClose('/overview')"
          >
            <Icon
              name="lucide:home"
              class="w-5 h-5 mr-2"
            />
            {{ $t('appHeaderHome') }}
          </UiTextButton>

          <UiTextButton
            class="justify-start"
            @on-click="navigateAndClose('/filters')"
          >
            <Icon
              name="lucide:filter"
              class="w-5 h-5 mr-2"
            />
            {{ $t('appHeaderFilters') }}
          </UiTextButton>

          <UiButton
            :primary="true"
            class="justify-start"
            @on-click="navigateAndClose('/auctions')"
          >
            <Icon
              name="lucide:gavel"
              class="w-5 h-5 mr-2"
            />
            {{ $t('appHeaderAuctions') }}
          </UiButton>
        </div>
      </div>

      <div class="flex flex-col space-y-4">
        <AppHeaderCopyReferralCodeButton />
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
const { locale, locales } = useI18n()
const userStore = useUserStore()
const router = useRouter()

const emit = defineEmits(['navigate'])

const navigateAndClose = (path: string) => {
  router.push(path)
  emit('navigate')
}
</script>
