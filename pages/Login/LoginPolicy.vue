<template>
  <div class="text-center text-sm text-slate-500 dark:text-slate-400 pt-2 mt-4">
    <p>{{ $t('sellSoul') || 'By signing up, you agree to our' }}
      <a href="https://coflnet.com/terms-of-service" class="text-indigo-600 dark:text-indigo-400 hover:underline">
        {{ $t('tos') || 'Terms of Service' }}
      </a>
      {{ $t('and') || 'and' }}
      <a href="https://coflnet.com/privacy" class="text-indigo-600 dark:text-indigo-400 hover:underline">
        {{ $t('pp') || 'Privacy Policy' }}
      </a>.
    </p>
  </div>

</template>
