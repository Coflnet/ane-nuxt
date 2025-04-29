<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
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

});
</script>
