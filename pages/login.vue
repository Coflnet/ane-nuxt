<template>
  <div class="min-h-screen flex flex-col ">
    <LoginHeader :is-login="true" />
    <LoginContainer :is-login="true" />
  </div>
</template>

<script setup lang="ts">
import { BellIcon } from 'lucide-vue-next'
import LoginHeader from './Login/LoginHeader.vue';
import LoginContainer from './Login/LoginContainer.vue';

definePageMeta({
  layout: 'landing'
})

</script>
