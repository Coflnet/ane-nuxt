<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

definePageMeta({ layout: 'landing' })
useSeoMeta({
  title: () => `${t('alertGuide.collectibles')} | Ane`,
  description: () => t('alertGuide.collectiblesDescription'),
})
useJsonLd(() => buildBreadcrumbJsonLd([
  { name: t('nav.home'), url: localePath('/') },
  { name: t('alertGuide.hub'), url: localePath('/marketplaces') },
  { name: t('alertGuide.collectibles'), url: route.path },
]))
</script>

<template>
  <main class="mx-auto max-w-4xl space-y-8 px-4 py-8">
    <h1 class="text-3xl font-bold text-white">
      {{ $t('alertGuide.collectibles') }}
    </h1>
    <MarketplacesAlertGuide guide="collectibles" />
  </main>
</template>
