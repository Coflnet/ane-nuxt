import { appCheck } from "firebase-admin";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', 'nuxt-vuefire'],
  vuefire: {
    config: {
      apiKey: "AIzaSyB8B7BaoOT_PhPJaa2peh2a_Q8VKDOb0yU",
      authDomain: "anenotifier.firebaseapp.com",
      projectId: "anenotifier",
      storageBucket: "anenotifier.firebasestorage.app",
      messagingSenderId: "625983368920",
      appId: "1:625983368920:web:04af5415ef9a54d14331ad"
    },
    auth: {
      enabled: true
    },
    appCheck: {
      debug: process.env.NODE_ENV !== 'production',
      isTokenAutoRefreshEnabled: true,
    }
  },

})
