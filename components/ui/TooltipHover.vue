<template>
  <div class="relative flex items-center group">
    <slot />
    <div
      class="absolute opacity-0 scale-95 transition-all font-medium transform rounded-lg border bg-slate-700 text-white border-slate-600
      text-sm px-2 py-1  group-hover:opacity-100 group-hover:scale-100 w-64 -translate-x-1/4 mb-16 text-center"
    >
      {{ text }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  text: String,
})
</script>
