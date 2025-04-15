<template>
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white">{{ $t('dash') }}</h1>
      <p class="mt-2 text-slate-500 dark:text-slate-400">{{ $t('monitor') }}</p>
    </div>
    <NuxtLink to="/filters/create"
      class="mt-4 md:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2">
      <PlusIcon class="w-5 h-5" />
      <span>{{ $t('create') }}</span>
    </NuxtLink>
  </div>
</template>
