<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm text-slate-400">
      <thead class="text-xs uppercase bg-slate-800/50 text-slate-300">
        <tr>
          <th class="px-6 py-4 rounded-tl-lg">
            Marketplace
          </th>
          <th class="px-6 py-4">
            Title
          </th>
          <th
            class="px-6 py-4 cursor-pointer hover:text-white"
            @click="$emit('sort', 'price')"
          >
            Price
            <Icon
              name="tabler:arrows-sort"
              class="inline w-4 h-4"
            />
          </th>
          <th
            class="px-6 py-4 cursor-pointer hover:text-white"
            @click="$emit('sort', 'date')"
          >
            Date
            <Icon
              name="tabler:arrows-sort"
              class="inline w-4 h-4"
            />
          </th>
          <th class="px-6 py-4 rounded-tr-lg">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="listing in listings"
          :key="listing.listingId || listing.id"
          class="border-b border-slate-700/50 hover:bg-slate-800/30"
          :class="{ 'opacity-50': unavailableListings.has(listing.listingId || listing.id) }"
        >
          <td class="px-6 py-4 font-medium text-slate-200">
            <span class="inline-flex items-center gap-2">
              {{ getMarketplaceName(listing.listingUrl) }}
              <span
                v-if="unavailableListings.has(listing.listingId || listing.id)"
                class="text-xs text-red-400"
              >
                (Unavailable)
              </span>
            </span>
          </td>
          <td class="px-6 py-4">
            <a
              :href="listing.listingUrl"
              target="_blank"
              class="hover:text-blue-400 transition-colors line-clamp-1"
            >
              {{ listing.title }}
            </a>
            <p class="text-xs text-slate-500 mt-1 line-clamp-1">
              {{ listing.description }}
            </p>
          </td>
          <td class="px-6 py-4 font-bold text-slate-200">
            {{ formatPrice(listing.price) }}
          </td>
          <td class="px-6 py-4">
            {{ formatDate(listing.postedAt) }}
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              <button
                class="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                :disabled="checkingAvailability.has(listing.listingId || listing.id)"
                @click="handleViewDeal(listing)"
              >
                <Icon
                  v-if="checkingAvailability.has(listing.listingId || listing.id)"
                  name="tabler:loader-2"
                  class="w-3 h-3 animate-spin"
                />
                <template v-else>
                  View Deal
                  <Icon
                    name="tabler:external-link"
                    class="w-3 h-3"
                  />
                </template>
              </button>
              <button
                class="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Report this listing"
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
      v-if="listings.length === 0"
      class="p-8 text-center text-slate-500"
    >
      No listings found for this product currently.
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
              placeholder="Provide more details about the issue..."
            />
          </div>

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
              @click="submitReport"
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
import type { IssueType, Platform, ProductMatch } from '~/src/api-client/types.gen'

const props = defineProps<{
  listings: ProductMatch[]
  productId?: string
}>()

const emit = defineEmits<{
  (e: 'sort', field: string): void
  (e: 'listingUnavailable', listingId: number | string): void
}>()

// Availability tracking
const unavailableListings = ref<Set<number | string>>(new Set())
const checkingAvailability = ref<Set<number | string>>(new Set())

// Report dialog state
const showReportDialog = ref(false)
const selectedListing = ref<ProductMatch | null>(null)
const selectedIssueType = ref<IssueType | null>(null)
const reportDescription = ref('')
const submittingReport = ref(false)

const issueTypes: { value: IssueType, label: string }[] = [
  { value: 'WrongCategory', label: 'Wrong category' },
  { value: 'Duplicate', label: 'Duplicate listing' },
  { value: 'WrongListing', label: 'Wrong product match' },
  { value: 'IncorrectInformation', label: 'Incorrect information' },
  { value: 'Spam', label: 'Spam or scam' },
  { value: 'Other', label: 'Other issue' },
]

function formatPrice(amount: number | undefined | null) {
  if (!amount) return 'N/A'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('de-DE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getMarketplaceName(url?: string | null): string {
  if (!url) return 'Unknown'
  try {
    const hostname = new URL(url).hostname
    return hostname.replace('www.', '').split('.')[0] ?? 'Unknown'
  }
  catch {
    return 'Web'
  }
}

function getPlatformFromUrl(url?: string | null): Platform {
  if (!url) return 'Unknown'
  const hostname = getMarketplaceName(url).toLowerCase()

  const platformMap: Record<string, Platform> = {
    kleinanzeigen: 'Kleinanzeigen',
    ebay: 'Ebay',
    marktplaats: 'Marktplaats',
    willhaben: 'Willhaben',
    shpock: 'Shpock',
    markt: 'MarktDe',
    vinted: 'Vinted',
    facebook: 'Facebook',
    poshmark: 'Poshmark',
    mercari: 'Mercari',
    depop: 'Depop',
    mobile: 'Mobile',
    autoscout24: 'AutoScout24',
    craigslist: 'Craigslist',
    offerup: 'OfferUp',
    olx: 'OLX',
    quoka: 'Quoka',
    gumtree: 'Gumtree',
    wallapop: 'Wallapop',
  }

  return platformMap[hostname] || 'Unknown'
}

async function checkAvailability(listing: ProductMatch): Promise<boolean> {
  const listingId = listing.listingId || listing.productId
  if (!listingId) return true

  const platform = getPlatformFromUrl(listing.listingUrl)
  if (platform === 'Unknown') return true

  try {
    const response = await $fetch<{ isAvailable: boolean }>(`https://ane.coflnet.com/api/Product/${platform}/${listingId}/available`)
    return response.isAvailable
  }
  catch (error) {
    console.error('Failed to check availability:', error)
    // If check fails, assume available
    return true
  }
}

async function handleViewDeal(listing: ProductMatch) {
  const listingId = listing.listingId || listing.productId

  if (listingId) {
    checkingAvailability.value.add(listingId)
  }

  try {
    const isAvailable = await checkAvailability(listing)

    if (!isAvailable && listingId) {
      unavailableListings.value.add(listingId)
      emit('listingUnavailable', listingId)
    }

    // Always open the link, even if unavailable (user might want to verify)
    if (listing.listingUrl) {
      window.open(listing.listingUrl, '_blank')
    }
  }
  finally {
    if (listingId) {
      checkingAvailability.value.delete(listingId)
    }
  }
}

function openReportDialog(listing: ProductMatch) {
  selectedListing.value = listing
  selectedIssueType.value = null
  reportDescription.value = ''
  showReportDialog.value = true
}

function closeReportDialog() {
  showReportDialog.value = false
  selectedListing.value = null
  selectedIssueType.value = null
  reportDescription.value = ''
}

async function submitReport() {
  if (!selectedIssueType.value || !props.productId) return

  submittingReport.value = true

  try {
    await reportProductIssue({
      path: { id: props.productId },
      body: {
        type: selectedIssueType.value,
        description: reportDescription.value || undefined,
        suggestion: selectedListing.value?.listingId?.toString(),
      },
    })

    // Show success feedback (could use notivue here)
    closeReportDialog()
  }
  catch (error) {
    console.error('Failed to submit report:', error)
  }
  finally {
    submittingReport.value = false
  }
}
</script>
