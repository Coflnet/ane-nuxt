<template>
  <div class="flex items-center space-x-4">
    <UiLinkButton
      aria-label="Home Navigation Button"
      :white="true"
      :to="localePath('/overview')"
    >
      {{ $t('appHeaderHome') }}
    </UiLinkButton>

    <UiLinkButton
      aria-label="Search Navigation Button"
      :white="true"
      :to="localePath('/search')"
    >
      {{ $t('appHeaderSearch') }}
    </UiLinkButton>

    <UiLinkButton
      aria-label="Filters Navigation Button"
      :white="true"
      :to="localePath('/filters')"
    >
      {{ $t('appHeaderFilters') }}
    </UiLinkButton>

    <UiLinkButton
      aria-label="Auctions Navigation Button"
      :white="true"
      :primary="true"
      :to="localePath('/auctions')"
    >
      {{ $t('appHeaderAuctions') }}
    </UiLinkButton>

    <!-- User section -->
    <AppHeaderProfileDropdown v-if="userStore.isLoggedIn" />

    <div
      v-else
      class="flex space-x-3"
    >
      <UiLinkButton
        aria-label="Sign In Navigation Button"
        :white="true"
        :to="localePath('/login')"
      >
        {{ $t('signIn') }}
      </UiLinkButton>

      <UiLinkButton
        aria-label="Register Navigation Button"
        :white="true"
        :primary="true"
        :to="localePath('/register')"
      >
        {{ $t('register') }}
      </UiLinkButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

const userStore = useUserStore()
</script>
