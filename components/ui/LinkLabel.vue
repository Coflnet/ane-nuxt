<template>
  <a
    :href="href"
    :target
    :aria-label="labelAria"
    class="flex items-center"
    :class="{
      'text-white hover:text-indigo-300': white,
      'text-indigo-400 hover:text-indigo-500 hover:underline ': !white,
      'text-slate-400 hover:text-indigo-400': gray,
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
  gray: Boolean,
  labelAria: String,
})
</script>
