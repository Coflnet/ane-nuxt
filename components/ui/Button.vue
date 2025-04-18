<template>
  <button :type="type ?? 'button'" @click="emit('onClick')" :class="buttonClasses"
    class="mt-4 md:mt-0 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 justify-center">
    <slot />
  </button>
</template>

<script setup lang="ts">

const emit = defineEmits(['onClick'])

const props = defineProps<{ warning?: Boolean, primary?: Boolean, type?: 'button' | 'submit' | 'reset' | undefined }>()

const buttonClasses = computed(() => {
  if (props.warning)
    return 'bg-red-600 text-white hover:bg-red-700'
  if (props.primary)
    return 'bg-indigo-600 text-white hover:bg-indigo-700'
  return 'bg-gray-700 hover:bg-gray-600 text-gray-200 '
})
</script>
