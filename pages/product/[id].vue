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
          {{ $t('nav.home') }}
        </NuxtLink>
        <span class="mx-2">/</span>
        <NuxtLink
          to="/search"
          class="hover:text-blue-400"
        >
          {{ $t('nav.search') }}
        </NuxtLink>
        <span
          v-if="product.categories && product.categories.length > 0 && product.categories[0] !== 'general' && !/^[\d,\s]+$/.test(product.categories[0])"
          class="mx-2"
        >/</span>
        <NuxtLink
          v-if="product.categories && product.categories.length > 0 && product.categories[0] !== 'general' && !/^[\d,\s]+$/.test(product.categories[0])"
          :to="localePath(`/search?category=${encodeURIComponent(product.categories[0])}`)"
          class="hover:text-blue-400"
        >{{ localizeCategory(product.categories[0]) }}</NuxtLink>
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
              v-if="product.model && product.model !== 'unknown' && product.model.toLowerCase() !== 'nicht angegeben' && product.model.toLowerCase() !== 'nichtangegeben'"
              class="px-3 py-1 rounded-full bg-slate-800 text-xs font-medium text-slate-400 border border-slate-700"
            >
              {{ product.model }}
            </span>
            <span
              v-if="product.condition && product.condition !== 'unknown'"
              class="px-3 py-1 rounded-full text-xs font-medium"
              :class="conditionClass(product.condition)"
            >
              {{ formatCondition(product.condition) }}
            </span>
            <span
              v-for="cat in (product.categories || []).filter(c => c !== 'general' && !/^[\d,\s]+$/.test(c))"
              :key="cat"
              class="px-3 py-1 rounded-full bg-slate-800 text-xs font-medium text-cyan-400 border border-slate-700"
            >
              {{ localizeCategory(cat) }}
            </span>
          </div>

          <h1 class="text-4xl font-bold text-white mb-4 leading-tight">
            {{ product.name }}
          </h1>

          <p
            v-if="product.description && product.description !== product.name"
            class="text-slate-400 text-lg mb-6 leading-relaxed max-w-3xl"
          >
            {{ product.description }}
          </p>

          <!-- Price Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div class="text-slate-500 text-xs uppercase font-bold mb-1">
                {{ $t('product.averagePrice') }}
              </div>
              <div class="text-xl font-bold text-white">
                ~{{ formatPrice(product.avgPrice) }}
              </div>
            </div>
            <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div class="text-slate-500 text-xs uppercase font-bold mb-1">
                {{ $t('product.priceRange') }}
              </div>
              <div class="text-sm font-bold text-white">
                {{ formatPrice(product.minPrice) }} - {{ formatPrice(product.maxPrice) }}
              </div>
            </div>
            <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div class="text-slate-500 text-xs uppercase font-bold mb-1">
                {{ $t('product.available') }}
              </div>
              <div class="text-xl font-bold text-green-400">
                {{ $t('product.offersCount', { count: availableOfferCount }) }}
              </div>
            </div>
            <div
              v-if="priceStats && priceStats.trendPercent !== undefined"
              class="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50"
            >
              <div class="text-slate-500 text-xs uppercase font-bold mb-1">
                {{ $t('product.trend') }} ({{ priceStats.daysOfData }}d)
              </div>
              <div
                class="text-xl font-bold"
                :class="(priceStats.trendPercent || 0) >= 0 ? 'text-red-400' : 'text-green-400'"
              >
                {{ (priceStats.trendPercent || 0) >= 0 ? '+' : '' }}{{ priceStats.trendPercent?.toFixed(1) }}%
              </div>
            </div>
          </div>

          <!-- Attributes Section -->
          <div class="mb-6">
            <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Icon
                name="tabler:info-circle"
                class="w-5 h-5 text-blue-400"
              />
              {{ $t('product.attributes.title') }}
            </h3>

            <!-- When attributes exist and have non-empty values -->
            <div
              v-if="hasAttributes"
              class="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <div
                v-for="(value, key) in filteredAttributes"
                :key="key"
                class="bg-gradient-to-br from-slate-800/60 to-slate-800/30 rounded-lg border border-slate-700/50 p-4 transition-all duration-200 block"
              >
                <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  {{ localizeAttrKey(String(key)) }}
                </div>
                <div class="text-sm text-white font-medium flex items-center gap-2">
                  <Icon
                    name="tabler:point-filled"
                    class="w-3 h-3 text-blue-400 flex-shrink-0"
                  />
                  <select
                    v-if="attributeOptions[key] && attributeOptions[key].length > 1"
                    class="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                    @change="handleAttributeChange"
                  >
                    <option
                      v-for="opt in attributeOptions[key]"
                      :key="opt.productId"
                      :value="opt.productId"
                      :selected="opt.value === String(value)"
                    >
                      {{ localizeAttrValue(String(key), opt.value) }}
                    </option>
                  </select>
                  <span v-else>{{ localizeAttrValue(String(key), String(value)) }}</span>
                </div>
              </div>
            </div>

            <!-- Fallback when attributes missing or empty -->
            <div
              v-else
              class="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 text-slate-400"
            >
              <div class="flex items-center gap-3">
                <Icon
                  name="tabler:help-circle"
                  class="w-5 h-5 text-slate-400"
                />
                <div>
                  <div class="text-sm font-medium text-white">
                    {{ $t('product.attributes.unknown_title') }}
                  </div>
                  <div class="text-xs text-slate-400">
                    {{ $t('product.attributes.unknown_description') }}
                  </div>
                </div>
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
            {{ $t('product.reportIssue') }}
          </button>
        </div>
      </div>

      <!-- Price History Chart -->
      <div
        v-if="priceHistory.length > 1"
        class="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl mb-8"
      >
        <div class="p-6 border-b border-slate-800">
          <h2 class="text-2xl font-bold text-white">
            Price History
          </h2>
          <p class="text-sm text-slate-400 mt-1">
            {{ priceHistory.length }} days of price data
          </p>
        </div>
        <div class="p-6">
          <div class="relative h-64">
            <svg
              class="w-full h-full"
              :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
              preserveAspectRatio="none"
            >
              <!-- Grid lines -->
              <line
                v-for="i in 4"
                :key="`grid-${i}`"
                :x1="chartPadding"
                :y1="chartPadding + (i - 1) * (chartInnerHeight / 3)"
                :x2="chartWidth - chartPadding"
                :y2="chartPadding + (i - 1) * (chartInnerHeight / 3)"
                stroke="#334155"
                stroke-width="1"
                stroke-dasharray="4,4"
              />
              <!-- Price area fill -->
              <path
                :d="areaPath"
                fill="url(#priceGradient)"
                opacity="0.3"
              />
              <!-- Median price line -->
              <path
                :d="medianLinePath"
                fill="none"
                stroke="#3b82f6"
                stroke-width="2"
                stroke-linejoin="round"
              />
              <!-- Min-Max range area -->
              <path
                :d="rangePath"
                fill="#3b82f6"
                opacity="0.1"
              />
              <defs>
                <linearGradient
                  id="priceGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stop-color="#3b82f6"
                    stop-opacity="0.4"
                  />
                  <stop
                    offset="100%"
                    stop-color="#3b82f6"
                    stop-opacity="0"
                  />
                </linearGradient>
              </defs>
            </svg>
            <!-- Y-axis labels -->
            <div class="absolute top-0 left-0 h-full flex flex-col justify-between py-2 text-xs text-slate-500 pointer-events-none">
              <span>{{ formatPrice(chartMaxPrice) }}</span>
              <span>{{ formatPrice((chartMaxPrice + chartMinPrice) / 2) }}</span>
              <span>{{ formatPrice(chartMinPrice) }}</span>
            </div>
            <!-- X-axis labels -->
            <div class="absolute bottom-0 left-12 right-4 flex justify-between text-xs text-slate-500 pointer-events-none">
              <span>{{ formatDate(priceHistory[0]?.date) }}</span>
              <span v-if="priceHistory.length > 2">
                {{ formatDate(priceHistory[Math.floor(priceHistory.length / 2)]?.date) }}
              </span>
              <span>{{ formatDate(priceHistory[priceHistory.length - 1]?.date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Listings Section -->
      <div class="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div class="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 class="text-2xl font-bold text-white">
            {{ $t('product.availableOffers') }}
          </h2>
        </div>

        <ProductListingTable
          :listings="matches"
          :product-id="productId"
          @listing-unavailable="handleListingUnavailable"
        />

        <div class="p-4 bg-slate-800/30 text-center">
          <button class="text-blue-400 hover:text-blue-300 text-sm font-medium">
            {{ $t('product.loadMore') }}
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
import { getProduct, getProductMatches, reportProductIssue, getPriceHistory, getPriceStats } from '~/src/api-client'
import { client } from '~/src/api-client/client.gen'
import type { IssueType, Product, ProductMatch, PricePoint, PriceHistoryStats } from '~/src/api-client/types.gen'
import ProductListingTable from '~/components/product/ProductListingTable.vue'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const productId = route.params.id as string
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()

const zipCode = computed(() => (route.query.zip as string) || '')
const lat = computed(() => route.query.lat ? Number(route.query.lat) : undefined)
const lon = computed(() => route.query.lon ? Number(route.query.lon) : undefined)
const maxDistance = computed(() => route.query.max_distance ? Number(route.query.max_distance) : undefined)

const product = ref<Product | null>(null)
const relatedProducts = ref<Product[]>([])
const matches = ref<ProductMatch[]>([])
const priceHistory = ref<PricePoint[]>([])
const priceStats = ref<PriceHistoryStats | null>(null)
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

// Filter out 'condition' key from attributes (shown as top-level field)
const filteredAttributes = computed(() => {
  const attrs = product.value?.attributes as Record<string, any> | undefined
  if (!attrs) return {}
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(attrs)) {
    if (key.toLowerCase() === 'condition') continue
    result[key] = value
  }
  return result
})

// Determine if product.attributes contains at least one non-empty value
const hasAttributes = computed(() => {
  const attrs = filteredAttributes.value
  return Object.values(attrs).some((v) => {
    if (v === null || v === undefined) return false
    const s = String(v).trim()
    return s.length > 0
  })
})

const attributeOptions = computed(() => {
  if (!product.value?.attributes) return {}

  const options: Record<string, { value: string, productId: string }[]> = {}

  // Add current product's attributes
  for (const [key, value] of Object.entries(product.value.attributes)) {
    if (value) {
      options[key] = [{ value: String(value), productId: product.value.id! }]
    }
  }

  // Add related products' attributes
  for (const related of relatedProducts.value) {
    if (!related.attributes) continue

    for (const [key, value] of Object.entries(related.attributes)) {
      if (value && options[key]) {
        // Check if this value is already in the options for this key
        const existing = options[key].find(o => o.value === String(value))
        if (!existing) {
          options[key].push({ value: String(value), productId: related.id! })
        }
      }
    }
  }

  // Sort options by value
  for (const key in options) {
    options[key].sort((a, b) => {
      // Try numeric sort first
      const numA = Number.parseFloat(a.value)
      const numB = Number.parseFloat(b.value)
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }
      return a.value.localeCompare(b.value)
    })
  }

  return options
})

function handleAttributeChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const newProductId = target.value
  if (newProductId && newProductId !== productId) {
    router.push(localePath(`/product/${newProductId}`))
  }
}

