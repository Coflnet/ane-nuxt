export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'nuxt-vuefire',
    "@nuxt/icon",
    '@nuxtjs/i18n',
    "@hey-api/nuxt",
    "notivue/nuxt",
    '@nuxt/eslint'
  ],

  heyApi: {
    config: {
      input: "https://ane.coflnet.com/api/openapi/v1/openapi.json"
    }

  },

  ssr: true,
  tailwindcss: { exposeConfig: true },

  css: [
    'notivue/notification.css',
    'notivue/animations.css'
  ],

  notivue: {
    position: "top-right",
  },

  icon: {
    serverBundle: {
      remote: 'jsdelivr',
    }
  },


  i18n: ({
    locales: [
      {
        code: 'en',
        name: 'English',
        file: 'en.json'
      },
      {
        code: 'de',
        name: 'Deutsch',
        file: 'de.json'
      }
    ],
    defaultLocale: 'en',
    langDir: "../locales/",
    strategy: 'prefix_except_default',
    lazy: true,
    detectBrowserLanguage: {
      useCookie: true,
      alwaysRedirect: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root' // recommended
    }
  }),

  vuefire: {
    config: {
      apiKey: "AIzaSyB8B7BaoOT_PhPJaa2peh2a_Q8VKDOb0yU",
      authDomain: "anenotifier.firebaseapp.com",
      projectId: "anenotifier",
      storageBucket: "anenotifier.firebasestorage.app",
      messagingSenderId: "625983368920",
      appId: "1:625983368920:web:04af5415ef9a54d14331ad"
    },
    messaging: {
      enabled: true,
    },
    auth: {
      enabled: true
    },

  },

  eslint: {
    checker: true,
    config: {
      stylistic: true,
    }
  }
})
