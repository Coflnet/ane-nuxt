import { getPublishedArticles } from './utils/articles'

const hostName = 'https://ane.deals'
const prerenderMarketingRoutes
  = process.env.ANE_PRERENDER_MARKETING !== 'false'
    && Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS)

// Finite set of pages that can be fully prebuilt at build time.
// i18n strategy is `prefix_except_default` (en = no prefix, de = `/de`).
const marketplaceIds = ['craigslist', 'kleinanzeigen', 'autoscout24']
const localePrefixes = ['', '/de']
const withLocales = (path: string) => localePrefixes.map(p => `${p}${path}` || '/')

const prerenderRoutes = prerenderMarketingRoutes
  ? [
      ...withLocales(''),
      ...withLocales('/blog'),
      ...getPublishedArticles().flatMap(a => withLocales(`/blog/${a.slug}`)),
      ...marketplaceIds.flatMap(id => withLocales(`/marketplaces/${id}`)),
    ]
  : []

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
    '@nuxtjs/leaflet',
    '@nuxt/image',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
  ],

  ssr: true,
  devtools: { enabled: true },

  css: [
    'notivue/notification.css',
    'notivue/animations.css',
  ],

  site: {
    url: hostName,
    name: 'Ane Deals',
  },

  runtimeConfig: {
    // Server-only (SSR). Points at the in-cluster backend Service so server-side
    // rendering calls the API directly and never leaves the cluster — no round
    // trip out through the public load balancer / Cloudflare (that external loop
    // was hanging SSR and taking the site down). Override: NUXT_API_INTERNAL_BASE_URL.
    apiInternalBaseUrl: 'http://aneapi:8000',
    public: {
      // Browser-facing API base — the public load balancer on ane.coflnet.com.
      // Override: NUXT_PUBLIC_API_BASE_URL.
      apiBaseUrl: 'https://ane.coflnet.com',
    },
  },

  runtimeConfig: {
    public: {
      // Max time (ms) the server waits for the backend before rendering a
      // skeleton and letting the client re-fetch. Override with
      // NUXT_PUBLIC_SSR_FETCH_TIMEOUT_MS.
      ssrFetchTimeoutMs: 2500,
    },
  },

  routeRules: {
    '/': { prerender: prerenderMarketingRoutes },
    '/blog/**': { prerender: prerenderMarketingRoutes },
    '/marketplaces/**': { prerender: prerenderMarketingRoutes },
    // SSR'd on demand, then cached + revalidated in the background (big repeat-load win).
    '/product/**': { swr: 600 },
    '/search': { swr: 60 },
    '/_ipx/**': { prerender: false },
  },

  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-11-01',

  nitro: {
    prerender: {
      // Explicit route list only — avoid crawling into dynamic pages
      // (/search, /product/**), which must stay SSR/SWR, not static skeletons.
      crawlLinks: false,
      routes: prerenderRoutes,
    },
  },

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
    baseUrl: hostName,
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
      redirectOn: 'all',
    },
    bundle: {
      optimizeTranslationDirective: false,
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

  robots: {
    sitemap: [
      '/sitemap_index.xml',
      '/product-sitemap.xml',
      '/product-sitemap-de.xml',
    ],
  },

  sitemap: {
    sources: [
      '/api/__sitemap__/urls',
    ],
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
