<template>
  <div class="min-h-screen flex flex-col ">
    <LoginHeader :is-login="false" />
    <LoginContainer :is-login="false" />
  </div>
</template>

<script setup lang="ts">
import LoginContainer from './Login/LoginContainer.vue';
import LoginHeader from './Login/LoginHeader.vue';

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
