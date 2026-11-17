<template>
  <div
    v-if="keys.length"
    class="mt-3 space-y-2"
    data-testid="attribute-chips"
  >
    <div
      v-for="key in visibleKeys"
      :key="key"
      role="group"
      :aria-label="keyLabel(key)"
      class="flex flex-wrap items-center gap-2"
    >
      <span class="w-full text-xs text-slate-400 sm:w-24">{{ keyLabel(key) }}</span>
      <button
        v-for="chip in chipsFor(key)"
        :key="chip.value"
        type="button"
        class="min-h-9 rounded-full px-3 py-1 text-sm"
        :class="chip.selected ? 'bg-indigo-600 text-white' : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-blue-500/20'"
        :aria-pressed="chip.selected"
        :disabled="!chip.selected && !canAdd(key, chip.value)"
        :title="chip.count != null ? $t('filterTree.chips.catalogueCount', { count: chip.count }) : undefined"
        @click="toggle(key, chip.value)"
      >
        {{ chip.value }}
        <span
          v-if="chip.count != null"
          class="ml-1 text-xs opacity-70"
        >{{ chip.count }}</span>
      </button>
    </div>
    <button
      v-if="hiddenCount > 0"
      type="button"
      class="text-sm text-indigo-300 underline"
      :aria-expanded="showAll"
      @click="showAll = !showAll"
    >
      {{ showAll ? $t('filterTree.chips.less') : $t('filterTree.chips.more', { count: hiddenCount }) }}
    </button>
    <p class="text-xs text-slate-500">
      {{ $t('filterTree.chips.countsHint') }}
    </p>
    <p
      v-if="limitReached"
      class="text-xs text-amber-300"
      role="status"
    >
      {{ $t('filterTree.chips.limitHint') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ServicesProductServiceFilterBucket as FilterBucket } from '~/src/api-client/types.gen'
import { TITLE_ATTRIBUTE_KEYS, canAddValue, isAttributeSelected, toggleAttribute } from '~/utils/attributeAlternatives'

const MAX_VISIBLE_KEYS = 3

const selection = defineModel<Record<string, string[]>>({ required: true })
const props = defineProps<{ buckets: Record<string, FilterBucket[]> }>()

const { t, te } = useI18n()
const showAll = ref(false)

const keys = computed(() => TITLE_ATTRIBUTE_KEYS.filter(key => props.buckets[key]?.length || selection.value[key]?.length))
const visibleKeys = computed(() => (showAll.value ? keys.value : keys.value.slice(0, MAX_VISIBLE_KEYS)))
const hiddenCount = computed(() => Math.max(0, keys.value.length - MAX_VISIBLE_KEYS))

function keyLabel(key: string) {
  const path = `filterTree.attributes.${key}`
  return te(path) ? t(path) : key
}

/** Bucket values plus selected values the current buckets do not list (e.g. from a saved filter). */
function chipsFor(key: string) {
  const buckets = props.buckets[key] ?? []
  const chips = buckets.map(bucket => ({ value: bucket.value ?? '', count: bucket.count ?? null, selected: isAttributeSelected(selection.value, key, bucket.value ?? '') }))
  const extra = (selection.value[key] ?? []).filter(value => !buckets.some(bucket => isAttributeSelected({ [key]: [value] }, key, bucket.value ?? '')))
  return [...chips, ...extra.map(value => ({ value, count: null, selected: true }))]
}

function canAdd(key: string, value: string) {
  return canAddValue(selection.value, key, value)
}

const limitReached = computed(() => keys.value.some(key => chipsFor(key).some(chip => !chip.selected && !canAdd(key, chip.value))))

function toggle(key: string, value: string) {
  selection.value = toggleAttribute(selection.value, key, value)
}
</script>
