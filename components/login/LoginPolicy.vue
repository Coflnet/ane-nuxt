<template>
  <UiFooterLabel
    :xs="true"
    class="text-center mt-4"
  >
    <i18n-t
      keypath="signInAgreeMessage.text"
      tag="p"
    >
      <template #tos>
        <a
          href="https://coflnet.com/terms-of-service"
          target="_blank"
          class="text-indigo-400 hover:underline"
        >
          {{ $t('signInAgreeMessage.tos') }}</a>
      </template>
      <template #privacy>
        <a
          href="https://coflnet.com/privacy"
          target="_blank"
          class="text-indigo-400 hover:underline"
        >
          {{ $t('signInAgreeMessage.privacy') }}</a>
      </template>
    </i18n-t>
  </UiFooterLabel>
</template>
