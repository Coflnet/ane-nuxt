<template>
  <div class="min-h-screen flex flex-col ">
    <header class="w-full py-4 px-6 bg-slate-800 shadow-sm">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <UiLogo location="/overview" />
        <nav class="hidden md:flex items-center space-x-6 ">
          <UiTextButton @on-click="navigateTo(localePath('/#features'))">
            {{ $t('features') }}
          </UiTextButton>
          <UiTextButton @on-click="navigateTo(localePath('/#features'))">
            {{ $t('pricingHedaer') }}
          </UiTextButton>
          <UiTextButton @on-click="navigateTo(localePath('/#features'))">
            {{ $t('support') }}
          </UiTextButton>
        </nav>

        <div class="flex items-center space-x-4">
          <UiButton :primary="true" @on-click="navigateTo(localePath('/login'))">
            {{ $t('signIn') }}
          </UiButton>
        </div>
      </div>
    </header>
    <LoginContainer :is-login="false" />
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

definePageMeta({
  layout: 'landing',
})
</script>
