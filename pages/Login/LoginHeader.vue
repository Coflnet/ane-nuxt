<template>
  <header class="w-full py-4 px-6 bg-white dark:bg-slate-800 shadow-sm">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <UiLogo location="/" />
      <nav class="hidden md:flex items-center space-x-6 ">
        <HeaderLinkButton link="/#features" name="Features" />
        <HeaderLinkButton link="/#features" name="Pricing" />
        <HeaderLinkButton link="/#features" name="Support" />
      </nav>

      <div class="flex items-center space-x-4">
        <HeaderLinkButton link="/login" name="Sign in" :highlight="true" class="px-3" />
      </div>
    </div>
  </header>

</template>

<script setup lang="ts">
import HeaderLinkButton from '~/components/AppHeader.vue/HeaderLinkButton.vue';

</script>