// Chart computations
const chartWidth = 800
const chartHeight = 256
const chartPadding = 40
const chartInnerWidth = chartWidth - chartPadding * 2
const chartInnerHeight = chartHeight - chartPadding * 2

const chartMinPrice = computed(() => {
  if (!priceHistory.value.length) return 0
  return Math.floor(Math.min(...priceHistory.value.map(p => p.minPrice || p.medianPrice || 0)) * 0.95)
})

const chartMaxPrice = computed(() => {
  if (!priceHistory.value.length) return 100
  return Math.ceil(Math.max(...priceHistory.value.map(p => p.maxPrice || p.medianPrice || 0)) * 1.05)
})

function priceToY(price: number) {
  const range = chartMaxPrice.value - chartMinPrice.value
  if (range === 0) return chartPadding + chartInnerHeight / 2
  return chartPadding + chartInnerHeight - ((price - chartMinPrice.value) / range) * chartInnerHeight
}

function indexToX(index: number) {
  const count = priceHistory.value.length
  if (count <= 1) return chartPadding + chartInnerWidth / 2
  // Reverse the x-position to show past (left) to now (right)
  return chartPadding + ((count - 1 - index) / (count - 1)) * chartInnerWidth
}

const medianLinePath = computed(() => {
  if (priceHistory.value.length < 2) return ''
  return priceHistory.value.map((p, i) => {
    const x = indexToX(i)
    const y = priceToY(p.medianPrice || 0)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
})

const areaPath = computed(() => {
  if (priceHistory.value.length < 2) return ''
  const line = priceHistory.value.map((p, i) => {
    const x = indexToX(i)
    const y = priceToY(p.medianPrice || 0)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
  const lastX = indexToX(priceHistory.value.length - 1)
  const firstX = indexToX(0)
  const bottom = chartPadding + chartInnerHeight
  return `${line} L${lastX},${bottom} L${firstX},${bottom} Z`
})

const rangePath = computed(() => {
  if (priceHistory.value.length < 2) return ''
  const topLine = priceHistory.value.map((p, i) => {
    const x = indexToX(i)
    const y = priceToY(p.maxPrice || p.medianPrice || 0)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
  const bottomLine = [...priceHistory.value].reverse().map((p, i) => {
    const x = indexToX(priceHistory.value.length - 1 - i)
    const y = priceToY(p.minPrice || p.medianPrice || 0)
    return `L${x},${y}`
  }).join(' ')
  return `${topLine} ${bottomLine} Z`
})

function formatPrice(amount: number | undefined | null) {
  if (!amount) return 'N/A'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })
}

const attrKeyTranslationMap: Record<string, string> = {
  'color': 'attr_color',
  'size': 'attr_size',
  'brand': 'attr_brand',
  'model': 'attr_model',
  'material': 'attr_material',
  'gender': 'attr_gender',
  'style': 'attr_style',
  'pattern': 'attr_pattern',
  'condition': 'attr_condition',
  'category': 'attr_category',
  'type': 'attr_type',
  'year': 'attr_year',
  'weight': 'attr_weight',
  'dimensions': 'attr_dimensions',
  'voltage': 'attr_voltage',
  'power': 'attr_power',
  'capacity': 'attr_capacity',
  'resolution': 'attr_resolution',
  'storage': 'attr_storage',
  'ram': 'attr_ram',
  'processor': 'attr_processor',
  'os': 'attr_os',
  'camera': 'attr_camera',
  'battery': 'attr_battery',
  'screen_size': 'attr_screen_size',
  'connectivity': 'attr_connectivity',
  'features': 'attr_features',
  'warranty': 'attr_warranty',
  'origin': 'attr_origin',
  'manufacturer': 'attr_manufacturer',
  'manufactureaddress': 'attr_manufacturer',
  'manufacturertradename': 'attr_manufacturer',
}

const attrValueTranslationMap: Record<string, Record<string, string>> = {
  color: {
    Black: 'color_black',
    White: 'color_white',
    Red: 'color_red',
    Blue: 'color_blue',
    Green: 'color_green',
    Yellow: 'color_yellow',
    Pink: 'color_pink',
    Purple: 'color_purple',
    Orange: 'color_orange',
    Gray: 'color_gray',
    Grey: 'color_gray',
    Silver: 'color_silver',
    Gold: 'color_gold',
    Brown: 'color_brown',
    Beige: 'color_beige',
  },
  gender: {
    Male: 'gender_male',
    Female: 'gender_female',
    Unisex: 'gender_unisex',
  },
}

const categoryTranslationMap: Record<string, string> = {
  'elektronik': 'cat_electronics',
  'handys': 'cat_smartphones',
  'tablets': 'cat_tablets',
  'notebooks': 'cat_laptops',
  'pcs': 'cat_computers',
  'konsolen': 'cat_gaming',
  'videospiele': 'cat_gaming',
  'foto-kameras': 'cat_photography',
  'kameras': 'cat_photography',
  'audio': 'cat_audio',
  'tv-video': 'cat_tv_video',
  'mode': 'cat_clothing',
  'schuhe': 'cat_shoes',
  'uhren': 'cat_watches',
  'schmuck': 'cat_jewelry',
  'haus-garten': 'cat_home_garden',
  'sport': 'cat_sports',
  'spielzeug': 'cat_toys',
  'buecher': 'cat_books',
  'musik': 'cat_music',
  'filme': 'cat_movies',
  'fahrzeuge': 'cat_automotive',
  'autos': 'cat_automotive',
  'baby': 'cat_baby',
  'gesundheit-beauty': 'cat_health_beauty',
  'haustiere': 'cat_pet_supplies',
  'buero': 'cat_office',
  'werkzeug': 'cat_tools',
  'moebel': 'cat_furniture',
  'kueche': 'cat_kitchen',
  'garten': 'cat_garden',
  'zubehoer': 'cat_accessories',
  'pc-zubehoer': 'cat_accessories',
  'taschen': 'cat_bags',
  'sammlungen': 'cat_collectibles',
}

function localizeCategory(cat: string): string {
  const key = categoryTranslationMap[cat]
  if (key) {
    const translated = t(key, cat)
    return translated !== key ? translated : cat
  }
  return cat
}

function localizeAttrKey(key: string): string {
  const tKey = attrKeyTranslationMap[key.toLowerCase()]
  if (tKey) {
    const translated = t(tKey, key)
    return translated !== tKey ? translated : formatAttrKey(key)
  }
  return formatAttrKey(key)
}

function localizeAttrValue(attrKey: string, value: string): string {
  const valueMap = attrValueTranslationMap[attrKey.toLowerCase()]
  if (valueMap && valueMap[value]) {
    const translated = t(valueMap[value], value)
    return translated !== valueMap[value] ? translated : value
  }
  return value
}

function formatAttrKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatCondition(condition: string) {
  const key = `condition.${condition}`
  const translated = t(key)
  return translated !== key ? translated : condition
}

function conditionClass(condition: string) {
  const classes: Record<string, string> = {
    new: 'bg-green-500/20 text-green-400 border border-green-500/30',
    like_new: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    good: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    used: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    broken: 'bg-red-500/20 text-red-400 border border-red-500/30',
  }
  return classes[condition] || 'bg-slate-700/50 text-slate-400'
}

function buildRelatedProductsUrl(id: string): string {
  let url = `/api/Product/${id}/related`
  const params = new URLSearchParams()
  if (zipCode.value) params.append('zip', zipCode.value)
  if (lat.value) params.append('lat', lat.value.toString())
  if (lon.value) params.append('lon', lon.value.toString())
  if (maxDistance.value) params.append('maxDistance', maxDistance.value.toString())
  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
}

function buildMatchesUrl(id: string): string {
  let url = `/api/Product/${id}/matches`
  const params = new URLSearchParams()
  if (zipCode.value) params.append('zip', zipCode.value)
  if (lat.value) params.append('lat', lat.value.toString())
  if (lon.value) params.append('lon', lon.value.toString())
  if (maxDistance.value) params.append('maxDistance', maxDistance.value.toString())
  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
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
    // Parallel fetch all data
    const [pRes, mRes, histRes, statsRes, relatedRes] = await Promise.all([
      getProduct({ path: { id: productId } }),
      client.get<ProductMatch[]>({ url: buildMatchesUrl(productId) }).catch(() => ({ data: [] })),
      getPriceHistory({ path: { id: productId }, query: { days: 90 } }).catch(() => []),
      getPriceStats({ path: { id: productId }, query: { days: 90 } }).catch(() => null),
      client.get<Product[]>({ url: buildRelatedProductsUrl(productId) }).catch(() => ({ data: [] })),
    ])

    product.value = pRes as Product
    matches.value = (mRes as any)?.data || mRes || []
    priceHistory.value = (histRes as PricePoint[]) || []
    priceStats.value = statsRes as PriceHistoryStats | null
    relatedProducts.value = (relatedRes as any)?.data || relatedRes || []
  }
  catch (e) {
    console.error('Failed to load product', e)
  }
  finally {
    loading.value = false
  }
})

useHead({
  title: computed(() => product.value?.name || 'Product'),
})
</script>
