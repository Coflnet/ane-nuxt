<template>
  <section
    class="bg-slate-800 rounded-xl p-4 space-y-5"
    aria-labelledby="labeling-stats-title"
    data-testid="labeling-stats"
  >
    <h2
      id="labeling-stats-title"
      class="text-lg font-semibold text-white"
    >
      {{ $t('labelingStatsTitle') }}
    </h2>

    <p
      v-if="failed && !stats"
      class="text-sm text-red-300"
    >
      {{ $t('labelingStatsFailed') }}
    </p>

    <template v-if="stats">
      <dl class="grid grid-cols-2 gap-3">
        <div class="bg-slate-900 rounded-lg p-3">
          <dt class="text-xs text-slate-400">
            {{ $t('labelingStatsWaiting') }}
          </dt>
          <dd
            class="text-xl font-semibold text-white"
            data-testid="stat-candidates"
          >
            {{ stats.candidates }}
          </dd>
        </div>
        <div class="bg-slate-900 rounded-lg p-3">
          <dt class="text-xs text-slate-400">
            {{ $t('labelingStatsLabeled') }}
          </dt>
          <dd
            class="text-xl font-semibold text-white"
            data-testid="stat-labeled"
          >
            {{ stats.labeled }}
          </dd>
        </div>
        <div class="bg-slate-900 rounded-lg p-3 col-span-2">
          <dt class="text-xs text-slate-400">
            {{ $t('labelingStatsExcluded') }}
          </dt>
          <dd
            class="text-xl font-semibold text-white"
            data-testid="stat-excluded"
          >
            {{ stats.excludedByRights }}
          </dd>
        </div>
      </dl>

      <div>
        <h3 class="text-sm font-medium text-slate-300 mb-2">
          {{ $t('labelingStatsByAnswer') }}
        </h3>
        <ul class="space-y-1 text-sm">
          <li
            v-for="row in answerRows"
            :key="row.key"
            class="flex justify-between gap-3 text-slate-300"
          >
            <span>{{ $t(row.label) }}</span>
            <span class="text-white tabular-nums">{{ row.count }}</span>
          </li>
        </ul>
      </div>

      <div v-if="stats.rights?.length">
        <h3 class="text-sm font-medium text-slate-300 mb-2">
          {{ $t('labelingRightsTitle') }}
        </h3>
        <ul
          class="divide-y divide-slate-700 border border-slate-700 rounded-lg"
          data-testid="labeling-rights"
        >
          <li
            v-for="right in stats.rights"
            :key="right.host"
          >
            <details class="group">
              <summary
                class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 cursor-pointer text-sm text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
              >
                <span class="break-all font-medium">{{ right.host }}</span>
                <span class="flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="statusClass(right.status)"
                  >{{ statusLabel(right.status) }}</span>
                  <span class="text-xs text-slate-400">{{ formatDate(right.checkedAt) }}</span>
                </span>
              </summary>
              <div class="px-3 pb-3 text-xs text-slate-400 space-y-1">
                <p v-if="right.platform">
                  {{ right.platform }}
                </p>
                <p class="font-medium text-slate-300">
                  {{ $t('labelingRightsEvidence') }}
                </p>
                <ul class="list-disc pl-4 space-y-1">
                  <li
                    v-for="(line, index) in right.evidence ?? []"
                    :key="index"
                    class="break-words"
                  >
                    {{ line }}
                  </li>
                </ul>
              </div>
            </details>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import type { LabelingStats } from '~/composables/useLabelingApi'

const props = defineProps<{
  stats: LabelingStats | null
  failed?: boolean
}>()

const { t, locale } = useI18n()

const answerRows = computed(() => [
  { key: 'same_item', label: 'labelingSameItem', count: props.stats?.byLabel?.same_item ?? 0 },
  { key: 'same_model_other_variant', label: 'labelingSameModel', count: props.stats?.byLabel?.same_model_other_variant ?? 0 },
  { key: 'different', label: 'labelingDifferent', count: props.stats?.byLabel?.different ?? 0 },
  { key: 'unsure', label: 'labelingUnsure', count: props.stats?.byLabel?.unsure ?? 0 },
])

function statusLabel(status: string) {
  const key = { allowed: 'labelingRightsAllowed', revoked: 'labelingRightsRevoked', unknown: 'labelingRightsUnknown' }[status.toLowerCase()]
  return key ? t(key) : status
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case 'allowed': return 'bg-emerald-900 text-emerald-200'
    case 'revoked': return 'bg-red-900 text-red-200'
    default: return 'bg-slate-700 text-slate-200'
  }
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale.value)
}
</script>
