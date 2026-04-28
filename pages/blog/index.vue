<script setup lang="ts">
import { CalendarDays, Clock } from 'lucide-vue-next'
import { getPublishedArticles } from '~/utils/articles'

const localePath = useLocalePath()
const articles = getPublishedArticles()

useSeoMeta({
  title: 'Flipping-Guides für Kleinanzeigen, eBay und Sammlerstücke | Ane Deals',
  description: 'Wöchentliche Praxis-Guides zum Flippen auf Kleinanzeigen und eBay – Pokémon-Karten, Retro-Gaming, LEGO als Wertanlage und Verhandlungstaktiken.',
  ogTitle: 'Flipping-Guides für Kleinanzeigen, eBay und Sammlerstücke | Ane Deals',
  ogDescription: 'Wöchentliche Praxis-Guides zum Flippen auf Kleinanzeigen und eBay – Pokémon-Karten, Retro-Gaming, LEGO als Wertanlage und Verhandlungstaktiken.',
})

useHead({
  htmlAttrs: { lang: 'de' },
})
</script>

<template>
  <main class="min-h-screen bg-gray-950 text-white">
    <section class="border-b border-gray-800 bg-gray-900">
      <div class="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-green-400">
            Flipping-Guides
          </p>
          <h1 class="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Wöchentliche Notizen für saubere Flips und bessere Sammler-Funde
          </h1>
          <p class="mt-5 max-w-2xl text-lg text-gray-300">
            Praxisnahe Guides aus dem deutschen Reseller-Umfeld – wöchentlich neu. Zukünftige Beiträge erscheinen erst zum Release-Datum in Sitemap und Routen.
          </p>
        </div>
        <NuxtImg
          src="/DashboardPreview.webp"
          alt="Ane Deals dashboard preview"
          class="w-full rounded-lg border border-gray-800 object-cover shadow-xl"
          sizes="sm:100vw md:360px"
        />
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-6 py-12">
      <div class="grid gap-5 md:grid-cols-2">
        <article
          v-for="article in articles"
          :key="article.slug"
          class="rounded-lg border border-gray-800 bg-gray-900 p-6 transition hover:border-green-500/60"
        >
          <p class="text-sm font-medium text-green-400">
            {{ article.category }}
          </p>
          <h2 class="mt-3 text-2xl font-bold leading-snug">
            <NuxtLink
              :to="localePath(`/blog/${article.slug}`)"
              class="hover:text-green-300"
            >
              {{ article.title }}
            </NuxtLink>
          </h2>
          <p class="mt-3 text-gray-300">
            {{ article.description }}
          </p>
          <div class="mt-5 flex flex-wrap gap-4 text-sm text-gray-400">
            <span class="inline-flex items-center gap-2">
              <CalendarDays class="h-4 w-4" />
              {{ new Date(article.publishedAt).toLocaleDateString() }}
            </span>
            <span class="inline-flex items-center gap-2">
              <Clock class="h-4 w-4" />
              {{ article.readingMinutes }} Min. Lesezeit
            </span>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
