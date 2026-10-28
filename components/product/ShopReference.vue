<template>
  <details
    class="min-w-0 rounded-3xl border border-slate-800 bg-slate-900 p-3 sm:p-6 space-y-4"
    data-testid="shop-reference"
  >
    <summary class="min-h-11 cursor-pointer py-2 text-xl font-bold text-white">
      {{ t('product.shopReference.title') }}
    </summary>
    <p class="text-sm text-slate-400">
      {{ t('product.shopReference.help') }}
    </p>
    <form
      class="flex flex-col sm:flex-row gap-2"
      @submit.prevent="loadPreview"
    >
      <label class="min-w-0 flex-1 text-sm text-slate-300">
        {{ t('product.shopReference.url') }}
        <input
          v-model="url"
          type="url"
          required
          :disabled="loading"
          class="mt-1 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 text-white"
          placeholder="https://shop.example/item"
          @input="clearPreview"
        >
      </label>
      <button
        type="submit"
        :disabled="loading || !referenceWebUrl(url)"
        class="min-h-11 self-stretch sm:self-end rounded-lg bg-indigo-600 px-4 text-white disabled:opacity-50"
      >
        {{ t(loading ? 'product.shopReference.loading' : 'product.shopReference.fetch') }}
      </button>
    </form>
    <p
      v-if="error"
      role="alert"
      class="text-sm text-rose-300"
    >
      {{ error }}
    </p>
    <div
      v-if="preview"
      class="min-w-0 space-y-3"
    >
      <a
        v-if="referenceWebUrl(preview.url)"
        :href="referenceWebUrl(preview.url)!"
        target="_blank"
        rel="noopener noreferrer"
        class="flex min-h-11 min-w-0 items-center text-indigo-300 [overflow-wrap:anywhere]"
      >{{ preview.listing.title || preview.host }} · {{ preview.host }}</a>
      <p class="text-xs text-slate-400">
        {{ t('product.shopReference.observed') }} <time :datetime="observedAt">{{ new Date(observedAt).toLocaleString(locale) }}</time>
      </p>
      <label
        v-if="candidates.length"
        class="block text-sm text-slate-300"
      >
        {{ t('product.shopReference.choosePrice') }}
        <select
          v-model="selectedSelector"
          class="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-slate-600 bg-slate-800 px-3 text-white"
        >
          <option value="">{{ t('product.shopReference.choosePrice') }}</option>
          <option
            v-for="candidate in candidates"
            :key="candidate.selector"
            :value="candidate.selector"
          >{{ candidate.text }} · {{ formatHistoryPrice(candidate.price, parseHistoryCurrency(candidate.currency), locale) }}</option>
        </select>
      </label>
      <p
        v-else
        role="status"
        class="text-sm text-amber-300"
      >
        {{ t('product.shopReference.noPrices') }}
      </p>
      <div
        v-if="selectedPrice"
        class="space-y-3"
      >
        <label class="block text-sm text-slate-300">
          {{ t('product.shopReference.currency') }}
          <input
            v-model="currencyLabel"
            maxlength="3"
            class="mt-1 block min-h-11 w-28 rounded-lg border border-slate-600 bg-slate-800 px-3 uppercase text-white"
          >
          <span class="mt-1 block text-xs text-slate-400">{{ t('product.shopReference.currencyHelp') }}</span>
        </label>
        <p class="font-semibold text-white">
          {{ t('product.shopReference.shopAmount') }}: {{ formatHistoryPrice(selectedPrice.price, currency, locale) }} <span v-if="!currency">({{ t('product.shopReference.unknownCurrency') }})</span>
        </p>
        <p class="text-sm text-slate-400">
          {{ t('product.shopReference.shopCondition') }}: {{ preview.listing.condition || t('product.shopReference.unknown') }}
        </p>
        <template v-if="lowestOffer">
          <p class="text-sm text-slate-300">
            {{ t('product.shopReference.loadedAmount') }}: {{ formatHistoryPrice(lowestOffer.price!, currency, locale) }}
          </p>
          <a
            v-if="referenceWebUrl(lowestOffer.listingUrl || '')"
            :href="referenceWebUrl(lowestOffer.listingUrl || '')!"
            target="_blank"
            rel="noopener noreferrer"
            class="flex min-h-11 min-w-0 items-center text-indigo-300 [overflow-wrap:anywhere]"
          >{{ lowestOffer.title || t('product.shopReference.openOffer') }}</a>
          <p class="text-sm text-slate-400">
            {{ t('product.shopReference.offerCondition') }}: {{ lowestOffer.condition || t('product.shopReference.unknown') }}
          </p>
          <label class="flex min-h-11 items-start gap-3 py-2 text-sm text-slate-300">
            <input
              v-model="confirmed"
              type="checkbox"
              class="mt-1 h-5 w-5 shrink-0"
            >
            <span>{{ t('product.shopReference.confirm') }}</span>
          </label>
          <p
            v-if="confirmed"
            class="font-semibold text-white"
            data-testid="shop-reference-gap"
          >
            {{ t('product.shopReference.gap') }}: {{ formatHistoryPrice(selectedPrice.price - lowestOffer.price!, currency, locale) }}
          </p>
        </template>
        <p
          v-else
          role="status"
          class="text-sm text-amber-300"
        >
          {{ t('product.shopReference.noComparable') }}
        </p>
      </div>
      <p class="text-xs text-slate-400">
        {{ t('product.shopReference.limits') }}
      </p>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { client as apiClient } from '~/src/api-client/client.gen'
