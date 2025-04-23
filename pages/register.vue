<template>
  <div class="min-h-screen flex flex-col ">
    <header class="w-full py-4 px-6 bg-slate-800 shadow-sm">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <UiLogo location="/" />
        <nav class="hidden md:flex items-center space-x-6 ">
          <UiTextButton @on-click="navigateTo('/#features')">{{ $t('features') }}</UiTextButton>
          <UiTextButton @on-click="navigateTo('/#features')">{{ $t('pricing') }}</UiTextButton>
          <UiTextButton @on-click="navigateTo('/#features')">{{ $t('support') }}</UiTextButton>
        </nav>

        <div class="flex items-center space-x-4">
          <UiButton @on-click="navigateTo('/register')" :primary="true">{{ $t('register') }}</UiButton>
        </div>
      </div>
    </header>
    <LoginContainer :is-login="false" />
  </div>
</template>

<script setup lang="ts">
import LoginContainer from './login/LoginContainer.vue';

async function checkLogin() {
  const userStore = useUserStore();
  await userStore.loadUser();
  if (userStore.isAuthenticated)
    navigateTo("/overview")
}

definePageMeta({
  layout: 'landing'
})

onMounted(() => { checkLogin() })

</script>
