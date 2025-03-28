// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  build: {
    transpile: ['lucide-vue-next']
  },

  app: {
    head: {
      title: 'ANE - Advanced Notification Engine',
      meta: [
        { name: 'description', content: 'Track auctions across marketplaces with custom filters and notifications' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: 'https://ane.coflnet.com/api'
    }
  },

  compatibilityDate: '2025-03-28'
})