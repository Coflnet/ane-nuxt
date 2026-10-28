<template>
  <div class="overflow-x-auto">
    <p
      class="px-3 py-2 text-xs text-slate-400"
      role="status"
    >
      {{ $t('product.sortLoadedOffers') }}
      <span v-if="!canSortPrices">{{ $t('product.sortRequiresCurrency') }}</span>
    </p>
    <table class="block sm:table w-full text-left text-sm text-slate-400">
      <thead class="block sm:table-header-group text-xs uppercase bg-slate-800/50 text-slate-300">
        <tr class="flex sm:table-row">
          <th class="hidden sm:table-cell px-6 py-4 rounded-tl-lg">
            {{ $t('product.marketplace') }}
          </th>
          <th class="hidden sm:table-cell px-6 py-4">
            {{ $t('product.title') }}
          </th>
          <th
            class="px-3 sm:px-6"
            :aria-sort="activeSort?.field === 'price' ? activeSort.ascending ? 'ascending' : 'descending' : 'none'"
          >
            <button
              type="button"
              class="min-h-11 inline-flex items-center gap-1 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!canSortPrices"
              @click="toggleSort('price')"
            >
              {{ $t('product.price') }}
              <Icon
                :name="sortIcon('price')"
                class="w-4 h-4"
              />
            </button>
          </th>
          <th
            class="px-3 sm:px-6"
            :aria-sort="activeSort?.field === 'date' ? activeSort.ascending ? 'ascending' : 'descending' : 'none'"
          >
            <button
              type="button"
              class="min-h-11 inline-flex items-center gap-1 hover:text-white"
              @click="toggleSort('date')"
            >
              {{ $t('product.date') }}
              <Icon
                :name="sortIcon('date')"
                class="w-4 h-4"
              />
            </button>
          </th>
          <th class="hidden sm:table-cell px-6 py-4 rounded-tr-lg">
            {{ $t('product.action') }}
          </th>
        </tr>
      </thead>
      <tbody class="block sm:table-row-group">
        <tr
          v-for="(listing, listingIndex) in sortedListings"
          :key="listingIdentityKey(listing) || JSON.stringify([listing.platform, listing.listingUrl, listingIndex])"
          class="grid grid-cols-[minmax(0,1fr)_auto] gap-x-1 p-2 sm:table-row sm:p-0 border-b border-slate-700/50 hover:bg-slate-800/30"
          :class="{ 'opacity-50': unavailableListings.has(listingIdentityKey(listing) || '') }"
        >
          <td class="hidden sm:table-cell px-6 py-4 font-medium text-slate-200">
            <span class="inline-flex items-center gap-2">
              {{ listing.platform || getMarketplaceName(listing.listingUrl) }}
              <span
                v-if="listing.country"
                class="text-xs font-normal text-slate-400 whitespace-nowrap"
                :title="listing.country"
              >
                <span aria-hidden="true">{{ countryFlag(listing.country) }}</span> {{ listing.country }}
              </span>
              <span
                v-if="unavailableListings.has(listingIdentityKey(listing) || '')"
                class="text-xs text-red-400"
              >
                (Unavailable)
              </span>
            </span>
          </td>
          <td class="col-span-2 row-start-3 p-0 sm:px-6 sm:py-4">
            <a
              :href="listing.listingUrl ?? undefined"
              target="_blank"
              class="hidden sm:line-clamp-1 hover:text-blue-400 transition-colors"
            >
              {{ listing.title }}
            </a>
            <span
              v-if="unavailableListings.has(listingIdentityKey(listing) || '')"
              class="block text-xs text-red-400 mt-0.5"
              role="status"
            >
              {{ $t('product.soldOrRemoved', 'Already sold or removed') }}
              <a
                :href="listing.listingUrl ?? undefined"
                target="_blank"
                rel="noopener noreferrer"
                class="underline hover:text-red-300 ml-1"
              >{{ $t('product.openAnyway', 'open anyway') }}</a>
            </span>
            <span
              v-if="showDistance && typeof listing.distanceKm === 'number'"
              class="block text-xs text-slate-500 mt-0.5"
            >
              {{ $t('product.filters.distanceKm', { km: Math.round(listing.distanceKm) }) }}
            </span>
          </td>
          <td class="col-start-1 row-start-1 p-0 sm:px-6 sm:py-4 font-bold text-slate-200">
            {{ formatPrice(listing.price, listing.currency) }}
          </td>
          <td class="col-start-1 row-start-2 p-0 sm:px-6 sm:py-4 text-xs sm:text-sm">
            {{ formatDate(listing.postedAt) }}
          </td>
          <td class="col-start-2 row-start-1 row-span-2 self-center p-0 sm:px-6 sm:py-4">
            <div class="flex items-center gap-1 sm:gap-2">
              <a
                :href="listing.listingUrl ?? undefined"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex min-h-11 sm:min-h-0 shrink-0 whitespace-nowrap items-center gap-1 px-1 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                :class="{ 'pointer-events-none opacity-50': checkingAvailability.has(listingIdentityKey(listing) || '') }"
                @click="handleViewDeal($event, listing)"
              >
                <Icon
                  v-if="checkingAvailability.has(listingIdentityKey(listing) || '')"
                  name="tabler:loader-2"
                  class="w-3 h-3 animate-spin"
                />
                <template v-else>
                  {{ $t('product.viewDeal') }}
                  <Icon
                    name="tabler:external-link"
                    class="hidden sm:block w-3 h-3"
                  />
                </template>
              </a>
              <button
                class="min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 shrink-0 p-2 text-slate-400 hover:text-red-400 transition-colors"
                :title="$t('product.reportListing')"
                :aria-label="$t('product.reportListing')"
                @click="openReportDialog(listing)"
              >
                <Icon
                  name="tabler:flag"
                  class="w-4 h-4"
                />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-if="listings.length === 0 && !hasActiveFilter"
      class="p-8 text-center text-slate-500"
    >
      <p class="mb-4">
        No listings found for this product currently.
      </p>
      <NuxtLink
        v-if="notifyUrl"
        :to="notifyUrl"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Icon
          name="tabler:bell-plus"
          class="w-4 h-4"
        />
        {{ $t('product.notifyMe') }}
      </NuxtLink>
    </div>

    <!-- Report Dialog -->
    <Teleport to="body">
      <div
        v-if="showReportDialog"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="closeReportDialog"
      >
        <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-700">
          <h3 class="text-lg font-bold text-white mb-4">
            Report Listing
          </h3>
          <p class="text-slate-400 text-sm mb-4">
            Why are you reporting this listing?
          </p>

          <div class="space-y-2 mb-4">
            <button
              type="button"
              class="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-slate-700/50 transition-colors disabled:opacity-50"
              data-testid="report-wrong-match"
              :disabled="submittingReport"
              @click="submitReport('WrongMatch')"
            >
              <Icon
                name="tabler:unlink"
                class="w-4 h-4 text-slate-300"
              />
              <span class="text-slate-200">Wrong product match</span>
              <span class="text-slate-500 text-xs ml-auto">This listing does not belong to this product</span>
            </button>
            <div
              class="p-3 rounded-lg"
              :class="{ 'bg-slate-700': sameProductOpen }"
            >
              <button
                type="button"
                class="w-full flex items-center gap-3 text-left"
                data-testid="report-same-product"
                @click="sameProductOpen = !sameProductOpen"
              >
                <Icon
                  name="tabler:link"
                  class="w-4 h-4 text-slate-300"
                />
                <span class="text-slate-200">Same product as...</span>
              </button>
              <div
                v-if="sameProductOpen"
                class="mt-3 flex gap-2"
              >
                <input
                  v-model="otherProductInput"
                  type="text"
                  class="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded-lg p-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste an ane.deals product link or id"
                  data-testid="report-other-product"
                  @keydown.enter.prevent="submitReport('SameProductAs')"
                >
                <button
                  type="button"
                  class="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  data-testid="report-same-product-confirm"
                  :disabled="!otherProductId || submittingReport"
                  @click="submitReport('SameProductAs')"
                >
                  Confirm
                </button>
              </div>
              <p
                v-if="sameProductOpen && otherProductInput.trim() && !otherProductId"
                class="mt-2 text-xs text-amber-400"
              >
                That does not look like an ane.deals product link or id.
              </p>
            </div>
            <label
              v-for="issue in issueTypes"
              :key="issue.value"
              class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
              :class="{ 'bg-slate-700': selectedIssueType === issue.value }"
            >
              <input
                v-model="selectedIssueType"
                type="radio"
                :value="issue.value"
                class="text-blue-500 focus:ring-blue-500"
              >
              <span class="text-slate-200">{{ issue.label }}</span>
            </label>
          </div>

          <div class="mb-4">
            <label class="block text-slate-400 text-sm mb-2">
              Additional details (optional)
            </label>
            <textarea
              v-model="reportDescription"
              class="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              maxlength="500"
              placeholder="Provide more details about the issue..."
            />
          </div>

          <p
            v-if="reportError"
            class="mb-4 text-sm text-red-400"
            role="alert"
            data-testid="report-error"
          >
            {{ reportError }}
          </p>
          <button
            v-if="reportError === $t('product.listingIdentityUnavailable') && selectedListing"
            type="button"
            class="mb-4 min-h-11 rounded-lg border border-slate-600 px-4 text-sm text-blue-300"
            @click="emit('refreshListings')"
          >
            {{ $t('product.reloadListingIdentity') }}
          </button>

          <div class="flex gap-3 justify-end">
            <button
              class="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              @click="closeReportDialog"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              :disabled="!selectedIssueType || submittingReport"
              @click="submitReport()"
            >
              <span v-if="submittingReport">Submitting...</span>
              <span v-else>Submit Report</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { reportProductIssue } from '~/src/api-client'
