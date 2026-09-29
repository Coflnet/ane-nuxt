<template>
  <div class="max-w-6xl mx-auto">
    <h1 class="text-2xl font-bold text-white mb-1">
      {{ $t('labelingTitle') }}
    </h1>
    <p class="text-slate-400 mb-6">
      {{ $t('labelingIntro') }}
    </p>

    <p
      v-if="access === 'checking'"
      class="text-slate-400"
      role="status"
    >
      {{ $t('labelingChecking') }}
    </p>

    <section
      v-else-if="access === 'signedOut'"
      class="bg-slate-800 rounded-xl p-6 max-w-xl"
      data-testid="labeling-signed-out"
    >
      <h2 class="text-lg font-semibold text-white mb-2">
        {{ $t('labelingSignedOutTitle') }}
      </h2>
      <p class="text-slate-300 mb-4">
        {{ $t('labelingSignedOutText') }}
      </p>
      <NuxtLink
        :to="localePath({ path: '/login', query: { redirectTo: '/labeling' } })"
        class="inline-flex bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
      >
        {{ $t('signIn') }}
      </NuxtLink>
    </section>

    <section
      v-else-if="access === 'notEnabled'"
      class="bg-slate-800 rounded-xl p-6 max-w-xl"
      data-testid="labeling-not-enabled"
    >
      <h2 class="text-lg font-semibold text-white mb-2">
        {{ $t('labelingNotEnabledTitle') }}
      </h2>
      <p class="text-slate-300 mb-4">
        {{ $t('labelingNotEnabledText') }}
      </p>
      <p class="text-xs text-slate-400 mb-1">
        {{ $t('labelingUserId') }}
      </p>
      <div class="flex items-center gap-3">
        <code
          class="flex-1 min-w-0 bg-slate-900 text-slate-100 rounded-lg px-3 py-2 text-sm break-all select-all"
          data-testid="labeling-user-id"
        >{{ userId }}</code>
        <button
          type="button"
          class="shrink-0 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
          data-testid="labeling-copy"
          @click="copyUserId"
        >
          {{ copied ? $t('copied') : $t('copy') }}
        </button>
      </div>
    </section>

    <div
      v-else
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div class="min-w-0 space-y-4">
        <p
          class="text-sm text-slate-300 bg-slate-800 rounded-lg px-3 py-2"
          data-testid="labeling-rule"
        >
          {{ $t('labelingRule') }}
        </p>

        <form
          class="flex flex-wrap items-end gap-2"
          @submit.prevent="applyFilter"
        >
          <div class="flex-1 min-w-[12rem]">
            <label
              for="labeling-group-filter"
              class="block text-xs text-slate-400 mb-1"
            >{{ $t('labelingFilterLabel') }}</label>
            <input
              id="labeling-group-filter"
              v-model="filterInput"
              type="text"
              autocomplete="off"
              :placeholder="$t('labelingFilterPlaceholder')"
              class="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
            >
          </div>
          <button
            type="submit"
            class="bg-slate-700 text-slate-100 hover:bg-slate-600 px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
          >
            {{ $t('labelingFilterApply') }}
          </button>
          <button
            v-if="activeFilter"
            type="button"
            class="bg-slate-700 text-slate-100 hover:bg-slate-600 px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
            @click="clearFilter"
          >
            {{ $t('labelingFilterClear') }}
          </button>
          <button
            v-if="suggestedGroup"
            type="button"
            class="text-sm text-indigo-300 hover:text-indigo-200 underline px-1 py-2 max-w-full break-words text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
            data-testid="labeling-suggest-group"
            @click="useSuggestedGroup"
          >
            {{ $t('labelingFilterUseCurrent') }}: {{ suggestedGroup }}
          </button>
        </form>

        <p
          v-if="saveFailed"
          class="text-sm text-red-200 bg-red-950 border border-red-800 rounded-lg px-3 py-2"
          role="alert"
          data-testid="labeling-save-error"
        >
          {{ $t('labelingSaveFailed') }}
        </p>
        <p
          v-if="loadFailed"
          class="text-sm text-red-200 bg-red-950 border border-red-800 rounded-lg px-3 py-2"
          role="alert"
          data-testid="labeling-load-error"
        >
          {{ $t('labelingLoadFailed') }}
        </p>

        <div
          v-if="!current"
          class="bg-slate-800 rounded-xl p-8 text-center"
          data-testid="labeling-empty"
        >
          <template v-if="loading">
            <p
              class="text-slate-400"
              role="status"
            >
              {{ $t('labelingChecking') }}
            </p>
          </template>
          <template v-else>
            <h2 class="text-lg font-semibold text-white mb-1">
              {{ $t('labelingEmptyTitle') }}
            </h2>
            <p class="text-slate-400 mb-4">
              {{ $t('labelingEmptyText') }}
            </p>
            <div class="flex justify-center gap-2">
              <button
                type="button"
                class="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                data-testid="labeling-reload"
                @click="reload"
              >
                {{ $t('labelingReload') }}
              </button>
              <button
                v-if="canUndo"
                type="button"
                class="bg-slate-700 text-slate-100 hover:bg-slate-600 px-4 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
                @click="undoLast"
              >
                {{ $t('labelingUndo') }} (Z)
              </button>
            </div>
            <p
              class="text-sm text-slate-400 mt-4"
              data-testid="labeling-session"
            >
              {{ $t('labelingSession') }}: <span class="text-white tabular-nums">{{ sessionCount }}</span>
            </p>
          </template>
        </div>

        <template v-else>
          <div
            :key="current.pairId"
            class="grid gap-3 sm:grid-cols-2"
            data-testid="labeling-pair"
          >
            <figure
              v-for="side in sides"
              :key="side.key"
              class="min-w-0 bg-slate-800 rounded-xl p-3"
            >
              <div class="aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  v-if="!imageFailed[side.key] && side.data.imageUrl"
                  :src="side.data.imageUrl"
                  :alt="`${$t(side.title)}: ${side.data.platform}`"
                  referrerpolicy="no-referrer"
                  class="w-full h-full object-contain"
                  :data-testid="`labeling-photo-${side.key}`"
                  @error="imageFailed[side.key] = true"
                >
                <div
                  v-else
                  class="text-sm text-slate-400 text-center px-4"
                  role="img"
                  :aria-label="$t('labelingPhotoFailed')"
                  :data-testid="`labeling-placeholder-${side.key}`"
                >
                  <Icon
                    name="tabler:photo-off"
                    class="size-10 mb-2"
                  />
                  <p>{{ $t('labelingPhotoFailed') }}</p>
                </div>
              </div>
              <figcaption class="flex items-center justify-between gap-3 mt-2 text-sm">
                <span class="text-slate-200 min-w-0 truncate">
                  <span class="text-slate-400">{{ $t(side.title) }}:</span>
                  {{ side.data.platform }}
                </span>
                <a
                  :href="side.data.listingUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="shrink-0 text-indigo-300 hover:text-indigo-200 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
                >{{ $t('labelingOpenOffer') }}</a>
              </figcaption>
            </figure>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
            <p
              v-if="current.groupKey"
              class="text-slate-300 min-w-0 break-words"
              data-testid="labeling-group"
            >
              <span class="text-slate-400">{{ $t('labelingGroup') }}:</span>
              {{ current.groupKey }}
            </p>
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                v-model="showScore"
                type="checkbox"
                class="size-4 accent-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
                data-testid="labeling-show-score"
              >
              {{ $t('labelingShowScore') }}
            </label>
          </div>
          <p
            v-if="showScore"
            class="text-sm text-slate-300 bg-slate-800 rounded-lg px-3 py-2"
            data-testid="labeling-score"
          >
            {{ $t('labelingSimilarity') }}: {{ formatScore(current.similarity) }}
            <template v-if="current.secondBest != null">
              | {{ $t('labelingSecondBest') }}: {{ formatScore(current.secondBest) }}
            </template>
            <template v-if="current.decision">
              | {{ $t('labelingDecision') }}: {{ current.decision }}
            </template>
          </p>

          <div
            role="group"
            :aria-label="$t('labelingAnswers')"
            class="grid gap-2 sm:grid-cols-2"
          >
            <button
              v-for="option in answerOptions"
              :key="option.label"
              type="button"
              class="flex items-center gap-3 text-left bg-slate-700 text-slate-100 hover:bg-slate-600 px-4 py-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
              :data-testid="`labeling-answer-${option.key}`"
              @click="submit(option.label)"
            >
              <kbd class="shrink-0 size-7 rounded bg-slate-900 text-slate-200 border border-slate-500 flex items-center justify-center text-sm">{{ option.key }}</kbd>
              <span class="min-w-0">
                <span class="block font-medium">{{ $t(option.text) }}</span>
                <span
                  v-if="option.hint"
                  class="block text-xs text-slate-400"
                >{{ $t(option.hint) }}</span>
              </span>
            </button>
          </div>

          <div class="flex items-center justify-between gap-3 text-sm">
            <button
              type="button"
              class="bg-slate-800 text-slate-200 hover:bg-slate-700 px-3 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
              :disabled="!canUndo"
              data-testid="labeling-undo"
              @click="undoLast"
            >
              {{ $t('labelingUndo') }} (Z)
            </button>
            <p
              class="text-slate-400"
              data-testid="labeling-session"
            >
              {{ $t('labelingSession') }}: <span class="text-white tabular-nums">{{ sessionCount }}</span>
            </p>
          </div>
        </template>
      </div>

      <aside class="min-w-0">
        <LabelingStatsPanel
          :stats="stats"
          :failed="statsFailed"
        />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useHead, useLocalePath, useSeoMeta } from '#imports'
