<template>
  <div class="min-h-screen flex flex-col ">
    <LoginContainer :is-login="true" />
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

definePageMeta({
  layout: 'landing',
})
</script>