import { useUserStore } from '~/stores/user'
import { labelingErrorStatus } from '~/composables/useLabelingApi'
import { nativeListingId, listingIdentityKey } from '~/utils/listingIdentity'
import { buildReportBody, extractProductId, reportErrorMessage } from '~/utils/productReport'
import type { ModelsIssueType, ModelsProductMatch as GeneratedProductMatch, Platform } from '~/src/api-client/types.gen'
import { countryFlag } from '~/utils/countryDetection'
import type { OfferMatchExtras } from '~/utils/offerFilters'
import { canSortOfferPrices, sortLoadedOffers, type OfferSort } from '~/utils/offerSort'
import { useAvailabilityCheck } from '~/composable/useAvailabilityCheck'
import { useListingOpener } from '~/composable/useListingOpener'
import { useFormat } from '~/composable/useFormat'

// the generated client predates these offer fields; all optional so an old API still works
type ProductMatch = GeneratedProductMatch & OfferMatchExtras

const props = defineProps<{
  listings: ProductMatch[]
  productId?: string
  /** A filter is active: the parent renders the empty state. */
  hasActiveFilter?: boolean
  /** A position filter is active: show the distance of each offer. */
  showDistance?: boolean
  /**
   * Localized href for the "Notify me about new offers" CTA — built by the parent via
   * utils/notifyFilterUrl.ts (needs product data + the i18n locale path helper).
   */
  notifyUrl?: string | null
}>()