import LabelingStatsPanel from '~/components/labeling/StatsPanel.vue'
import { labelingErrorStatus, useLabelingApi } from '~/composables/useLabelingApi'
import type { LabelingStats } from '~/composables/useLabelingApi'
import { useUserStore } from '~/stores/user'
import { answer, BATCH_SIZE, createQueueState, enqueue, needsRefill, rollback, undo, upcoming } from '~/utils/labelingQueue'
import type { LabelAnswer, LabelingQueueState } from '~/utils/labelingQueue'
import { createLabelSender } from '~/utils/labelingSender'
import { shortcutFor } from '~/utils/labelingShortcuts'

// Never indexed. Everything that depends on the visitor is resolved in onMounted,
// because the server renders the same shell for everybody.
useSeoMeta({ title: 'Photo pair labeling', robots: 'noindex, nofollow' })
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const localePath = useLocalePath()
const userStore = useUserStore()
const api = useLabelingApi()

const SCORE_KEY = 'ane-labeling-show-score'
const STATS_EVERY = 5

const access = ref<'checking' | 'signedOut' | 'notEnabled' | 'ready'>('checking')
const userId = ref('')
const copied = ref(false)

const state = ref<LabelingQueueState>(createQueueState())
const loading = ref(false)
const loadFailed = ref(false)
const saveFailed = ref(false)
const exhausted = ref(false)
let generation = 0

