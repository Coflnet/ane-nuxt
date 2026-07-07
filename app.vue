<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
    <NuxtLayout>
      <NuxtPage />
      <Notivue v-slot="item">
        <Notification
          :item="item"
          :theme="slateTheme"
        />
      </Notivue>
    </NuxtLayout>
  </div>
</template>

<script setup>
// App-wide setup

// Canonical + hreflang alternates for every route (i18n: en default, /de prefix).
const localeHead = useLocaleHead({ dir: true, lang: true, seo: true })
useHead(localeHead)

useHead({
  title: 'ANE - Advanced Notification Engine',
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  ],
})

// Site-wide defaults; per-page useSeoMeta calls override title/description/image.
useSeoMeta({
  description: 'Track auctions across marketplaces with custom filters and notifications',
  ogSiteName: 'Ane Deals',
  ogType: 'website',
  ogImage: 'https://ane.deals/DashboardPreview.webp',
  twitterCard: 'summary_large_image',
})

onMounted(async () => {
  if (import.meta.server) return

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
      .then((reg) => {
        console.log(`Service Worker Registration (Scope: ${reg.scope})`)
      })
      .catch((error) => {
        const msg = `Service Worker Error (${error})`
        console.error(msg)
      })
  }
  else {
    console.warn('Service Worker not available')
  }
})
</script>
