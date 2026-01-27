<template>
  <div :class="userStore.isWebView ? 'min-h-screen flex flex-col' : ''">
    <LoginContainer :is-login="true" />
  </div>
</template>

<script setup lang="ts">
const userStore = useUserStore()

definePageMeta({
  layout: 'landing',
})
</script>