const stats = ref<LabelingStats | null>(null)
const statsFailed = ref(false)
const sessionCount = ref(0)
const imageFailed = reactive<Record<string, boolean>>({ a: false, b: false })

const showScore = ref(false)
const scoreLoaded = ref(false)
const filterInput = ref('')
const activeFilter = ref('')

const current = computed(() => state.value.current)
const canUndo = computed(() => state.value.history.length > 0)
const suggestedGroup = computed(() => {
  const group = current.value?.groupKey ?? ''
  return group && group !== activeFilter.value ? group : ''
})

const sides = computed(() => current.value
  ? [
      { key: 'a', title: 'labelingPhotoA', data: current.value.a },
      { key: 'b', title: 'labelingPhotoB', data: current.value.b },
    ]
  : [])

const answerOptions: { key: string, label: LabelAnswer, text: string, hint?: string }[] = [
  { key: '1', label: 'same_item', text: 'labelingSameItem', hint: 'labelingSameItemHint' },
  { key: '2', label: 'same_model_other_variant', text: 'labelingSameModel' },
  { key: '3', label: 'different', text: 'labelingDifferent' },
  { key: '4', label: 'unsure', text: 'labelingUnsure' },
]

const sender = createLabelSender((pairId, label) => api.label(pairId, label))

