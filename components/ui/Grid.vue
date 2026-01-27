<template>
  <div
    :class="[`grid  md:grid-cols-${gridSize} gap-6`,
             gridShink ? `grid-cols-1` : `grid-cols-${gridSize - 1}`]"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({ gridSize: Number, gridShink: Boolean })
</script>
