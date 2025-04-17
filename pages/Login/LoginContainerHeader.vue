<template>
  <div class="text-center mb-8">
    <div
      class="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto">
      <Icon name="tabler:bell" class="size-8 text-white" />
    </div>
    <h1 class="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
      {{ $t('createAcco') || 'Create Account' }}
    </h1>
    <p class="mt-2 text-slate-500 dark:text-slate-400">{{ $t('signinAc') }} </p>
  </div>

</template>
