<template>
  <main class="flex-1 flex items-center justify-center px-4 py-12 mb-12 ">
    <UiDefaultContainer class="p-6 max-w-md py-12">
      <LoginContainerHeader />
      <LoginPasswordEmail />
      <div class="w-full border-t border-slate-200 dark:border-slate-700 my-7"></div>
      <LoginWithGoogleButton />
      <LoginPolicy />
    </UiDefaultContainer>

  </main>

</template>

<script setup lang="ts">
import { UiDefaultContainer } from '#components';
import LoginContainerHeader from './LoginContainerHeader.vue';
import LoginPasswordEmail from './LoginPasswordEmail.vue';
import LoginPolicy from './LoginPolicy.vue';
import LoginWithGoogleButton from './LoginWithGoogleButton.vue';


</script>
