<template>
  <NuxtLink to="/filters/create"
    class="mt-4 md:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2">
    <Icon name="tabler:plus" class="size-5" />
    <span class="mr-1">{{ $t('create') }}</span>
  </NuxtLink>
</template>
