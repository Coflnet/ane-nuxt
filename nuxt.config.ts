export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'nuxt-vuefire',
    '@nuxt/icon',
    '@nuxtjs/i18n',
    '@hey-api/nuxt',
    'notivue/nuxt',
    '@nuxt/eslint',
    '@nuxt/image',
  ],

  ssr: true,
  devtools: { enabled: true },

  css: [
    'notivue/notification.css',
    'notivue/animations.css',
  ],
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-11-01',

  eslint: {
    checker: true,
    config: {
      stylistic: true,
    },
  },

  heyApi: {
    config: {
      input: 'https://ane.coflnet.com/api/openapi/v1/openapi.json',
    },

  },

  i18n: ({
    locales: [
      {
        code: 'en',
        name: 'English',
        file: 'en.json',
      },
      {
        code: 'de',
        name: 'Deutsch',
        file: 'de.json',
      },
    ],
    defaultLocale: 'en',
    langDir: '../locales/',
    strategy: 'prefix_except_default',
    lazy: true,
    detectBrowserLanguage: {
      useCookie: true,
      alwaysRedirect: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root', // recommended
    },
  }),

  icon: {
    serverBundle: {
      remote: 'jsdelivr',
    },
  },

  notivue: {
    position: 'top-right',
  },

  tailwindcss: { exposeConfig: true },

  vuefire: {
    config: {
      apiKey: 'AIzaSyB8B7BaoOT_PhPJaa2peh2a_Q8VKDOb0yU',
      authDomain: 'anenotifier.firebaseapp.com',
      projectId: 'anenotifier',
      storageBucket: 'anenotifier.firebasestorage.app',
      messagingSenderId: '625983368920',
      appId: '1:625983368920:web:04af5415ef9a54d14331ad',
    },
    messaging: {
      enabled: true,
    },
    auth: {
      enabled: true,
    },

  },
})