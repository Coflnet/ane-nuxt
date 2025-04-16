<template>
  <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4 md:mb-0">
    {{ label }}
  </h2>

</template>

<script setup lang="ts">
defineProps({ label: String })
</script>
