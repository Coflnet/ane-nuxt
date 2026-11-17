<template>
  <div>
    <button
      v-if="model.referenceUrl && !preview"
      type="button"
      class="mb-4 text-sm text-indigo-300 underline disabled:opacity-50"
      :disabled="loadingReference"
      @click="$emit('load-reference')"
    >
      {{ $t('filterTree.price.loadFromListing') }}
    </button>
    <div
      v-if="preview?.priceCandidates.length"
      class="mb-4"
      data-testid="price-candidates"
    >
      <p class="mb-2 text-sm text-slate-300">
        {{ $t('filterTree.price.fromListing') }}
      </p>
      <p
        v-if="askWhichPrice"
        class="mb-2 text-sm font-medium text-amber-300"
        data-testid="price-choice-hint"
      >
        {{ $t('filterTree.price.whichOne') }}
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="candidate in candidates"
          :key="candidate.selector"
          type="button"
          class="min-h-9 rounded-full px-3 py-1 text-sm"
          :class="isChecked(candidate.selector) ? 'bg-green-500/20 text-green-300 ring-1 ring-green-400/60' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
          :aria-pressed="isChecked(candidate.selector)"
          @click="toggle(candidate.selector)"
        >
          {{ candidate.text }} · <span class="text-green-400">{{ format(candidate.price, candidate.currency) }}</span>
        </button>
      </div>
      <p
        v-if="checked.length"
        class="mt-2 text-sm text-slate-300"
      >
        {{ $t('filterTree.price.total') }}
        <span class="font-semibold text-green-400">{{ format(total, model.referenceCurrency) }}</span>
      </p>
      <button
        type="button"
        class="mt-2 text-sm text-indigo-300 underline"
        :aria-expanded="picking"
        @click="picking = !picking"
      >
        {{ $t('filterTree.price.pickOnPage') }}
      </button>
      <FiltersReferenceListingImport
        v-if="picking"
        v-model="model"
        class="mt-3"
        :seed-preview="preview"
      />
    </div>

    <FiltersPriceConditionFilter
      v-model="model"
      :min-label="$t('filterTree.price.min')"
      :max-label="$t('filterTree.price.max')"
      :any-placeholder="$t('filterTree.price.anyPlaceholder')"
    />
  </div>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'
import type { ReferenceListingPreviewResponse } from '~/types/ReferenceListing'
import { appliedSelectors, applyReferencePrices, displayPriceCandidates, needsPriceChoice, referenceTotal } from '~/utils/referencePreview'
import { useFormat } from '~/composable/useFormat'

const model = defineModel<Filter>({ required: true })
const props = defineProps<{
  preview: ReferenceListingPreviewResponse | null
  loadingReference?: boolean
}>()
defineEmits<{ (e: 'load-reference'): void }>()

const { locale } = useI18n()
const { formatCurrency } = useFormat()
const picking = ref(false)

const checked = computed(() => appliedSelectors(model.value))
const candidates = computed(() => (props.preview ? displayPriceCandidates(props.preview, checked.value) : []))
const askWhichPrice = computed(() => !!props.preview && needsPriceChoice(props.preview, checked.value))
const total = computed(() => (props.preview ? referenceTotal(props.preview, checked.value) : 0))

function format(value: number, currency?: string) {
  return formatCurrency(value, currency || 'EUR', locale.value)
}

function isChecked(selector: string) {
  return checked.value.includes(selector)
}

function toggle(selector: string) {
  if (!props.preview) return
  const next = isChecked(selector) ? checked.value.filter(s => s !== selector) : [...checked.value, selector]
  applyReferencePrices(model.value, props.preview, next)
}
</script>
