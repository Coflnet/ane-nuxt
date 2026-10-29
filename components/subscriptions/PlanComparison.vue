<script setup lang="ts">
import { plans } from '~/constants/SubscriptionConstants'

const { locale } = useI18n()
const localePath = useLocalePath()
const currency = computed(() => new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'EUR' }))
</script>

<template>
  <section
    id="alert-plans"
    class="scroll-mt-24 rounded-lg border border-gray-700 bg-gray-900 p-4 text-gray-300 sm:p-6"
  >
    <h2 class="text-2xl font-bold text-white">
      {{ $t('alertGuide.tableTitle') }}
    </h2>
    <p class="mt-3 text-sm text-gray-400 sm:hidden">
      {{ $t('alertGuide.scrollTable') }}
    </p>
    <div
      class="mt-4 overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-300"
      tabindex="0"
      role="region"
      :aria-label="$t('alertGuide.tableTitle')"
    >
      <table class="min-w-[640px] w-full text-left text-sm">
        <caption class="mb-3 text-left text-gray-400">
          {{ $t('alertGuide.updated') }} <time datetime="2026-10-29">2026-10-29</time>
        </caption>
        <thead class="text-white">
          <tr>
            <th
              scope="col"
              class="p-3"
            >
              {{ $t('alertGuide.plan') }}
            </th>
            <th
              scope="col"
              class="p-3"
            >
              {{ $t('alertGuide.price') }}
            </th>
            <th
              scope="col"
              class="p-3"
            >
              {{ $t('alertGuide.searches') }}
            </th>
            <th
              scope="col"
              class="p-3"
            >
              {{ $t('alertGuide.delay') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="plan in plans"
            :key="plan.id"
            class="border-t border-gray-700"
          >
            <th
              scope="row"
              class="p-3 font-semibold text-white"
            >
              {{ $t(plan.name) }}
            </th>
            <td class="p-3 tabular-nums">
              {{ currency.format(plan.price) }}
            </td>
            <td class="p-3 tabular-nums">
              {{ plan.features.find(feature => feature.text === 'XActiveFilters')?.amount }}
            </td>
            <td class="p-3">
              {{ plan.id === 'flipper' ? $t('noExtraDelay') : $t('XMinuteDelay', { amount: plan.features.find(feature => feature.text === 'XMinuteDelay')?.amount }) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="mt-4 text-sm leading-6">
      {{ $t('alertGuide.termsNote') }}
      <NuxtLink
        :to="localePath('/subscriptions')"
        class="text-indigo-300 underline hover:text-white focus-visible:outline focus-visible:outline-2"
      >{{ $t('alertGuide.plans') }}</NuxtLink>
    </p>
    <p class="mt-4 text-sm leading-6">
      {{ $t('alertGuide.timingNote') }}
    </p>
  </section>
</template>
