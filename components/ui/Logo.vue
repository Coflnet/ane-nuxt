<template>
  <NuxtLink :to="location" class="flex items-center space-x-2">
    <div
      class="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
      A
    </div>
    <span class="text-xl font-bold text-white">ANE</span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps({ location: String })
</script>
