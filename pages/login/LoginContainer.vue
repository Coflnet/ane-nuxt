<template>
  <main class="flex-1 flex flex-col items-center justify-center px-4 py-8 mb-8 ">
    <UiDefaultContainer class="p-6 max-w-md py-8">
      <LoginContainerHeader :is-login="isLogin" />
      <LoginPasswordEmail :is-login="isLogin" />
      <div class="w-full border-t border-slate-700 my-7" />
      <LoginWithGoogleButton />
      <LoginPolicy />
    </UiDefaultContainer>

    <UiFooterLabel class="mt-4 flex">
      {{ isLogin ? $t('dontHaveAccount') : $t('alreadyHaveAccount') }}
      <UiTextButton @on-click="navigateTo(isLogin ? '/register' : '/login')" :link="true" class="ml-1">
        {{ isLogin ? $t('signUp') : $t('signIn') }}
      </UiTextButton>
    </UiFooterLabel>
  </main>
</template>

<script setup lang="ts">
import { UiDefaultContainer } from '#components';
import LoginContainerHeader from './LoginContainerHeader.vue';
import LoginPasswordEmail from './LoginPasswordEmail.vue';
import LoginPolicy from './LoginPolicy.vue';
import LoginWithGoogleButton from './LoginWithGoogleButton.vue';

defineProps({ isLogin: Boolean })

</script>
