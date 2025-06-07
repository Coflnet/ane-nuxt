<template>
  <a
    :href="href"
    :target
    class="text-indigo-400 hover:underline flex items-center cursor-pointer"
  >
    <slot />
  </a>
</template>

<script setup lang="ts">
defineProps({
  href: String,
  target: String,
})
</script>