const emit = defineEmits<{
  (e: 'listingUnavailable', listingId: number | string): void
  (e: 'refreshListings'): void
}>()

const sort = ref<OfferSort | null>(null)
const canSortPrices = computed(() => canSortOfferPrices(props.listings))
const activeSort = computed(() => sort.value?.field === 'price' && !canSortPrices.value ? null : sort.value)
const sortedListings = computed(() => sortLoadedOffers(props.listings, activeSort.value))
function toggleSort(field: OfferSort['field']) {
  sort.value = { field, ascending: activeSort.value?.field === field ? !activeSort.value.ascending : field === 'price' }
}
function sortIcon(field: OfferSort['field']) {
  return activeSort.value?.field === field ? activeSort.value.ascending ? 'tabler:arrow-up' : 'tabler:arrow-down' : 'tabler:arrows-sort'
}

// Availability tracking
const unavailableListings = ref<Set<number | string>>(new Set())
const checkingAvailability = ref<Set<number | string>>(new Set())

// Report dialog state
const showReportDialog = ref(false)
const selectedListing = ref<ProductMatch | null>(null)
const selectedIssueType = ref<ModelsIssueType | null>(null)
const reportDescription = ref('')
const submittingReport = ref(false)
const reportError = ref('')
const sameProductOpen = ref(false)
const otherProductInput = ref('')
const otherProductId = computed(() => extractProductId(otherProductInput.value))
const userStore = useUserStore()
const route = useRoute()
const localePath = useLocalePath()

