<template>
  <section
    class="rounded-xl bg-slate-800 p-4"
    aria-labelledby="matching-offers-title"
    data-testid="matching-offers"
  >
    <h2
      id="matching-offers-title"
      class="text-lg font-semibold text-white"
    >
      {{ $t('filterTree.offers.title') }}
    </h2>

    <div aria-live="polite">
      <p
        v-if="!enabled"
        class="mt-2 text-sm text-slate-400"
      >
        {{ $t('filterTree.offers.idle') }}
      </p>
      <p
        v-else-if="loading"
        class="mt-2 flex items-center gap-2 text-sm text-slate-300"
      >
        <UiIcon name="svg-spinners:90-ring-with-bg" />
        {{ $t('filterTree.offers.loading') }}
      </p>
      <p
        v-else-if="error"
        class="mt-2 text-sm text-rose-300"
        role="alert"
      >
        {{ $t('filterTree.offers.error') }}
        <button
          type="button"
          class="underline"
          @click="$emit('retry')"
        >
          {{ $t('retry') }}
        </button>
      </p>
      <p
        v-else-if="done"
        class="mt-2 text-sm text-slate-300"
        data-testid="matching-offers-count"
      >
        {{ countText }}
      </p>
    </div>

    <ul
      v-if="enabled && offers.length"
      class="mt-3 divide-y divide-slate-700"
    >
      <li
        v-for="offer in offers.slice(0, MAX_ROWS)"
        :key="`${offer.platform}-${offer.id}`"
        class="flex items-center gap-3 py-2"
      >
        <a
          :href="listingStore.constructListingUrl(offer, locale) ?? undefined"
          target="_blank"
          rel="noopener noreferrer"
          class="flex min-w-0 flex-1 items-center gap-3 hover:opacity-90"
        >
          <img
            v-if="offer.imageUrls?.[0]"
            :src="offer.imageUrls[0]"
            :alt="offer.title ?? ''"
            loading="lazy"
            class="size-12 shrink-0 rounded-lg bg-slate-700 object-cover"
          >
          <span
            v-else
            class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-700"
          >
            <UiIcon name="tabler:photo-off" />
          </span>
          <span class="min-w-0">
            <span class="line-clamp-2 text-sm text-slate-100">{{ offer.title }}</span>
            <span class="text-sm">
              <span class="font-semibold text-green-400">{{ formatCurrency(offer.price ?? 0, offer.currency ?? '', locale) }}</span>
              <span class="text-slate-400"> · {{ offer.platform }}</span>
            </span>
          </span>
        </a>
        <div
          v-if="styleMode"
          class="flex shrink-0"
        >
          <button
            v-for="positive in [true, false]"
            :key="String(positive)"
            type="button"
            class="flex size-11 items-center justify-center rounded hover:bg-slate-700"
            :class="{ 'bg-indigo-700': feedbackChoice(offer) === positive }"
            :disabled="!canFeedback(offer)"
            :aria-label="positive ? $t('styleSearch.moreLike') : $t('styleSearch.notRelevant')"
            :title="positive ? $t('styleSearch.moreLike') : $t('styleSearch.notRelevant')"
            :aria-pressed="feedbackChoice(offer) === positive"
            @click="$emit('feedback', offer, positive)"
          >
            <Icon
              :name="positive ? 'tabler:thumb-up' : 'tabler:thumb-down'"
              aria-hidden="true"
            />
          </button>
        </div>
      </li>
    </ul>

    <div
      v-if="showAboveMax"
      class="mt-4 border-t border-slate-700 pt-3"
      data-testid="above-max-offers"
    >
      <h3 class="text-sm font-semibold text-slate-300">
        {{ $t('filterTree.offers.aboveMaxTitle', { count: aboveMax.length }, aboveMax.length) }}
      </h3>
      <button
        v-if="raiseTo !== null"
        type="button"
        class="mt-1 text-sm text-indigo-300 underline"
        data-testid="raise-max"
        @click="$emit('raise-max', raiseTo)"
      >
        {{ $t('filterTree.offers.raiseMax', { price: formatCurrency(raiseTo, budgetCurrency, locale) }) }}
      </button>
      <ul class="mt-2 divide-y divide-slate-700">
        <li
          v-for="offer in aboveMax.slice(0, MAX_ROWS)"
          :key="`${offer.platform}-${offer.id}`"
          class="py-2"
        >
          <a
            :href="listingStore.constructListingUrl(offer, locale) ?? undefined"
            target="_blank"
            rel="noopener noreferrer"
            class="flex min-w-0 items-center gap-3 hover:opacity-90"
          >
            <span class="min-w-0">
              <span class="line-clamp-2 text-sm text-slate-300">{{ offer.title }}</span>
              <span class="text-sm">
                <span class="font-semibold text-slate-300">{{ formatCurrency(offerTotal(offer), offer.currency ?? '', locale) }}</span>
                <span class="text-slate-400"><template v-if="offerTotal(offer) !== (offer.price ?? 0)"> {{ $t('filterTree.offers.inclShipping') }}</template> · {{ $t('filterTree.offers.aboveMax') }} · {{ offer.platform }}</span>
              </span>
            </span>
          </a>
        </li>
      </ul>
    </div>

    <div
      v-if="styleMode"
      class="mt-2 space-y-1 text-sm text-slate-300"
    >
      <p v-if="feedbackPending">
        {{ $t('styleSearch.feedbackLoading') }}
      </p>
      <p
        v-if="feedbackFailed"
        role="alert"
      >
        {{ $t('styleSearch.feedbackError') }}
        <button
          type="button"
          class="underline"
          @click="$emit('retry-feedback')"
        >
          {{ $t('retry') }}
        </button>
      </p>
      <button
        v-if="exampleCount"
        type="button"
        class="underline"
        :disabled="feedbackPending"
        @click="$emit('clear-feedback')"
      >
        {{ $t('styleSearch.clearFeedback') }}
      </button>
      <p v-if="exampleCount >= 4">
        {{ $t('styleSearch.feedbackLimit') }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ClientModelStoredListing as StoredListing } from '~/src/api-client'
