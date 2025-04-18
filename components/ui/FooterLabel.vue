<template>
  <p class="mt-2 " :class="xs ? 'text-sm' : 'text-base', white ? 'text-white' : 'text-slate-400'">{{
    label }}
    <slot />
  </p>
</template>

<script setup lang="ts">
defineProps({ label: String, xs: Boolean, white: Boolean })
</script>
