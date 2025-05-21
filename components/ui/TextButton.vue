<template>
  <button
    type="button"
    class="hover:text-indigo-400 items-center flex"
    :class="[sm ? 'text-sm' : 'text-base',
             gray ? 'text-slate-400' : link ? 'text-indigo-400 hover:underline' : 'text-slate-200']"
    @click="emit('onClick')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits(['onClick'])
defineProps({ sm: Boolean, gray: Boolean, link: Boolean })
</script>
