<template>
  <div class="container mx-auto px-4 py-8">
    <div
      v-if="loading"
      class="flex items-center justify-center min-h-[50vh]"
    >
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>

    <div
      v-else-if="product"
      class="max-w-7xl mx-auto"
    >
      <!-- Breadcrumb -->
      <nav class="flex text-sm text-slate-400 mb-6">
        <NuxtLink
          to="/home"
          class="hover:text-blue-400"
        >
          Home
        </NuxtLink>
        <span class="mx-2">/</span>
        <span class="text-slate-200 truncate">{{ product.name }}</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <!-- Main Image -->
        <div class="lg:col-span-1">
          <div class="aspect-square bg-slate-800 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5 p-4">
            <NuxtImg
              v-if="product.imageUrl"
              :src="product.imageUrl"
              class="w-full h-full object-contain"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-slate-600"
            >
              <Icon
                name="tabler:photo"
                class="w-20 h-20"
              />
            </div>
          </div>
        </div>

        <!-- Details -->
        <div class="lg:col-span-2">
          <div class="flex flex-wrap gap-2 mb-4">
            <span
              v-if="product.brand"
              class="px-3 py-1 rounded-full bg-slate-800 text-xs font-medium text-blue-400 border border-slate-700"
            >
              {{ product.brand }}
            </span>
            <span
              v-if="product.model"
              class="px-3 py-1 rounded-full bg-slate-800 text-xs font-medium text-slate-400 border border-slate-700"
            >
              {{ product.model }}
            </span>
          </div>

          <h1 class="text-4xl font-bold text-white mb-4 leading-tight">
            {{ product.name }}
          </h1>

          <p class="text-slate-400 text-lg mb-8 leading-relaxed max-w-3xl">
            {{ product.description }}
          </p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div class="text-slate-500 text-xs uppercase font-bold mb-1">
                Average Price
              </div>
              <div class="text-xl font-bold text-white">
                ~{{ formatPrice(product.avgPrice) }}
              </div>
            </div>
            <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div class="text-slate-500 text-xs uppercase font-bold mb-1">
                Available
              </div>
              <div class="text-xl font-bold text-green-400">
                {{ availableOfferCount }} Offers
              </div>
            </div>
          </div>

          <!-- Report Product Button -->
          <button
            class="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm"
            @click="showProductReportDialog = true"
          >
            <Icon
              name="tabler:flag"
              class="w-4 h-4"
            />
            Report product issue
          </button>
        </div>
      </div>

      <!-- Listings Section -->
      <div class="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div class="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 class="text-2xl font-bold text-white">
            Available Offers
          </h2>
        </div>

        <ProductListingTable
          :listings="matches"
          :product-id="productId"
          @listing-unavailable="handleListingUnavailable"
        />

        <div class="p-4 bg-slate-800/30 text-center">
          <button class="text-blue-400 hover:text-blue-300 text-sm font-medium">
            Load more...
          </button>
        </div>
      </div>

      <!-- Product Report Dialog -->
      <Teleport to="body">
        <div
          v-if="showProductReportDialog"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          @click.self="showProductReportDialog = false"
        >
          <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-700">
            <h3 class="text-lg font-bold text-white mb-4">
              Report Product Issue
            </h3>
            <p class="text-slate-400 text-sm mb-4">
              What's wrong with this product?
            </p>

            <div class="space-y-2 mb-4">
              <label
                v-for="issue in productIssueTypes"
                :key="issue.value"
                class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                :class="{ 'bg-slate-700': selectedProductIssueType === issue.value }"
              >
                <input
                  v-model="selectedProductIssueType"
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
                v-model="productReportDescription"
                class="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Provide more details about the issue..."
              />
            </div>

            <div class="flex gap-3 justify-end">
              <button
                class="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                @click="showProductReportDialog = false"
              >
                Cancel
              </button>
              <button
                class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                :disabled="!selectedProductIssueType || submittingProductReport"
                @click="submitProductReport"
              >
                <span v-if="submittingProductReport">Submitting...</span>
                <span v-else>Submit Report</span>
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>

    <div
      v-else
      class="text-center py-20"
    >
      <h2 class="text-2xl text-slate-400">
        Product not found
      </h2>
      <NuxtLink
        to="/home"
        class="text-blue-500 hover:underline mt-4 inline-block"
      >
        Back to Home
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getProduct, getProductMatches, reportProductIssue } from '~/src/api-client'
import type { IssueType, Product, ProductMatch } from '~/src/api-client/types.gen'
import ProductListingTable from '~/components/product/ProductListingTable.vue'

const route = useRoute()
const productId = route.params.id as string

const product = ref<Product | null>(null)
const matches = ref<ProductMatch[]>([])
const loading = ref(true)
const unavailableCount = ref(0)

// Product report dialog state
const showProductReportDialog = ref(false)
const selectedProductIssueType = ref<IssueType | null>(null)
const productReportDescription = ref('')
const submittingProductReport = ref(false)

const productIssueTypes: { value: IssueType, label: string }[] = [
  { value: 'WrongCategory', label: 'Wrong category' },
  { value: 'Duplicate', label: 'Duplicate product' },
  { value: 'IncorrectInformation', label: 'Incorrect information' },
  { value: 'Spam', label: 'Spam or fake' },
  { value: 'Other', label: 'Other issue' },
]

const availableOfferCount = computed(() => matches.value.length - unavailableCount.value)

function formatPrice(amount: number | undefined | null) {
  if (!amount) return 'N/A'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

function handleListingUnavailable(_listingId: number | string) {
  unavailableCount.value++
}

async function submitProductReport() {
  if (!selectedProductIssueType.value) return

  submittingProductReport.value = true

  try {
    await reportProductIssue({
      path: { id: productId },
      body: {
        type: selectedProductIssueType.value,
        description: productReportDescription.value || undefined,
      },
    })

    showProductReportDialog.value = false
    selectedProductIssueType.value = null
    productReportDescription.value = ''
  }
  catch (error) {
    console.error('Failed to submit product report:', error)
  }
  finally {
    submittingProductReport.value = false
  }
}

onMounted(async () => {
  try {
    // Parallel fetch
    const [pRes, mRes] = await Promise.all([
      getProduct({ path: { id: productId } }),
      getProductMatches({ path: { id: productId } }),
    ])

    product.value = pRes as Product
    matches.value = (mRes as ProductMatch[]) || []
  }
  catch (e) {
    console.error('Failed to load product', e)
  }
  finally {
    loading.value = false
  }
})
</script>
