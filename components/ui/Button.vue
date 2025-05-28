<template>
  <button
    :type="type ?? 'button'"
    :class="buttonClasses"
    :disabled="!!proccessing || !!disabled"
    class="mt-4 md:mt-0 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 justify-center"
    @click="emit('onClick')"
  >
    <div class="relative flex justify-center items-center">
      <div
        class="flex space-x-2 items-center"
        :class="proccessing ? 'opacity-0 pointer-events-none' : 'opacity-100'"
      >
        <slot />
      </div>
      <UiIcon
        v-if="proccessing"
        name="svg-spinners:90-ring-with-bg"
        class="size-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits(['onClick'])

const props = defineProps<{
  warning?: boolean
  primary?: boolean
  important?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset' | undefined
  proccessing?: boolean

}>()

const buttonClasses = computed(() => {
  if (props.warning)
    return 'bg-red-600 text-white hover:bg-red-700'
  if (props.primary)
    return 'bg-indigo-600 text-white hover:bg-indigo-700'
  if (props.important)
    return 'bg-gradient-to-tr from-indigo-500 to-purple-600'
  return 'bg-gray-700 hover:bg-gray-600 text-gray-200 '
})
</script>
