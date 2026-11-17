<template>
  <li class="relative pl-7">
    <span
      class="absolute left-[3px] top-1 size-3 rounded-full border-2 border-indigo-400 bg-indigo-600"
      aria-hidden="true"
    />
    <div class="rounded-xl bg-slate-800 p-3 sm:p-4">
      <p class="text-xs uppercase tracking-wide text-slate-400">
        {{ $t('filterTree.summary.title') }}
      </p>
      <p
        class="mt-1 text-slate-100"
        data-testid="filter-summary"
        aria-live="polite"
      >
        {{ sentence }}
      </p>
      <FiltersCreateConfirmCreation
        :is-new-filter="isNewFilter"
        :saving="saving"
        :disabled="disabled"
      />
    </div>
  </li>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'
import { condidtion, marketplaces } from '~/constants/CreateFilterConstants'
import { isAnyChoice } from '~/utils/filterWire'
import { useFormat } from '~/composable/useFormat'
import { radiusSummary, type RadiusSummary } from '~/utils/radiusScope'

const props = defineProps<{
  filter: Filter
  hasPhoto: boolean
  isNewFilter: boolean
  saving: boolean
  disabled: boolean
}>()

const { t, locale } = useI18n()
const { formatCurrency } = useFormat()

const money = (value: number | '') => formatCurrency(Number(value), props.filter.referenceCurrency || 'EUR', locale.value)

function conditionPart(f: Filter): string {
  if (isAnyChoice(f.condition)) return ''
  return f.condition.split(',').filter(value => condidtion.some(o => o.value === value)).map(value => t(`filterTree.summary.condition.${value}`)).join('/')
}

function whatPart(f: Filter): string {
  const chips = Object.values(f.attributes).flat()
  const what = [f.searchValue.trim(), ...chips].filter(Boolean).join(', ')
  if (what) return what
  return props.hasPhoto ? t('filterTree.summary.photo') : t('filterTree.summary.anything')
}

function pricePart(f: Filter): string {
  if (f.minPrice === '' && f.maxPrice === '') return ''
  if (f.maxPrice === 0) return t('filterTree.price.freeOnly')
  if (f.minPrice === '') return t('filterTree.summary.under', { max: money(f.maxPrice) })
  if (f.maxPrice === '') return t('filterTree.summary.over', { min: money(f.minPrice) })
  return t('filterTree.summary.between', { min: money(f.minPrice), max: money(f.maxPrice) })
}

function wherePart(f: Filter): string {
  if (f.marketplace === 'all' || !f.marketplace) return t('filterTree.summary.allMarketplaces')
  const names = f.marketplace.split(',').map(value => t(marketplaces.find(o => o.value === value)?.label ?? value))
  return t('filterTree.summary.on', { marketplaces: names.join(', ') })
}

const NEAR_KEYS: Partial<Record<RadiusSummary, string>> = {
  everything: 'filterTree.summary.near',
  pickupOnly: 'filterTree.summary.pickupNear',
  pickupShippingAnywhere: 'filterTree.summary.pickupNearShippingAnywhere',
}

function nearPart(f: Filter): string {
  const key = NEAR_KEYS[radiusSummary(f.deliveryMethod, f.zipcode, f.radiusScope)]
  return key ? t(key, { radius: f.searchRadius ?? 0, zip: f.zipcode }) : ''
}

function notifyPart(f: Filter): string {
  switch (f.notificationType) {
    case 'Email': return t('filterTree.summary.byEmail')
    case 'DiscordWebhook': return t('filterTree.summary.byDiscord')
    case 'FireBase': return t('filterTree.summary.byPush')
    default: return ''
  }
}

const sentence = computed(() => {
  const f = props.filter
  const notify = notifyPart(f)
  const item = [conditionPart(f), whatPart(f)].filter(Boolean).join(' ')
  const head = [item, pricePart(f)].filter(Boolean).join(', ')
  const key = notify ? 'filterTree.summary.alert' : 'filterTree.summary.collect'
  // The notification channel comes before the radius so it never reads as part of "shipping from anywhere".
  return t(key, { what: [head, wherePart(f), notify, nearPart(f)].filter(Boolean).join(' ') })
})
</script>
