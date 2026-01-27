import type { I18n, Composer } from 'vue-i18n'

declare module '#app' {
  interface NuxtApp {
    $i18n: I18n
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: (key: string, ...args: unknown[]) => string
    $i18n: I18n
  }
}
declare module '@nuxtjs/i18n' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface NuxtI18nInstance extends Composer {}
}