function formatScore(value?: number | null) {
  return typeof value === 'number' ? value.toFixed(3) : '-'
}

async function loadStats() {
  try {
    stats.value = await api.stats()
    statsFailed.value = false
  }
  catch {
    statsFailed.value = true
  }
}

async function loadBatch() {
  if (loading.value || exhausted.value || access.value !== 'ready') return
  loading.value = true
  const mine = generation
  try {
    const batch = await api.next(BATCH_SIZE, activeFilter.value)
    if (mine !== generation) return
    const before = state.value
    state.value = enqueue(before, batch)
    const added = state.value.queue.length + (state.value.current ? 1 : 0)
      - before.queue.length - (before.current ? 1 : 0)
    if (added === 0) exhausted.value = true
    loadFailed.value = false
  }
  catch (error) {
    if (mine !== generation) return
    if (labelingErrorStatus(error) === 403) access.value = 'notEnabled'
    else loadFailed.value = true
    exhausted.value = true
  }
  finally {
    if (mine === generation) loading.value = false
  }
}

async function reload() {
  generation++
  loading.value = false
  exhausted.value = false
  loadFailed.value = false
  state.value = createQueueState()
  await Promise.all([loadBatch(), loadStats()])
}

function submit(label: LabelAnswer) {
  const result = answer(state.value, label)
  if (!result.answered) return
  state.value = result.state
  saveFailed.value = false
  sessionCount.value++
  const pairId = result.answered.pair.pairId
  sender(pairId, label).then(() => {
    if (sessionCount.value % STATS_EVERY === 0) loadStats()
  }).catch(() => {
    const rolled = rollback(state.value, pairId)
    if (!rolled.restored) return
    state.value = rolled.state
    sessionCount.value = Math.max(0, sessionCount.value - 1)
    saveFailed.value = true
  })
  if (needsRefill(state.value)) loadBatch()
}

function undoLast() {
  const result = undo(state.value)
  if (!result.restored) return
  state.value = result.state
  sessionCount.value = Math.max(0, sessionCount.value - 1)
  saveFailed.value = false
}

function applyFilter() {
  activeFilter.value = filterInput.value.trim()
  reload()
}

function clearFilter() {
  filterInput.value = ''
  applyFilter()
}

function useSuggestedGroup() {
  filterInput.value = suggestedGroup.value
  applyFilter()
}

async function copyUserId() {
  try {
    await navigator.clipboard.writeText(userId.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
  catch {
    // the id stays selectable as text
  }
}

function onKeydown(event: KeyboardEvent) {
  if (access.value !== 'ready') return
  const action = shortcutFor(event)
  if (!action) return
  event.preventDefault()
  if (action.type === 'undo') undoLast()
  else submit(action.label)
}

// Preload the photos of the next pair so the following answer shows it at once.
watch(() => upcoming(state.value)?.pairId, () => {
  const next = upcoming(state.value)
  if (!next || import.meta.server) return
  for (const side of [next.a, next.b]) {
    if (side.imageUrl) new Image().src = side.imageUrl
  }
})

watch(() => current.value?.pairId, () => {
  imageFailed.a = false
  imageFailed.b = false
})

watch(showScore, (value) => {
  if (!scoreLoaded.value) return
  try {
    localStorage.setItem(SCORE_KEY, value ? '1' : '0')
  }
  catch {
    // remembering is a convenience only
  }
})

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  try {
    showScore.value = localStorage.getItem(SCORE_KEY) === '1'
  }
  catch {
    // storage may be blocked
  }
  scoreLoaded.value = true

  if (!userStore.isLoggedIn || !userStore.token) {
    access.value = 'signedOut'
    return
  }
  try {
    const me = await api.me()
    userId.value = me.userId
    access.value = me.canLabel ? 'ready' : 'notEnabled'
  }
  catch (error) {
    access.value = labelingErrorStatus(error) === 401 ? 'signedOut' : 'notEnabled'
    return
  }
  if (access.value === 'ready') await reload()
})

onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener('keydown', onKeydown)
})
</script>
