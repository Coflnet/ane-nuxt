<script setup lang="ts">
import guides from '~/content/alertGuides.json'

const props = defineProps<{ guide: keyof typeof guides.en }>()
const { locale, t } = useI18n()
const localePath = useLocalePath()
const content = computed(() => guides[locale.value === 'de' ? 'de' : 'en'][props.guide])

useJsonLd(() => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': content.value.faqs.map(faq => ({
    '@type': 'Question',
    'name': faq.question,
    'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer },
  })),
}))
</script>

<template>
  <section class="rounded-lg border border-gray-700 bg-gray-900 p-6 text-gray-300 sm:p-8">
    <p class="mb-3 text-sm text-gray-400">
      {{ $t('alertGuide.updated') }} <time datetime="2026-10-29">2026-10-29</time>
    </p>
    <h2 class="text-2xl font-bold text-white">
      {{ content.title }}
    </h2>
    <p class="mt-4 leading-7">
      {{ content.intro }}
    </p>
    <section
      v-for="section in content.sections"
      :key="section.heading"
      class="mt-6"
    >
      <h3 class="text-xl font-semibold text-white">
        {{ section.heading }}
      </h3>
      <p class="mt-2 leading-7">
        {{ section.body }}
      </p>
    </section>
    <dl class="mt-8 space-y-6">
      <div
        v-for="faq in content.faqs"
        :key="faq.question"
      >
        <dt class="font-semibold text-white">
          {{ faq.question }}
        </dt>
        <dd class="mt-2 leading-7">
          {{ faq.answer }}
        </dd>
      </div>
    </dl>
    <ul
      v-if="content.sources.length"
      class="mt-6 space-y-2"
      :aria-label="t('alertGuide.sources')"
    >
      <li
        v-for="source in content.sources"
        :key="source.url"
      >
        <a
          :href="source.url"
          class="text-indigo-300 underline hover:text-white focus-visible:outline focus-visible:outline-2"
        >{{ source.label }}</a>
      </li>
    </ul>
    <nav
      class="mt-8 flex flex-wrap gap-4"
      :aria-label="t('alertGuide.next')"
    >
      <NuxtLink
        :to="localePath('/filters/create')"
        class="text-indigo-300 underline hover:text-white focus-visible:outline focus-visible:outline-2"
      >
        {{ $t('alertGuide.create') }}
      </NuxtLink>
      <NuxtLink
        :to="localePath('/marketplaces')"
        class="text-indigo-300 underline hover:text-white focus-visible:outline focus-visible:outline-2"
      >
        {{ $t('alertGuide.hub') }}
      </NuxtLink>
      <NuxtLink
        :to="localePath('/subscriptions')"
        class="text-indigo-300 underline hover:text-white focus-visible:outline focus-visible:outline-2"
      >
        {{ $t('alertGuide.plans') }}
      </NuxtLink>
    </nav>
  </section>
</template>
