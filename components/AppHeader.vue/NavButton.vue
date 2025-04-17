<template>
  <ClientOnly>
    <div class="flex flex-row">
      <div v-if="userStore.isLoggedIn" class="flex flex-row space-x-3 items-center">

        <HeaderLinkButton link="/overview" name="Home" :highlight="false" />
        <HeaderLinkButton link="/filters" name="Filters" :highlight="false" />
        <HeaderLinkButton link="/auctions" name="Auctions" :highlight="true" />

        <HeaderProfileDropdown />
      </div>
      <div v-else>
        <HeaderLinkButton link="/login" name="Log in" :highlight="true" />
        <HeaderLinkButton link="/register" name="Sign up" :highlight="false" />
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import HeaderLinkButton from './HeaderLinkButton.vue';
import HeaderProfileDropdown from './HeaderProfileDropdown.vue';

const userStore = useUserStore()

</script>
