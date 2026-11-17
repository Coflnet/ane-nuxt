<template>
  <!-- Price range and budget currency; the condition lives in ConditionFilter.vue. -->
  <div class="grid grid-cols-2 gap-x-4">
    <div class="flex items-end mb-4 gap-2 col-span-2">
      <UiInput
        v-model="model!.minPrice"
        label-aria="Min Price Input"
        :label="minLabel"
        type="number"
        :placeholder="anyPlaceholder"
      />
      <span class="text-slate-400 pb-2.5">-</span>
      <UiInput
        v-model="model!.maxPrice"
        label-aria="Max Price Input"
        :label="maxLabel"
        type="number"
        :placeholder="anyPlaceholder"
      />
    </div>
    <div class="col-span-2">
      <UiDropdown
        id="budget-currency"
        v-model="budgetCurrency"
        :options="currencyOptions"
        :label="$t('budgetCurrency')"
        :disabled="hasReferencePrice"
        :disabled-string="$t('budgetReferenceCurrencyNote')"
      />
      <p class="mt-2 text-sm text-slate-400">
        {{ $t('budgetCurrencyNote', { currency: budgetCurrency }) }}
        <span v-if="hasReferencePrice">{{ $t('budgetReferenceCurrencyNote') }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang='ts'>
import type { Filter } from '~/types/FilterType'

const model = defineModel<Filter>()
defineProps<{ minLabel?: string, maxLabel?: string, anyPlaceholder?: string }>()

const hasReferencePrice = computed(() => !!model.value!.referenceUrl && model.value!.referencePrice > 0)
const budgetCurrency = computed({
  get: () => model.value!.referenceCurrency || 'EUR',
  set: (currency: string) => { if (!hasReferencePrice.value) model.value!.referenceCurrency = currency },
})
const currencyOptions = computed(() => [...new Set(['EUR', 'GBP', 'SEK', 'PLN', budgetCurrency.value])]
  .map(value => ({ value, label: value })))

watch(() => model.value!.marketplace, (marketplace) => {
  // Only the first unambiguous choice on a new alert supplies a default; explicit and saved currencies win.
  if (model.value!.id || model.value!.referenceCurrency || hasReferencePrice.value) return
  const currency = ({ Gumtree: 'GBP', Blocket: 'SEK', OLX: 'PLN' } as Record<string, string>)[marketplace]
  if (currency) model.value!.referenceCurrency = currency
}, { immediate: true })
</script>
