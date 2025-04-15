<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-slate-900 dark:text-white">{{ label }}</h3>
      <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="iconColorCircle">
        <Icon :name="icon" :class="[iconColor, 'size-5']" />
      </div>
    </div>
    <p class="text-3xl font-bold text-slate-900 dark:text-white">{{ stat }}</p>
  </div>

</template>

<script setup lang="ts">


defineProps({
  stat: String,
  iconColorCircle: String,
  iconColor: String,
  icon: String,
  label: String
})

</script>
