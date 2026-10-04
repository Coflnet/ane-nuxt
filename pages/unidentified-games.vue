<template>
  <div class="max-w-6xl mx-auto">
    <h1 class="text-2xl font-bold text-white mb-1">
      {{ $t('unidentifiedTitle') }}
    </h1>
    <p class="text-slate-400 mb-6">
      {{ $t('unidentifiedIntro') }}
    </p>

    <p
      v-if="access === 'checking'"
      class="text-slate-400"
      role="status"
    >
      {{ $t('loading') }}
    </p>

    <section
      v-else-if="access === 'signedOut'"
      class="bg-slate-800 rounded-xl p-6 max-w-xl"
    >
      <p class="text-slate-300 mb-4">
        {{ $t('unidentifiedSignedOut') }}
      </p>
      <NuxtLink
        :to="localePath({ path: '/login', query: { redirectTo: '/unidentified-games' } })"
        class="inline-flex bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg"
      >
        {{ $t('signIn') }}
      </NuxtLink>
    </section>

    <section
      v-else-if="access === 'notEnabled'"
      class="bg-slate-800 rounded-xl p-6 max-w-xl"
    >
      <p class="text-slate-300">
        {{ $t('unidentifiedNotEnabled') }}
      </p>
    </section>

    <template v-else>
      <p
        v-if="failed"
        class="text-red-300 mb-4"
        role="alert"
      >
        {{ $t('unidentifiedLoadFailed') }}
      </p>

      <!-- Listings of one series -->
      <section v-if="selected">
        <button
          type="button"
          class="mb-4 text-blue-400 hover:text-blue-300 underline"
          @click="back"
        >
          {{ $t('unidentifiedBack') }}
        </button>
        <h2 class="text-xl font-semibold text-white mb-4">
          {{ selected.series }} <span class="text-slate-400 text-base">({{ selected.platform }})</span>
        </h2>
        <ul class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <li
            v-for="item in items"
            :key="`${item.listingPlatform}:${item.listingId}`"
            class="bg-slate-800 rounded-xl p-4 flex gap-4"
          >
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.title"
              loading="lazy"
              referrerpolicy="no-referrer"
              class="w-24 h-24 object-cover rounded-lg bg-slate-900 shrink-0"
            >
            <div class="min-w-0">
              <p class="text-slate-100 font-medium line-clamp-2">
                {{ item.title }}
              </p>
              <p class="text-green-400 font-semibold">
                {{ item.price ? `${item.price.toFixed(2)} ${item.currency}` : '-' }}
              </p>
              <p class="text-xs text-slate-400">
                {{ $t('unidentifiedStage') }}: {{ $t(`unidentifiedStage_${item.identifyStage}`, item.identifyStage) }} · {{ item.listingPlatform }}
              </p>
              <a
                v-if="item.listingUrl"
                :href="item.listingUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-blue-400 hover:text-blue-300 underline"
              >{{ $t('unidentifiedOpenListing') }}</a>
            </div>
          </li>
        </ul>
        <p
          v-if="!loading && items.length === 0 && !failed"
          class="text-slate-400"
        >
          {{ $t('unidentifiedEmpty') }}
        </p>
        <button
          v-if="nextState"
          type="button"
          class="mt-6 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg disabled:opacity-50"
          :disabled="loading"
          @click="loadMore"
        >
          {{ $t('unidentifiedLoadMore') }}
        </button>
      </section>

      <!-- Series per platform -->
      <section v-else>
        <div
          v-for="group in groups"
          :key="group.platform"
          class="mb-6"
        >
          <h2 class="text-lg font-semibold text-white mb-2">
            {{ group.platform }}
          </h2>
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <li
              v-for="entry in group.series"
              :key="entry.series"
            >
              <button
                type="button"
                class="w-full flex justify-between gap-3 bg-slate-800 hover:bg-slate-700 rounded-lg px-4 py-2 text-left"
                @click="open(entry)"
              >
                <span class="text-slate-100 truncate">{{ entry.series }}</span>
                <span class="text-slate-400 shrink-0">{{ entry.count }}</span>
              </button>
            </li>
          </ul>
        </div>
        <p
          v-if="!loading && groups.length === 0 && !failed"
          class="text-slate-400"
        >
          {{ $t('unidentifiedEmpty') }}
        </p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useHead, useLocalePath, useSeoMeta } from '#imports'
import { labelingErrorStatus } from '~/composables/useLabelingApi'
import { useUnidentifiedGamesApi } from '~/composables/useUnidentifiedGamesApi'
import type { UnidentifiedListing, UnidentifiedSeries } from '~/composables/useUnidentifiedGamesApi'
import { useUserStore } from '~/stores/user'

// Review tool, never indexed. The API answers only signed-in users on the labeler allow list.
useSeoMeta({ title: 'Games not identified yet', robots: 'noindex, nofollow' })
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const localePath = useLocalePath()
const userStore = useUserStore()
const api = useUnidentifiedGamesApi()

const access = ref<'checking' | 'signedOut' | 'notEnabled' | 'ready'>('checking')
const series = ref<UnidentifiedSeries[]>([])
const selected = ref<UnidentifiedSeries | null>(null)
const items = ref<UnidentifiedListing[]>([])
const nextState = ref<string | null>(null)
const loading = ref(false)
const failed = ref(false)

const groups = computed(() => {
  const byPlatform = new Map<string, UnidentifiedSeries[]>()
  for (const entry of series.value) {
    byPlatform.set(entry.platform, [...(byPlatform.get(entry.platform) ?? []), entry])
  }
  return [...byPlatform.entries()].map(([platform, list]) => ({ platform, series: list }))
})

function handleError(error: unknown) {
  const status = labelingErrorStatus(error)
  if (status === 401) access.value = 'signedOut'
  else if (status === 403) access.value = 'notEnabled'
  else failed.value = true
}

async function loadMore() {
  if (!selected.value || loading.value) return
  loading.value = true
  try {
    const page = await api.listings(selected.value.platform, selected.value.series, nextState.value)
    items.value = [...items.value, ...page.items]
    nextState.value = page.nextPagingState ?? null
    failed.value = false
  }
  catch (error) {
    handleError(error)
  }
  finally {
    loading.value = false
  }
}

function open(entry: UnidentifiedSeries) {
  selected.value = entry
  items.value = []
  nextState.value = null
  loadMore()
}

function back() {
  selected.value = null
  items.value = []
  nextState.value = null
}

onMounted(async () => {
  if (!userStore.isLoggedIn || !userStore.token) {
    access.value = 'signedOut'
    return
  }
  access.value = 'ready'
  loading.value = true
  try {
    series.value = await api.series()
  }
  catch (error) {
    handleError(error)
  }
  finally {
    loading.value = false
  }
})
</script>
