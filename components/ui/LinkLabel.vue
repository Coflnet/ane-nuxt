<template>
  <a
    :href="href"
    :target
    class="flex items-center"
    :class="{
      'text-white hover:text-indigo-300': white,
      'text-indigo-400 hover:text-indigo-500 hover:underline ': !white,
    }"
  >
    <slot />
  </a>
</template>

<script setup lang="ts">
defineProps({
  href: String,
  target: String,
  white: Boolean,
})
</script>