import { emptyStateKind, offerTotal, raiseMaxTo } from '~/utils/overCapOffers'
import { useFormat } from '~/composable/useFormat'

const MAX_ROWS = 4

const props = withDefaults(defineProps<{
  offers: StoredListing[]
  /** Recent offers above the filter's max price (shown muted, after the matches). */
  aboveMax?: StoredListing[]
  /** The filter's current max price and its budget currency (the raise action is in that currency). */
  maxPrice?: number | ''
  budgetCurrency?: string
  loading: boolean
  error: boolean
  done: boolean
  /** False while there is nothing to match yet. */
  enabled: boolean
  styleMode?: boolean
  feedbackPending?: boolean
  feedbackFailed?: boolean
  exampleCount?: number
  feedbackChoice?: (listing: StoredListing) => boolean | undefined
  canFeedback?: (listing: StoredListing) => boolean
}>(), {
  aboveMax: () => [],
  maxPrice: '',
  budgetCurrency: 'EUR',
  styleMode: false,
  exampleCount: 0,
  feedbackChoice: () => undefined,
  canFeedback: () => false,
})

defineEmits<{
  (e: 'raise-max', max: number): void
  (e: 'retry' | 'clear-feedback' | 'retry-feedback'): void
  (e: 'feedback', listing: StoredListing, positive: boolean): void
}>()

const { locale, t } = useI18n()
const raiseTo = computed(() => raiseMaxTo(props.aboveMax, props.maxPrice))
const showAboveMax = computed(() => props.enabled && props.done && !props.loading && !props.error && props.aboveMax.length > 0)
const countText = computed(() => {
  if (props.offers.length) return t('filterTree.offers.count', { count: props.offers.length }, props.offers.length)
  if (emptyStateKind(props.aboveMax.length) === 'emptyAboveMax') return t('filterTree.offers.emptyAboveMax', { count: props.aboveMax.length }, props.aboveMax.length)
  return t('filterTree.offers.empty')
})
const listingStore = useListingStore()
const { formatCurrency } = useFormat()
</script>
