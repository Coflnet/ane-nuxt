<template>
  <div>
    <UiHeaderLabel
      :label="label"
      :accent="true"
      :sm="true"
    />
    <button
      class="rounded appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer px-1.5 pt-1 pb-0 mt-1"
      :class="!modelValue ? 'border border-slate-600 bg-slate-700' : 'bg-indigo-500 border-indigo-500'"
      @click="modelValue = !modelValue"
    >
      <Icon
        name="tabler:check"
        class="size-4 text-slate-100"
        :class="!modelValue ? 'invisible' : 'visible'"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
const modelValue = defineModel<boolean>()

defineProps<{
  label?: string
}>()
</script>
