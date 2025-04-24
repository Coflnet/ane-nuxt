<template>
  <div :class="`grid grid-cols-${gridSize - 1} md:grid-cols-${gridSize} gap-6`">
    <slot />
  </div>
</template>

<script setup>
defineProps({ gridSize: Number })
</script>
