<template>
  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
    {{ label }}
  </label>
</template>

<script setup lang="ts">
defineProps({ label: String })
</script>
