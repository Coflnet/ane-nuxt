<template>
  <NuxtLink
    :to="href"
    class="flex items-center"
    :class="{
      'text-white hover:text-indigo-300': white,
      'text-indigo-400 hover:text-indigo-500 hover:underline ': !white,
      'bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg': primary,
    }"
  >
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps({
  href: String,
  white: Boolean,
  primary: Boolean,
})
</script>
