<template>
  <p :class="[
    'font-bold',
    'mb-4 md:mb-0',
    xl ? 'text-3xl' : sm ? 'text-sm font-medium' : 'text-xl',
    accent ? 'text-slate-300' : 'text-white'
  ]">
    {{ label }}
  </p>
</template>

<script setup lang="ts">
defineProps<{ label?: String, xl?: Boolean, sm?: Boolean, accent?: Boolean }>()
</script>
