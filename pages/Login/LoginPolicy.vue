<template>
  <div class="text-center text-sm text-slate-500 dark:text-slate-400 pt-2 mt-4">
    <p>{{ $t('signInAgree') }}
      <a href="https://coflnet.com/terms-of-service" class="text-indigo-600 dark:text-indigo-400 hover:underline">
        {{ $t('tos') }}
      </a>
      {{ $t('and') }}
      <a href="https://coflnet.com/privacy" class="text-indigo-600 dark:text-indigo-400 hover:underline">
        {{ $t('privacyPolicy') }}
      </a>.
    </p>
  </div>

</template>
