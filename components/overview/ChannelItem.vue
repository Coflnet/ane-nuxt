<template>
  <div class="flex items-center justify-between p-3 rounded-lg bg-slate-700">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 rounded-md bg-indigo-900 flex items-center justify-center">
        <Icon
          :name="icon"
          class="size-5 text-indigo-400"
        />
      </div>
      <div>
        <p class="font-medium text-white">
          {{ name }}
        </p>
        <p class="text-xs text-slate-400">
          {{ message }}
        </p>
      </div>
    </div>
    <div class="flex items-center">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200">
        {{ $t('active') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({ name: String, icon: String, message: String })
</script>
