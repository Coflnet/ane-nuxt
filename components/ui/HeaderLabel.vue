<template>
  <p class=" font-bold text-slate-900 dark:text-white mb-4 md:mb-0" :class="xl ? 'text-3xl' : 'text-xl'">
    {{ label }}
  </p>
</template>

<script setup lang="ts">
defineProps({ label: String, xl: Boolean })
</script>
