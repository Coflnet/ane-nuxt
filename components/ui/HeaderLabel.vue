<template>
  <p
    :class="[
      'font-bold',
      xl ? 'text-3xl' : sm ? 'text-sm font-medium' : 'text-xl',
      accent ? 'text-slate-300 mb-1' : 'text-white',
    ]"
  >
    {{ label }}
    <slot />
  </p>
</template>

<script setup lang="ts">
defineProps<{ label?: string, xl?: boolean, sm?: boolean, accent?: boolean }>()
</script>
