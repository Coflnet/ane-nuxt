<template>
  <UiFooterLabel :xs="true" class="text-center mt-4">
    <p>{{ $t('signInAgree') }}
      <a href="https://coflnet.com/terms-of-service" class="text-indigo-400 hover:underline">
        {{ $t('tos') }}
      </a>
      {{ $t('and') }}
      <a href="https://coflnet.com/privacy" class="text-indigo-400 hover:underline">
        {{ $t('privacyPolicy') }}
      </a>.
    </p>
  </UiFooterLabel>

</template>