import { formatHistoryPrice, parseHistoryCurrency } from '~/utils/priceHistory'
import { lowestSameCurrencyOffer, referenceWebUrl, type ShopOffer, type ShopPreview } from '~/utils/shopReference'

const props = defineProps<{ offers: ShopOffer[] }>()
const { t, locale } = useI18n()
const url = ref('')
const loading = ref(false)
const error = ref('')
const preview = ref<ShopPreview | null>(null)
const observedAt = ref('')
const selectedSelector = ref('')
const currencyLabel = ref('')
const confirmed = ref(false)
const candidates = computed(() => preview.value?.priceCandidates.filter(candidate => Number.isFinite(candidate.price) && candidate.price > 0) ?? [])
const selectedPrice = computed(() => candidates.value.find(candidate => candidate.selector === selectedSelector.value))
const currency = computed(() => parseHistoryCurrency(currencyLabel.value))
const lowestOffer = computed(() => lowestSameCurrencyOffer(props.offers, currency.value))
watch(selectedPrice, (candidate) => {
  currencyLabel.value = candidate?.currency ?? ''
})
watch([selectedPrice, currencyLabel, lowestOffer], () => {
  confirmed.value = false
})

function clearPreview() {
  preview.value = null
  selectedSelector.value = ''
  confirmed.value = false
}

async function loadPreview() {
  if (loading.value || !referenceWebUrl(url.value)) return
  loading.value = true
  error.value = ''
  clearPreview()
  try {
    const endpoint = new URL('/api/reference-listings/preview', apiClient.getConfig().baseURL ?? 'https://ane.coflnet.com').toString()
    const result = await $fetch<ShopPreview>(endpoint, { method: 'POST', body: { url: url.value.trim(), locale: locale.value === 'de' ? 'de-DE' : 'en-US' } })
    if (!result || !referenceWebUrl(result.url) || typeof result.host !== 'string' || typeof result.listing?.title !== 'string'
      || !Array.isArray(result.priceCandidates) || result.priceCandidates.some(candidate => !candidate
        || typeof candidate.selector !== 'string' || typeof candidate.text !== 'string' || typeof candidate.price !== 'number' || typeof candidate.currency !== 'string'))
      throw new Error('Invalid price preview')
    preview.value = result
    observedAt.value = new Date().toISOString()
  }
  catch {
    error.value = t('product.shopReference.error')
  }
  finally { loading.value = false }
}
</script>
