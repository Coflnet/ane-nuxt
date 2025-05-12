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
useHead({
  title: 'ANE - Advanced Notification Engine',
  meta: [
    { name: 'description', content: 'Track auctions across marketplaces with custom filters and notifications' },
<<<<<<< HEAD
=======
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
>>>>>>> main
  ],
})

onMounted(async () => {
  await nextTick()
  if (import.meta.server) return

  if ('serviceWorker' in navigator) {
<<<<<<< HEAD
    navigator.serviceWorker.register('firebase-messaging-sw.js', { scope: '/' })
=======
    navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
>>>>>>> main
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
