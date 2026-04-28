<template>
  <div class="w-[340px] bg-gray-800/40 rounded-xl overflow-hidden shadow-lg border border-gray-700/30 hover:border-blue-500/30 transition-all duration-300 flex flex-col">
    <!-- Image -->
    <div class="relative h-[200px] bg-gray-900/50">
      <img
        v-if="primaryImageUrl"
        :src="primaryImageUrl"
        :alt="item.listing?.title ?? 'Flip'"
        class="w-full h-full object-contain"
      >
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-gray-500"
      >
        <Icon
          name="mdi:image-off"
          size="48"
        />
      </div>

      <!-- Profit Badge -->
      <div
        v-if="profit > 0"
        class="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg"
      >
        +{{ formattedProfit }}
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 flex flex-col flex-1">
      <div class="flex justify-between items-start mb-3 gap-2">
        <h3 class="text-white font-medium text-sm line-clamp-2 min-h-[2.5rem] flex-1">
          {{ item.listing?.title }}
        </h3>
        <div class="flex flex-col gap-1 shrink-0">
          <button
            class="w-7 h-7 rounded-md bg-gray-700/50 hover:bg-yellow-500/20 flex items-center justify-center transition-colors"
            :class="props.isBookmarked ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'"
            :title="props.isBookmarked ? 'Remove Bookmark' : 'Bookmark'"
            @click="emit('bookmark')"
          >
            <Icon
              :name="props.isBookmarked ? 'mdi:bookmark' : 'mdi:bookmark-outline'"
              size="14"
            />
          </button>
          <button
            v-if="props.showDelete"
            class="w-7 h-7 rounded-md bg-gray-700/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors"
            title="Delete Bookmark"
            @click="emit('delete')"
          >
            <Icon
              name="mdi:delete-outline"
              size="14"
            />
          </button>
          <button
            class="w-7 h-7 rounded-md bg-gray-700/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors"
            :disabled="reportSubmitting"
            title="Report Flip"
            @click="reportFlip"
          >
            <Icon
              :name="reportSubmitting ? 'mdi:loading' : 'mdi:flag-outline'"
              size="14"
              :class="{ 'animate-spin': reportSubmitting }"
            />
          </button>
          <button
            class="w-7 h-7 rounded-md bg-gray-700/50 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 flex items-center justify-center transition-colors"
            title="Show References"
            @click="showReferences = !showReferences"
          >
            <Icon
              name="mdi:format-list-bulleted"
              size="14"
            />
          </button>
        </div>
      </div>

      <div class="space-y-2 mb-4">
        <div class="flex justify-between items-center">
          <span class="text-gray-400 text-xs">{{ $t('product.listedPrice') }}</span>
          <span class="text-white font-bold text-lg">{{ formattedPrice }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-400 text-xs">{{ $t('product.marketValue') }}</span>
          <span class="text-green-400 font-semibold">{{ formattedMedian }}</span>
        </div>
      </div>

      <!-- Category & Location -->
      <div class="flex items-center gap-2 mb-4 text-xs text-gray-400 flex-wrap">
        <span
          v-if="item.foundAt"
          class="bg-gray-700/50 px-2 py-1 rounded"
        >
          {{ formatDistanceToNow(new Date(item.foundAt), { addSuffix: true, ...dateFnsLocale }) }}
        </span>
        <span
          v-if="listingLocation"
          class="bg-gray-700/50 px-2 py-1 rounded"
        >
          📍 {{ listingLocation }}
        </span>
      </div>

      <!-- References List -->
      <div
        v-if="showReferences && item.recentSells?.length"
        class="mb-4 bg-gray-900/50 rounded p-2 max-h-40 overflow-y-auto"
      >
        <div class="text-xs font-semibold text-gray-400 mb-2 border-b border-gray-700 pb-1">
          Found References ({{ item.recentSells.length }})
        </div>
        <div class="flex flex-col gap-2">
          <a
            v-for="(sell, idx) in item.recentSells"
            :key="idx"
            :href="getSellUrl(sell)"
            target="_blank"
            class="flex justify-between items-center text-xs hover:bg-gray-700/50 p-1 rounded"
          >
            <span
              class="text-blue-400 truncate max-w-[120px]"
              :title="sell.key ?? undefined"
            >{{ sell.key }}</span>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-green-400">{{ formatPrice(sell.price) }}</span>
              <span
                v-if="sell.date"
                class="text-gray-500"
              >{{ formatDistanceToNow(new Date(sell.date), { addSuffix: true, ...dateFnsLocale }) }}</span>
            </div>
          </a>
        </div>
      </div>

      <div class="mt-auto">
        <a
          :href="listingUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200 text-sm"
          @click="emit('click')"
        >
          {{ $t('product.viewDeal') }}
        </a>
      </div>
    </div>

    <!-- Report Dialog -->
    <Teleport to="body">
      <div
        v-if="showReportDialog"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="showReportDialog = false"
      >
        <div class="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
          <!-- Pre-submit: report form -->
          <template v-if="!reportId">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Icon
                  name="mdi:flag-outline"
                  size="24"
                  class="text-red-400"
                />
              </div>
              <h3 class="text-lg font-bold text-white">
                Report Flip
              </h3>
            </div>

            <!-- Current grouping -->
            <div
              v-if="currentSlug"
              class="mb-3"
            >
              <label class="text-xs text-gray-400 block mb-1">Current grouping</label>
              <div class="bg-gray-900/80 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono">
                {{ currentSlug }}
              </div>
            </div>

            <!-- Reason (required) -->
            <div class="mb-3">
              <label class="text-xs text-gray-400 block mb-1">Reason <span class="text-red-400">*</span></label>
              <textarea
                v-model="reportReason"
                rows="2"
                placeholder="e.g. Wrong product grouping, price is incorrect..."
                class="w-full bg-gray-900/80 border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                :class="reasonInvalid ? 'border-red-500' : 'border-gray-600'"
                @input="reasonInvalid = false"
              />
              <p
                v-if="reasonInvalid"
                class="text-xs text-red-400 mt-1"
              >
                Reason must be at least 5 characters
              </p>
            </div>

            <!-- Suggested slug input (optional) -->
            <div class="mb-4">
              <label class="text-xs text-gray-400 block mb-1">Suggest correct grouping slug (optional)</label>
              <input
                v-model="suggestedSlug"
                type="text"
                placeholder="e.g. nintendo-wii-lego-star-wars-used"
                class="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              >
            </div>

            <div class="flex gap-2">
              <button
                class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                @click="showReportDialog = false"
              >
                Cancel
              </button>
              <button
                :disabled="reportSubmitting"
                class="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                @click="submitReport"
              >
                {{ reportSubmitting ? 'Submitting...' : 'Submit Report' }}
              </button>
            </div>
          </template>

          <!-- Post-submit: confirmation -->
          <template v-else>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Icon
                  name="mdi:check"
                  size="24"
                  class="text-green-400"
                />
              </div>
              <h3 class="text-lg font-bold text-white">
                Report Submitted
              </h3>
            </div>
            <p class="text-gray-400 text-sm mb-4">
              Your report has been logged. Use the ID below for reference.
            </p>
            <div class="bg-gray-900/80 rounded-lg p-3 flex items-center justify-between mb-4">
              <code class="text-blue-400 font-mono text-lg tracking-wider">{{ reportId }}</code>
              <button
                class="text-gray-400 hover:text-white transition-colors px-2"
                title="Copy ID"
                @click="copyReportId"
              >
                <Icon
                  :name="copied ? 'mdi:check' : 'mdi:content-copy'"
                  size="18"
                />
              </button>
            </div>
            <button
              class="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              @click="closeReportDialog"
            >
              Close
            </button>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Flip, SoldFor, Platform } from '~/src/api-client/types.gen'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const dateFnsLocale = computed(() => locale.value === 'de' ? { locale: de } : {})

