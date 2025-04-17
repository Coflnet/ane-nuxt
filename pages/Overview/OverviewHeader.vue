<template>
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white">{{ $t('dash') }}</h1>
      <p class="mt-2 text-slate-500 dark:text-slate-400">{{ $t('monitor') }}</p>
    </div>
    <FiltersCreateFilterButton />
  </div>
</template>
