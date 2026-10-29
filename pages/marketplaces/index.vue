<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

definePageMeta({ layout: 'landing' })
useSeoMeta({
  title: () => t('alertGuide.metaTitle'),
  description: () => t('alertGuide.metaDescription'),
  ogTitle: () => t('alertGuide.metaTitle'),
  ogDescription: () => t('alertGuide.metaDescription'),
})
useJsonLd(() => buildBreadcrumbJsonLd([
  { name: t('nav.home'), url: localePath('/') },
  { name: t('alertGuide.hub'), url: route.path },
]))
</script>

<template>
  <main class="mx-auto max-w-4xl space-y-8 px-4 py-8">
    <h1 class="text-3xl font-bold text-white">
      {{ $t('alertGuide.hub') }}
    </h1>
    <MarketplacesAlertGuide guide="overview" />
    <SubscriptionsPlanComparison />
    <nav
      class="grid gap-4 sm:grid-cols-2"
      :aria-label="$t('alertGuide.next')"
    >
      <NuxtLink
        v-for="marketplace in ['kleinanzeigen', 'craigslist', 'autoscout24']"
        :key="marketplace"
        :to="localePath(`/marketplaces/${marketplace}`)"
        class="rounded-lg border border-gray-700 bg-gray-900 p-6 text-indigo-300 underline hover:text-white focus-visible:outline focus-visible:outline-2"
      >
        {{ $t(`${marketplace}.name`) }}
      </NuxtLink>
      <NuxtLink
        :to="localePath('/guides/collectible-alerts')"
        class="rounded-lg border border-gray-700 bg-gray-900 p-6 text-indigo-300 underline hover:text-white focus-visible:outline focus-visible:outline-2"
      >
        {{ $t('alertGuide.collectibles') }}
      </NuxtLink>
      <NuxtLink
        :to="localePath('/flipper')"
        class="rounded-lg border border-gray-700 bg-gray-900 p-6 text-indigo-300 underline hover:text-white focus-visible:outline focus-visible:outline-2"
      >
        {{ $t('alertGuide.askingPrices') }}
      </NuxtLink>
    </nav>
  </main>
</template>
