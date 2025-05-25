<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Main heading -->
    <div class="mb-6">
      <UiHeaderLabel
        :label="$t(`${marketplaceName}.title`)"
        :accent="true"
      />
    </div>

    <!-- Subtitle -->
    <h2 class="text-xl text-gray-600 mb-8">
      <UiFooterLabel :label="$t(`${marketplaceName}.subtitle`)" />
    </h2>

    <!-- Main content sections -->
    <div class="space-y-8">
      <!-- Introduction section -->
      <section class="prose prose-lg max-w-none">
        <h3 class="mb-4">
          <UiHeaderLabel
            :label="$t(`${marketplaceName}.introduction.title`)"
            :accent="true"
          />
        </h3>
        <UiFooterLabel :label="$t(`${marketplaceName}.introduction.bodyText`)" />
      </section>

      <!-- Features section -->
      <section class="prose prose-lg max-w-none">
        <h3 class="mb-4">
          <UiHeaderLabel
            :label="$t(`${marketplaceName}.features.title`)"
            :accent="true"
          />
        </h3>
        <div class="mb-6">
          <UiFooterLabel :label="$t(`${marketplaceName}.features.description`)" />
        </div>

        <!-- Feature list -->
        <div class="grid md:grid-cols-2 gap-6">
          <UiDefaultContainer class="p-6">
            <div class="mb-2">
              <UiHeaderLabel
                :label="$t(`${marketplaceName}.features.filtering.title`)"
                :accent="false"
              />
            </div>
            <UiFooterLabel :label="$t(`${marketplaceName}.features.filtering.description`)" />
          </UiDefaultContainer>

          <UiDefaultContainer class="p-6">
            <div class="mb-2">
              <UiHeaderLabel
                :label="$t(`${marketplaceName}.features.notifications.title`)"
                :accent="false"
              />
            </div>
            <UiFooterLabel :label="$t(`${marketplaceName}.features.notifications.description`)" />
          </UiDefaultContainer>
        </div>
      </section>

      <!-- How it works section -->
      <section class="prose prose-lg max-w-none">
        <h3 class="mb-4">
          <UiHeaderLabel
            :label="$t(`${marketplaceName}.howItWorks.title`)"
            :accent="true"
          />
        </h3>
        <div class="mb-6">
          <UiFooterLabel :label="$t(`${marketplaceName}.howItWorks.bodyText`)" />
        </div>

        <!-- Steps -->
        <div class="space-y-4">
          <div class="flex items-start space-x-4">
            <div
              class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold"
            >
              1
            </div>
            <div>
              <UiHeaderLabel
                :label="$t(`${marketplaceName}.howItWorks.step1.title`)"
                :accent="false"
              />
              <UiFooterLabel :label="$t(`${marketplaceName}.howItWorks.step1.description`)" />
            </div>
          </div>

          <div class="flex items-start space-x-4">
            <div
              class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold"
            >
              2
            </div>
            <div>
              <UiHeaderLabel
                :label="$t(`${marketplaceName}.howItWorks.step2.title`)"
                :accent="false"
              />
              <UiFooterLabel :label="$t(`${marketplaceName}.howItWorks.step2.description`)" />
            </div>
          </div>

          <div class="flex items-start space-x-4">
            <div
              class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold"
            >
              3
            </div>
            <div>
              <UiHeaderLabel
                :label="$t(`${marketplaceName}.howItWorks.step3.title`)"
                :accent="false"
              />
              <UiFooterLabel :label="$t(`${marketplaceName}.howItWorks.step3.description`)" />
            </div>
          </div>
        </div>
      </section>

      <!-- Benefits section -->
      <section class="prose prose-lg max-w-none">
        <h3 class="mb-4">
          <UiHeaderLabel
            :label="$t(`${marketplaceName}.benefits.title`)"
            :accent="true"
          />
        </h3>
        <div class="mb-6">
          <UiFooterLabel :label="$t(`${marketplaceName}.benefits.bodyText`)" />
        </div>

        <ul class="space-y-3">
          <li class="flex items-start space-x-3">
            <svg
              class="w-5 h-5 text-green-500 mt-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            <UiFooterLabel :label="$t(`${marketplaceName}.benefits.benefit1`)" />
          </li>
          <li class="flex items-start space-x-3">
            <svg
              class="w-5 h-5 text-green-500 mt-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            <UiFooterLabel :label="$t(`${marketplaceName}.benefits.benefit2`)" />
          </li>
          <li class="flex items-start space-x-3">
            <svg
              class="w-5 h-5 text-green-500 mt-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            <UiFooterLabel :label="$t(`${marketplaceName}.benefits.benefit3`)" />
          </li>
        </ul>
      </section>

      <!-- Getting started section -->
      <section class="prose prose-lg max-w-none">
        <h3 class="mb-4">
          <UiHeaderLabel
            :label="$t(`${marketplaceName}.gettingStarted.title`)"
            :accent="true"
          />
        </h3>
        <div class="mb-4">
          <UiFooterLabel :label="$t(`${marketplaceName}.gettingStarted.bodyText`)" />
        </div>
        <UiFooterLabel :label="$t(`${marketplaceName}.gettingStarted.callToAction`)" />
      </section>

      <!-- FAQ section -->
      <section class="prose prose-lg max-w-none">
        <h3 class="mb-6">
          <UiHeaderLabel
            :label="$t(`${marketplaceName}.faq.title`)"
            :accent="true"
          />
        </h3>

        <div class="space-y-6">
          <div class="border-b border-gray-200 pb-4">
            <div class="mb-2">
              <UiHeaderLabel
                :label="$t(`${marketplaceName}.faq.question1.title`)"
                :accent="false"
              />
            </div>
            <UiFooterLabel :label="$t(`${marketplaceName}.faq.question1.answer`)" />
          </div>

          <div class="border-b border-gray-200 pb-4">
            <div class="mb-2">
              <UiHeaderLabel
                :label="$t(`${marketplaceName}.faq.question2.title`)"
                :accent="false"
              />
            </div>
            <UiFooterLabel :label="$t(`${marketplaceName}.faq.question2.answer`)" />
          </div>

          <div class="border-b border-gray-200 pb-4">
            <div class="mb-2">
              <UiHeaderLabel
                :label="$t(`${marketplaceName}.faq.question3.title`)"
                :accent="false"
              />
            </div>
            <UiFooterLabel :label="$t(`${marketplaceName}.faq.question3.answer`)" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const marketplaceName = ref(route.params.id)

definePageMeta({
  layout: 'landing',
})

useSeoMeta({
  title: () => `${marketplaceName.value} - Marketplace Filters & Notifications`,
  ogTitle: () => `${marketplaceName.value} - Marketplace Filters & Notifications`,
  description: () => `Create custom filters and receive notifications for ${marketplaceName.value}. Never miss great deals again with our advanced marketplace monitoring tools.`,
  ogDescription: () => `Create custom filters and receive notifications for ${marketplaceName.value}. Never miss great deals again with our advanced marketplace monitoring tools.`,
})
</script>
