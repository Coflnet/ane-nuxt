<template>
  <section
    v-if="visible"
    class="mb-4 rounded-xl border border-indigo-500/30 bg-slate-800 p-4 sm:p-5"
    data-testid="parts-suggestion-card"
    :aria-label="$t('searchMore.partsTitle')"
  >
    <div class="flex items-start gap-3">
      <span class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15">
        <UiIcon name="tabler:settings" />
      </span>
      <div class="min-w-0 flex-1">
        <h3 class="text-base font-semibold text-slate-100">
          {{ $t('searchMore.partsTitle') }}
        </h3>
        <p class="mt-1 text-sm text-slate-400">
          {{ $t('searchMore.partsBody') }}
        </p>
        <ul
          v-if="chips.length"
          class="mt-3 flex flex-wrap gap-2"
        >
          <li
            v-for="chip in chips"
            :key="chip.key"
            class="max-w-full break-words rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200"
          >
            {{ chipLabel(chip) }}
          </li>
        </ul>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <NuxtLink
            :to="finderLink"
            class="inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            data-testid="parts-suggestion-open"
          >
            {{ $t('searchMore.partsOpen') }}
          </NuxtLink>
          <button
            type="button"
            class="inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
            data-testid="parts-suggestion-dismiss"
            @click="dismiss"
          >
            {{ $t('searchMore.partsDismiss') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { partHintChips, partsFinderQuery, partsSuggestionDismissKey, type PartHintChip, type PartHints } from '~/utils/partsSuggestion'
import { showPartsSuggestion } from '~/utils/searchSpecialVisibility'

const props = defineProps<{
  query: string
  isPartQuery?: boolean | null
  hints?: PartHints | null
}>()

const { t } = useI18n()
const localePath = useLocalePath()

/** Queries dismissed in this tab; mirrored to sessionStorage so a reload keeps them hidden. */
const dismissedKeys = ref(new Set<string>())
const dismissKey = computed(() => partsSuggestionDismissKey(props.query))
const visible = computed(() => showPartsSuggestion(props.isPartQuery, dismissedKeys.value.has(dismissKey.value)))
const chips = computed(() => partHintChips(props.hints))
const finderLink = computed(() => localePath({ path: '/parts', query: partsFinderQuery(props.query, props.hints) }))

function chipLabel(chip: PartHintChip): string {
  return t(chip.key, { value: chip.value })
}

function readSessionDismissal(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1'
  }
  catch {
    return false
  }
}

function rememberDismissal(key: string) {
  try {
    sessionStorage.setItem(key, '1')
  }
  catch {
    // Storage blocked: the in-memory set still hides the card for this visit.
  }
}

function markDismissed(key: string) {
  dismissedKeys.value = new Set([...dismissedKeys.value, key])
}

function dismiss() {
  markDismissed(dismissKey.value)
  rememberDismissal(dismissKey.value)
}

function syncDismissal() {
  if (readSessionDismissal(dismissKey.value)) markDismissed(dismissKey.value)
}

onMounted(syncDismissal)
watch(dismissKey, () => {
  if (import.meta.client) syncDismissal()
})
</script>
