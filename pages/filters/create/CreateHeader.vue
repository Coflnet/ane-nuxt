<template>
  <div class="mb-8">
    <NuxtLink to="/filters"
      class="inline-flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4">
      <ArrowLeftIcon class="w-4 h-4 mr-1" />
      {{ $t('backFilt') }}
    </NuxtLink>
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white">{{ isNewFilter ? $t('crflt') : $t('editFilt') }}
    </h1>
    <p class="mt-2 text-slate-500 dark:text-slate-400">{{ isNewFilter ? $t('setnew') : $t('setUp') }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps({
  isNewFilter: Boolean
})
</script>