const issueTypes: { value: ModelsIssueType, label: string }[] = [
  { value: 'WrongCategory', label: 'Wrong category' },
  { value: 'Duplicate', label: 'Duplicate listing' },
  { value: 'WrongListing', label: 'Wrong listing' },
  { value: 'IncorrectInformation', label: 'Incorrect information' },
  { value: 'Spam', label: 'Spam or scam' },
  { value: 'Other', label: 'Other issue' },
]

const { getMarketplaceName } = useAvailabilityCheck()
const { openListing } = useListingOpener()
const { t, locale } = useI18n()
const { formatCurrency, formatNumber } = useFormat()

function formatPrice(amount: number | undefined | null, currency: string | undefined | null) {
  if (amount == null) return 'N/A'
  const code = currency?.trim().toUpperCase() ?? ''
  return /^[A-Z]{3}$/.test(code) ? formatCurrency(amount, code, locale.value) : formatNumber(amount, locale.value)
}

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('de-DE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function handleViewDeal(e: MouseEvent, listing: ProductMatch) {
  const listingId = nativeListingId(listing)
  const key = listingIdentityKey(listing)

  if (key) {
    checkingAvailability.value.add(key)
  }

  try {
    await openListing(e, {
      listingId,
      platform: listing.platform,
      url: listing.listingUrl,
      onUnavailable: () => {
        if (!listingId || !key) return
        unavailableListings.value.add(key)
        emit('listingUnavailable', listingId)
      },
    })
  }
  finally {
    if (key) {
      checkingAvailability.value.delete(key)
    }
  }
}

// Refresh only the selected offer object; unfinished report fields remain in the open dialog.
watch(() => props.listings, (listings) => {
  const selected = selectedListing.value
  if (!selected?.listingUrl || (nativeListingId(selected) && reportError.value !== t('product.listingIdentityUnavailable'))) return
  const refreshed = listings.find(listing => listing.listingUrl === selected.listingUrl && listing.platform === selected.platform)
  if (refreshed) selectedListing.value = refreshed
})

function openReportDialog(listing: ProductMatch) {
  // Reports need an account: send visitors to the login instead of firing an unauthenticated request.
  if (!userStore.isLoggedIn || !userStore.token) {
    navigateTo(localePath({ path: '/login', query: { redirectTo: route.fullPath } }))
    return
  }
  selectedListing.value = listing
  selectedIssueType.value = null
  reportDescription.value = ''
  reportError.value = ''
  sameProductOpen.value = false
  otherProductInput.value = ''
  showReportDialog.value = true
}

function closeReportDialog() {
  showReportDialog.value = false
  selectedListing.value = null
  selectedIssueType.value = null
  reportDescription.value = ''
  reportError.value = ''
  sameProductOpen.value = false
  otherProductInput.value = ''
}

async function submitReport(quickType?: ModelsIssueType) {
  const type: ModelsIssueType | null = quickType ?? selectedIssueType.value
  if (!type || !props.productId || submittingReport.value) return
  if (!userStore.token) {
    navigateTo(localePath({ path: '/login', query: { redirectTo: route.fullPath } }))
    return
  }
  if (type === 'SameProductAs' && !otherProductId.value) return

  submittingReport.value = true
  reportError.value = ''

  try {
    const listingId = nativeListingId(selectedListing.value)
    if (selectedListing.value && !listingId) {
      reportError.value = t('product.listingIdentityUnavailable')
      return
    }
    await reportProductIssue({
      path: { id: props.productId },
      body: buildReportBody({
        type,
        listingId,
        listingPlatform: selectedListing.value?.platform as Platform | undefined,
        productId: props.productId,
        otherProductId: otherProductId.value,
        comment: reportDescription.value,
        suggestion: type === 'WrongMatch' || type === 'SameProductAs' ? undefined : listingId,
      }),
      headers: { Authorization: `Bearer ${userStore.token}` },
    })

    closeReportDialog()
  }
  catch (error) {
    console.error('Failed to submit report:', error)
    const status = labelingErrorStatus(error)
    reportError.value = status === 400 && (type === 'WrongMatch' || type === 'WrongListing') ? t('product.listingIdentityUnavailable') : reportErrorMessage(status)
    if (status === 401) navigateTo(localePath({ path: '/login', query: { redirectTo: route.fullPath } }))
  }
  finally {
    submittingReport.value = false
  }
}
</script>
