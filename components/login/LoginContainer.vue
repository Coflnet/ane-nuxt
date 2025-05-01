<template>
  <main class="flex-1 flex flex-col items-center justify-center px-4 py-8 mb-8 ">
    <UiDefaultContainer class="p-6 max-w-md py-8">
      <LoginContainerHeader :is-login="isLogin" />
      <LoginPasswordEmail :is-login="isLogin" />
      <div class="w-full border-t border-slate-700 my-7" />
      <LoginWithGoogleButton :login="isLogin" />
      <LoginPolicy />
    </UiDefaultContainer>

    <UiFooterLabel class="mt-4 flex">
      {{ isLogin ? $t('dontHaveAccount') : $t('alreadyHaveAccount') }}
      <UiLinkLabel :href="isLogin ? '/register' : '/login'" class="ml-1">
        {{ isLogin ? $t('signUp') : $t('signIn') }}
      </UiLinkLabel>
    </UiFooterLabel>
  </main>
</template>

<script setup lang="ts">
import { UiDefaultContainer } from '#components';

defineProps({ isLogin: Boolean })

</script>
