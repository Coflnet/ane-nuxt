import { computed, reactive } from 'vue'
import type { Ref } from 'vue'
import type { Filter } from '~/types/FilterType'
import { condidtion, deliveryKind, marketplaces } from '~/constants/CreateFilterConstants'
import { DEFAULT_FILTER_COUNTRY, isAnyChoice } from '~/utils/filterWire'
import { useFormat } from '~/composable/useFormat'

export type BranchId = 'looking' | 'condition' | 'price' | 'where' | 'notify'
export type SourceKind = 'listing' | 'photo' | 'search'
export interface BranchTag { label: string, tone: 'blue' | 'purple' | 'slate' }

const COUNTRY_LABELS: Record<string, string> = {
  EU: 'europe', US: 'unitedStates', CA: 'canada', GB: 'unitedKingdom', DE: 'germany', FR: 'france',
  IT: 'italy', JP: 'japan', NL: 'netherlands', AU: 'australia',
}

const SOURCE_TONES: Record<SourceKind, BranchTag['tone']> = { listing: 'blue', search: 'blue', photo: 'purple' }

/** One-line answers, "decided" dots and source tags for the branches of the filter tree. */
export function useFilterTreeAnswers(filter: Ref<Filter>, options: { hasPhoto: () => boolean, notifyDerived: () => boolean }) {
  const { t, locale } = useI18n()
  const { formatCurrency } = useFormat()
  const sources = reactive<Partial<Record<BranchId, { kind: SourceKind, snapshot: string }>>>({})

  const price = (value: number) => formatCurrency(value, filter.value.referenceCurrency || 'EUR', locale.value)
  const labelOf = (options: { value: string, label: string }[], value: string) => t(options.find(o => o.value === value)?.label ?? value)

  function lookingAnswer(f: Filter): string {
    const chips = Object.values(f.attributes).flat()
    const what = [f.searchValue.trim(), ...chips].filter(Boolean).join(', ')
    if (what) return what
    return options.hasPhoto() ? t('filterTree.looking.photoOnly') : t('filterTree.looking.empty')
  }

  function conditionAnswer(f: Filter): string {
    if (isAnyChoice(f.condition)) return t('filterTree.condition.any')
    return f.condition.split(',').map(value => labelOf(condidtion, value)).join(', ')
  }

  function priceAnswer(f: Filter): string {
    if (f.minPrice === '' && f.maxPrice === '') return t('filterTree.price.any')
    if (f.maxPrice === 0) return t('filterTree.price.freeOnly')
    if (f.minPrice === '') return t('filterTree.price.upTo', { max: price(Number(f.maxPrice)) })
    if (f.maxPrice === '') return t('filterTree.price.from', { min: price(Number(f.minPrice)) })
    return `${price(Number(f.minPrice))} – ${price(Number(f.maxPrice))}`
  }

  function marketplaceAnswer(f: Filter): string {
    if (f.marketplace === 'all' || !f.marketplace) return t('filterTree.where.allFree')
    return f.marketplace.split(',').map(value => labelOf(marketplaces, value)).join(', ')
  }

  function whereAnswer(f: Filter): string {
    const country = f.country === DEFAULT_FILTER_COUNTRY ? t('filterTree.where.anyCountry') : f.country.split(',').map(code => t(COUNTRY_LABELS[code] ?? code)).join(', ')
    const delivery = isAnyChoice(f.deliveryMethod) ? t('filterTree.where.anyDelivery') : f.deliveryMethod.split(',').map(value => labelOf(deliveryKind, value)).join(', ')
    const near = f.zipcode ? t('filterTree.where.near', { zip: f.zipcode, radius: f.searchRadius ?? 0 }) : ''
    return [marketplaceAnswer(f), country, delivery, near].filter(Boolean).join(' · ')
  }

  function notifyAnswer(f: Filter): string {
    switch (f.notificationType) {
      case 'Email': return f.notificationTarget ? `${t('email')} · ${f.notificationTarget}` : t('email')
      case 'DiscordWebhook': return 'Discord'
      case 'FireBase': return t('pushNotifications')
      default: return t('filterTree.notify.none')
    }
  }

  const answers = computed<Record<BranchId, string>>(() => ({
    looking: lookingAnswer(filter.value),
    condition: conditionAnswer(filter.value),
    price: priceAnswer(filter.value),
    where: whereAnswer(filter.value),
    notify: notifyAnswer(filter.value),
  }))

  const decided = computed<Record<BranchId, boolean>>(() => {
    const f = filter.value
    return {
      looking: !!f.searchValue.trim() || options.hasPhoto(),
      condition: !isAnyChoice(f.condition),
      price: f.minPrice !== '' || f.maxPrice !== '',
      where: !(f.marketplace === 'all' && f.country === DEFAULT_FILTER_COUNTRY && isAnyChoice(f.deliveryMethod) && !f.zipcode),
      notify: f.notificationType !== 'Unknown',
    }
  })

  function sourceTag(branch: BranchId): BranchTag | null {
    const source = sources[branch]
    if (!source || source.snapshot !== answers.value[branch]) return null
    return { label: t(`filterTree.tag.${source.kind}`), tone: SOURCE_TONES[source.kind] }
  }

  function tag(branch: BranchId): BranchTag | null {
    const fromSource = sourceTag(branch)
    if (fromSource) return fromSource
    if (branch === 'looking' && options.hasPhoto()) return { label: t('filterTree.tag.photo'), tone: 'purple' }
    if (branch === 'notify' && options.notifyDerived()) return { label: t('filterTree.tag.settings'), tone: 'slate' }
    return decided.value[branch] ? null : { label: t('filterTree.tag.default'), tone: 'slate' }
  }

  /** Tags a branch "from listing/photo/search" until the user changes its answer. */
  function markSource(branch: BranchId, kind: SourceKind) {
    sources[branch] = { kind, snapshot: answers.value[branch] }
  }

  return { answers, decided, tag, markSource }
}
