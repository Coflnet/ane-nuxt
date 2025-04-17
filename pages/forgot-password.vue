<template>
  <div class="min-h-screen flex flex-col ">
    <LoginHeader :is-login="true" />
    <ForgetPasswordContainer />
  </div>
</template>

<script setup lang="ts">
import ForgetPasswordContainer from './Login/ForgetPasswordContainer.vue';
import LoginHeader from './Login/LoginHeader.vue';


definePageMeta({
  layout: 'landing'
})

</script>
