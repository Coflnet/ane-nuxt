<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
    <NuxtLayout>
      <NuxtPage />
      <Notivue v-slot="item">
        <Notification :item="item" :theme="slateTheme" />
      </Notivue>
    </NuxtLayout>

  </div>

</template>

<script setup>
import { getMessaging, onMessage } from 'firebase/messaging'
// App-wide setup
useHead({
  title: 'ANE - Advanced Notification Engine',
  meta: [
    { name: 'description', content: 'Track auctions across marketplaces with custom filters and notifications' }
  ],
})

onMounted(async () => {
  await nextTick()
  if (import.meta.server) return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('firebase-messaging-sw.js')
      .then(reg => {
        console.log(`Service Worker Registration (Scope: ${reg.scope})`);
      })
      .catch(error => {
        const msg = `Service Worker Error (${error})`;
        console.error(msg);
      });
  } else {
    console.warn('Service Worker not available');
  }
  const firebaseApp = useFirebaseApp()
  const messaging = getMessaging(firebaseApp)

  if (!messaging) {
    console.error('Firebase Messaging not initialized!');
    return;
  }

  onMessage(messaging, (payload) => {
    const notification = payload.notification;

    if (Notification.permission === 'granted' && notification?.title) {
      new Notification(notification.title, {
        body: notification.body,
      });
    }
  });
});
</script>
