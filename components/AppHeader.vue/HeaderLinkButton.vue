<template>
  <NuxtLink :to="link" :class="['text-slate-400 dark:text-slate-200 hover:text-slate-100 dark:hover:text-indigo-400',
    highlight ? 'bg-indigo-700 hover:bg-indigo-700 px-2 py-1.5 rounded-md' : '']">
    {{ name }}
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps({ name: String, link: String, highlight: Boolean })
</script>
