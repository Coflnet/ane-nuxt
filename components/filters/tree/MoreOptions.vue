<template>
  <div class="mt-4">
    <p class="mb-2 text-xs uppercase tracking-wide text-slate-400">
      {{ $t('filterTree.more.title') }}
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="entry in entries"
        :key="entry.id"
        type="button"
        :data-testid="`more-${entry.id}`"
        class="min-h-10 rounded-lg border border-dashed px-3 py-1.5 text-sm"
        :class="open.has(entry.id) ? 'border-indigo-400 text-indigo-200' : 'border-slate-500 text-slate-300 hover:border-slate-400'"
        :aria-expanded="entry.id === 'photo' ? undefined : open.has(entry.id)"
        @click="onEntry(entry.id)"
      >
        {{ entry.label }}
      </button>
      <FiltersSuggestFilterDialog
        :context="suggestContext"
        opener-class="min-h-10 rounded-lg border border-dashed border-slate-500 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-400"
      />
    </div>

    <div
      v-show="open.has('keywords')"
      class="mt-4"
    >
      <FiltersWhitelistFilter v-model="model.keywords" />
    </div>
    <div
      v-show="open.has('fuzzy')"
      class="mt-4"
    >
      <FiltersFuzzyFilter :model-value="model" />
    </div>
    <div
      v-if="kleinanzeigenOptions"
      v-show="open.has('kleinanzeigen')"
      class="mt-4"
    >
      <FiltersKleinanzeigenCategoryFilter
        :filter="model"
        :options="kleinanzeigenOptions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClientModelStringStringKeyValuePair as StringStringKeyValuePair } from '~/src/api-client'
import type { Filter } from '~/types/FilterType'

type EntryId = 'keywords' | 'fuzzy' | 'photo' | 'kleinanzeigen'

const model = defineModel<Filter>({ required: true })
const props = defineProps<{
  kleinanzeigenOptions?: StringStringKeyValuePair[] | null
  photoOpen: boolean
  suggestContext: { searchTerm: string, filterNames: string[] }
}>()
const emit = defineEmits<{ (e: 'open-photo'): void }>()

const { t } = useI18n()
const open = reactive(new Set<EntryId>())

const entries = computed(() => [
  { id: 'keywords' as const, label: t('filterTree.more.mustInclude') },
  { id: 'fuzzy' as const, label: t('filterTree.more.spelling') },
  ...(props.photoOpen ? [] : [{ id: 'photo' as const, label: t('filterTree.more.referencePhoto') }]),
  ...(props.kleinanzeigenOptions ? [{ id: 'kleinanzeigen' as const, label: t('filterTree.more.kleinanzeigenCategory') }] : []),
])

function onEntry(id: EntryId) {
  if (id === 'photo') {
    emit('open-photo')
    return
  }
  if (open.has(id)) open.delete(id)
  else open.add(id)
}

// Sections that already hold a value (edit, prefill) start open.
// Sections that already hold a value (edit, prefill) start open; separate sources so a
// collapsed section is not reopened by every edit of its value.
const openWhenSet = (id: EntryId, hasValue: () => boolean) =>
  watch(hasValue, (set) => { if (set) open.add(id) }, { immediate: true })
openWhenSet('keywords', () => model.value.keywords.some(group => group.length > 0))
openWhenSet('fuzzy', () => model.value.fuzzyness !== '0')
openWhenSet('kleinanzeigen', () => !!model.value.kleinanzeigenCategory)
</script>
