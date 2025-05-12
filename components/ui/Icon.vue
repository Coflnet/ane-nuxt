<template>
  <Icon
    :name="name"
    :class="[bold ? 'text-slate-100 size-5' : 'text-slate-400 size-4']"
  />
</template>

<script setup lang="ts">
defineProps({ name: String, bold: Boolean })
</script>
