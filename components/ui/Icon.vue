<template>
  <Icon
    :name="name"
    class="text-slate-400 size-4"
    :class="{
      'text-slate-100': bold,
      'size-6': large,
    }"
  />
</template>

<script setup lang="ts">
defineProps({ name: String, bold: Boolean, large: Boolean })
</script>