const API_BASE = 'https://ane.coflnet.com'
const userStore = useUserStore()

const props = defineProps<{
  item: Flip
  isBookmarked?: boolean
  showDelete?: boolean
}>()

const emit = defineEmits<{
  bookmark: []
  delete: []
  click: []
}>()

const profit = computed(() => props.item.potentialProfit ?? 0)
const primaryImageUrl = computed(() => props.item.listing?.imageUrls?.[0] ?? '')

const showReferences = ref(false)
const showReportDialog = ref(false)
const reportId = ref('')
const reportSubmitting = ref(false)
const copied = ref(false)
const suggestedSlug = ref('')
const reportReason = ref('')
const reasonInvalid = ref(false)

const currentSlug = computed(() => {
  const sells = props.item.recentSells
  return sells?.[0]?.key ?? ''
})

const reportFlip = () => {
  reportId.value = ''
  suggestedSlug.value = ''
  reportReason.value = ''
  reasonInvalid.value = false
  showReportDialog.value = true
}

const submitReport = async () => {
  if (reportReason.value.trim().length < 5) {
    reasonInvalid.value = true
    return
  }
  if (!userStore.token) {
    reportId.value = 'ERROR'
    return
  }
  reportSubmitting.value = true
  try {
    const result = await $fetch<{ reportId: string }>(`${API_BASE}/api/flips/report`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userStore.token}` },
      body: {
        listing: props.item.listing,
        profit: props.item.potentialProfit,
        medianPrice: props.item.medianPrice,
        recentSells: props.item.recentSells,
        reason: reportReason.value || undefined,
        currentSlug: currentSlug.value || undefined,
        suggestedSlug: suggestedSlug.value || undefined,
      },
    })
    reportId.value = result?.reportId ?? 'ERROR'
  }
  catch {
    reportId.value = 'ERROR'
  }
  finally {
    reportSubmitting.value = false
  }
}

const closeReportDialog = () => {
  showReportDialog.value = false
  reportId.value = ''
}

const copyReportId = async () => {
  await navigator.clipboard.writeText(reportId.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const formatPrice = (price: number | null | undefined) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price ?? 0)
}

function getPlatformUrl(platform: Platform | undefined, id: string): string {
  switch (platform) {
    case 'Kleinanzeigen':
      return `https://www.kleinanzeigen.de/s-anzeige/copy/${id}-1-1`
    case 'Ebay':
      return `https://ebay.de/itm/${id}`
    case 'Facebook':
      return `https://www.facebook.com/marketplace/item/${id}`
    case 'Willhaben':
      return `https://www.willhaben.at/iad/${id.replace(/^\//, '')}`
    case 'Shpock':
      return `https://www.shpock.com/de-de/i/${id}`
    case 'Marktplaats':
      return id.includes('/')
        ? `https://www.marktplaats.nl${id}`
        : `https://www.marktplaats.nl/v/redirect/redirect/${id}-test`
    default:
      return `https://ane.deals/auctions?platform=${String(platform ?? 'unknown').toLowerCase()}&id=${encodeURIComponent(id)}`
  }
}

const getSellUrl = (sell: SoldFor) => {
  if (!sell?.id) return '#'
  return getPlatformUrl(sell.platform, sell.id)
}

const listingLocation = computed(() => {
  const listing = props.item.listing
  return [listing?.locality, listing?.region, listing?.street]
    .filter((value): value is string => Boolean(value))
    .join(', ')
})

const listingUrl = computed(() => {
  const listing = props.item.listing
  if (!listing?.id) return '#'
  return getPlatformUrl(listing.platform, listing.id)
})

const formattedProfit = computed(() => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(profit.value)
})

const formattedPrice = computed(() => {
  const price = props.item.listing?.price ?? 0
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
})

const formattedMedian = computed(() => {
  const median = props.item.medianPrice ?? 0
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(median)
})
</script>
