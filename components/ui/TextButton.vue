<template>
  <button @click="emit('onClick')"
    class="text-slate-400 dark:text-slate-200 hover:text-slate-100 dark:hover:text-indigo-400 items-center flex">
    <slot />
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits(['onClick'])

</script>
