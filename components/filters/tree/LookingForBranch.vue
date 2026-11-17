<template>
  <div>
    <FiltersTreeSearchOmnibox
      ref="omnibox"
      v-model="model.searchValue"
      @import-url="$emit('import-url', $event)"
      @open-photo="$emit('open-photo')"
    />

    <p
      v-if="interpretation"
      class="mt-2 text-sm text-slate-400"
      data-testid="interpretation"
      aria-live="polite"
    >
      {{ interpretationText }}
    </p>

    <slot />

    <FiltersTreeAttributeChips
      v-if="attributesSupported"
      v-model="model.attributes"
      :buckets="interpretation?.buckets ?? {}"
    />

    <FiltersKeywordFilter
      class="mt-4"
      :model-value="model.blacklist"
      :label="$t('filterTree.looking.neverInclude')"
      :footer="$t('addblacklistKeywords')"
      :place-holder="$t('addBlackListPressEnter')"
    />

    <FiltersTreeMoreOptions
      v-model="model"
      :kleinanzeigen-options="kleinanzeigenOptions"
      :photo-open="photoOpen"
      :suggest-context="suggestContext"
      @open-photo="$emit('open-reference-photo')"
    />
  </div>
</template>

<script setup lang="ts">
import type { ClientModelStringStringKeyValuePair as StringStringKeyValuePair } from '~/src/api-client'
import type { FilterInterpretation } from '~/composables/useFilterInterpretation'
import type { Filter } from '~/types/FilterType'

const model = defineModel<Filter>({ required: true })
const props = defineProps<{
  interpretation: FilterInterpretation | null
  attributesSupported: boolean
  kleinanzeigenOptions?: StringStringKeyValuePair[] | null
  photoOpen: boolean
  suggestContext: { searchTerm: string, filterNames: string[] }
}>()
defineEmits<{
  (e: 'import-url', url: string): void
  (e: 'open-photo' | 'open-reference-photo'): void
}>()

const { t } = useI18n()
const omnibox = ref<{ focus: () => void } | null>(null)

const interpretationText = computed(() => {
  const info = props.interpretation
  if (!info) return ''
  return info.category
    ? t('filterTree.looking.understoodIn', { name: info.name, category: info.category })
    : t('filterTree.looking.understood', { name: info.name })
})

defineExpose({ focus: () => omnibox.value?.focus() })
</script>
