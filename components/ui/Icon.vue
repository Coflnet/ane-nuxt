<template>
  <Icon :name="name" class="text-slate-500 dark:text-slate-400 size-4" />
</template>

<script setup lang="ts">
defineProps({ name: String })
</script>
