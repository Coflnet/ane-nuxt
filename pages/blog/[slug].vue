<script setup lang="ts">
import { CalendarDays, Clock } from 'lucide-vue-next'
import { getArticleBySlug } from '~/utils/articles'

const route = useRoute()
const localePath = useLocalePath()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
const article = getArticleBySlug(slug)

if (!article) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found' })
}

useSeoMeta({
  title: `${article.title} | Ane Deals`,
  description: article.description,
  ogTitle: `${article.title} | Ane Deals`,
  ogDescription: article.description,
  ogImage: article.heroImage,
})

useHead({
  htmlAttrs: { lang: article.locale },
})
</script>

<template>
  <main class="min-h-screen bg-gray-950 text-white">
    <article>
      <header class="border-b border-gray-800 bg-gray-900">
        <div class="mx-auto max-w-4xl px-6 py-12">
          <NuxtLink
            :to="localePath('/blog')"
            class="text-sm font-medium text-green-400 hover:text-green-300"
          >
            {{ article.locale === 'de' ? 'Flipping-Guides' : 'Marketplace guides' }}
          </NuxtLink>
          <h1 class="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            {{ article.title }}
          </h1>
          <p class="mt-5 text-lg text-gray-300">
            {{ article.description }}
          </p>
          <div class="mt-6 flex flex-wrap gap-4 text-sm text-gray-400">
            <span class="inline-flex items-center gap-2">
              <CalendarDays class="h-4 w-4" />
              {{ new Date(article.publishedAt).toLocaleDateString() }}
            </span>
            <span class="inline-flex items-center gap-2">
              <Clock class="h-4 w-4" />
              {{ article.readingMinutes }} {{ article.locale === 'de' ? 'Min. Lesezeit' : 'min read' }}
            </span>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-4xl px-6 py-10">
        <NuxtImg
          :src="article.heroImage"
          :alt="article.title"
          class="mb-10 w-full rounded-lg border border-gray-800 object-cover shadow-xl"
          sizes="sm:100vw md:896px"
        />

        <section class="space-y-9 text-lg leading-8 text-gray-300">
          <div
            v-for="section in article.sections"
            :key="section.heading"
          >
            <h2 class="mb-3 text-2xl font-bold text-white">
              {{ section.heading }}
            </h2>
            <p>{{ section.body }}</p>
          </div>
        </section>
      </div>
    </article>
  </main>
</template>
