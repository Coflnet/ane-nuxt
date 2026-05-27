<template>
  <section class="mb-6 min-w-0 border border-slate-700 bg-slate-900/40 rounded-lg p-3 sm:p-4">
    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end">
      <UiInput
        v-model="url"
        :label="$t('referenceListingUrl')"
        :placeholder="$t('referenceListingUrlPlaceholder')"
        :footer="$t('referenceListingOptionalHelp')"
        type="url"
      />
      <UiButton
        :primary="true"
        :disabled="!canPreview"
        :proccessing="loading"
        class="w-full lg:w-auto"
        @on-click="loadPreview()"
      >
        <UiIcon
          name="tabler:link-plus"
          bold
        />
        <span>{{ $t('previewReference') }}</span>
      </UiButton>
    </div>

    <p
      v-if="error"
      class="mt-3 text-sm text-rose-300 break-words"
    >
      {{ error }}
    </p>

    <div
      v-if="preview"
      class="mt-4 grid min-w-0 grid-cols-1 xl:grid-cols-[minmax(220px,300px)_minmax(0,1fr)] gap-4"
    >
      <div class="space-y-3">
        <div class="aspect-[4/3] overflow-hidden rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center">
          <img
            v-if="preview.listing.imageUrls[0]"
            :src="preview.listing.imageUrls[0]"
            :alt="preview.listing.title"
            class="h-full w-full object-cover"
          >
          <UiIcon
            v-else
            name="tabler:photo-off"
            large
          />
        </div>

        <div class="space-y-2 text-sm min-w-0">
          <div>
            <p class="text-slate-400">
              {{ $t('referenceSearch') }}
            </p>
            <p class="text-slate-100 font-medium break-words">
              {{ preview.suggestedFilter.searchTerm || preview.listing.productSearchQuery }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <p class="text-slate-400">
                {{ $t('marketplace') }}
              </p>
              <p class="text-slate-100">
                {{ preview.marketplace }}
              </p>
            </div>
            <div>
              <p class="text-slate-400">
                {{ $t('referencePrice') }}
              </p>
              <p class="text-slate-100">
                {{ selectedPriceLabel }}
              </p>
              <p
                v-if="additionalSelectors.length > 0"
                class="mt-1 text-xs text-indigo-200"
              >
                {{ $t('referenceSummedTotal') }}: {{ formatPrice(summedPrice, summedCurrency) }}
              </p>
              <p
                v-if="selectedReference"
                class="mt-1 text-xs text-slate-400"
              >
                {{ $t('referenceDailyRefreshHelp') }}
              </p>
            </div>
          </div>

          <div
            v-if="additionalSelectors.length > 0"
            class="space-y-1"
          >
            <div class="flex flex-wrap gap-1">
              <span
                v-for="(sel, idx) in additionalSelectors"
                :key="sel + idx"
                class="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-100"
              >
                <span class="truncate max-w-[150px]">{{ extraLabel(sel) }}</span>
                <button
                  type="button"
                  class="text-indigo-200 hover:text-white"
                  :aria-label="$t('referenceClearExtras')"
                  @click="removeExtra(idx)"
                >
                  <UiIcon name="tabler:x" />
                </button>
              </span>
            </div>
            <UiButton
              class="w-full"
              @on-click="clearExtras"
            >
              <span>{{ $t('referenceClearExtras') }}</span>
            </UiButton>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row xl:flex-col gap-2">
          <UiButton
            class="w-full"
            @on-click="applySearchOnly"
          >
            <UiIcon
              name="tabler:search"
              bold
            />
            <span>{{ $t('useProductSearch') }}</span>
          </UiButton>
          <UiButton
            :primary="true"
            class="w-full"
            :disabled="!selectedReference"
            @on-click="applyReference"
          >
            <UiIcon
              name="tabler:check"
              bold
            />
            <span>{{ $t('applyReferenceListing') }}</span>
          </UiButton>
        </div>
      </div>

      <div class="min-w-0">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-slate-100">
              {{ $t('pagePreview') }}
            </h3>
            <p
              v-if="preview.requiresReferencePriceSelection && !selectedReference"
              class="text-sm text-amber-300"
            >
              {{ $t('referenceSelectionNeeded') }}
            </p>
            <p class="mt-1 text-xs text-slate-400">
              {{ $t('referenceMultiSelectHint') }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <div class="inline-flex rounded-md border border-slate-700 overflow-hidden text-xs">
              <button
                type="button"
                class="px-2 py-1"
                :class="mode === 'screenshot' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'"
                @click="mode = 'screenshot'"
              >
                {{ $t('referenceModeScreenshot') }}
              </button>
              <button
                type="button"
                class="px-2 py-1"
                :class="mode === 'live' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'"
                @click="mode = 'live'"
              >
                {{ $t('referenceModeLive') }}
              </button>
            </div>
            <a
              :href="preview.url"
              target="_blank"
              rel="noopener noreferrer"
              class="min-w-0 text-xs text-indigo-300 hover:text-indigo-200 break-all"
            >
              {{ preview.host }}
            </a>
          </div>
        </div>

        <!-- Screenshot mode -->
        <div
          v-if="mode === 'screenshot' && preview.screenshotPngBase64"
          class="relative overflow-auto max-h-[600px] rounded-lg border border-slate-700 bg-white"
        >
          <div
            class="relative"
            :style="{
              width: '100%',
              maxWidth: preview.viewportWidth + 'px',
              aspectRatio: `${preview.viewportWidth} / ${preview.fullPageHeight}`,
            }"
          >
            <img
              :src="`data:image/png;base64,${preview.screenshotPngBase64}`"
              :alt="preview.listing.title"
              class="block w-full h-auto select-none"
              draggable="false"
            >
            <button
              v-for="node in preview.renderedNodes"
              :key="node.xpath"
              type="button"
              class="ane-node-overlay"
              :class="nodeButtonClass(node)"
              :style="overlayStyle(node)"
              :aria-label="node.text"
              :title="node.price != null ? formatPrice(node.price, node.currency || 'EUR') : node.text"
              @click.stop="handleNodeClick($event, node)"
              @touchstart.stop="onTouchStart($event, node)"
              @touchend.stop="onTouchEnd($event, node)"
              @touchcancel.stop="onTouchEnd($event, node)"
            />
          </div>
        </div>

        <p
          v-else-if="mode === 'screenshot' && !preview.screenshotPngBase64"
          class="text-sm text-slate-400"
        >
          {{ $t('noReferencePriceCandidates') }}
        </p>

        <!-- Live HTML mode -->
        <div
          v-if="mode === 'live'"
          class="space-y-2"
        >
          <p class="text-xs text-amber-300">
            {{ $t('referenceLiveModeWarning') }}
          </p>
          <iframe
            v-if="preview.sandboxHtml"
            ref="sandboxIframe"
            sandbox="allow-scripts"
            :srcdoc="sandboxSrcDoc"
            style="width:100%; height:600px; border:0; border-radius:8px; background:#fff;"
          />
          <p
            v-else
            class="text-sm text-slate-400"
          >
            {{ $t('noReferencePriceCandidates') }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { client as apiClient } from '~/src/api-client/client.gen'
import { useFormat } from '~/composable/useFormat'
import type { Filter } from '~/types/FilterType'

type ReferenceRenderedNode = {
  xpath: string
  css: string
  role: string
  text: string
  x: number
  y: number
  width: number
  height: number
  price?: number | null
  currency?: string | null
  confidence: number
}

type ReferencePriceCandidate = {
  selector: string
  text: string
  price: number
  currency: string
  confidence: number
  source: string
  isAutoSelected: boolean
}

type ReferenceListingPreviewResponse = {
  url: string
  host: string
  marketplace: string
  listing: {
    title: string
    description: string
    imageUrls: string[]
    productSearchQuery: string
  }
  priceCandidates: ReferencePriceCandidate[]
  previewElements: unknown[]
  selectedReference?: ReferencePriceCandidate | null
  requiresReferencePriceSelection: boolean
  suggestedFilter: {
    searchTerm: string
    marketplace: string
    minPrice: number
    maxPrice?: number | null
    referenceUrl: string
    referenceTitle: string
    referenceMarketplace: string
    referencePrice?: number | null
    referenceCurrency?: string | null
    referenceSelector?: string | null
  }
  screenshotPngBase64?: string | null
  viewportWidth: number
  viewportHeight: number
  fullPageHeight: number
  sandboxHtml?: string | null
  renderedNodes: ReferenceRenderedNode[]
  primarySelectorXPath?: string | null
}

const model = defineModel<Filter>()
const { t, locale } = useI18n()
const { formatCurrency } = useFormat()

const url = ref(model.value?.referenceUrl ?? '')
const loading = ref(false)
const error = ref('')
const preview = ref<ReferenceListingPreviewResponse | null>(null)
const selectedReference = ref<ReferencePriceCandidate | null>(null)
const additionalSelectors = ref<string[]>([])
const mode = ref<'screenshot' | 'live'>('screenshot')
const sandboxIframe = ref<HTMLIFrameElement | null>(null)

// Long-press tracking per-node
const longPressTimers = new Map<string, ReturnType<typeof setTimeout>>()
const longPressFired = new Set<string>()
const LONG_PRESS_MS = 500

const canPreview = computed(() => url.value.trim().length > 0 && !loading.value)

const selectedPriceLabel = computed(() => {
  if (!selectedReference.value)
    return t('selectReferencePrice')
  return formatPrice(selectedReference.value.price, selectedReference.value.currency)
})

const summedCurrency = computed(() => selectedReference.value?.currency || 'EUR')
const summedPrice = computed(() => {
  if (!selectedReference.value || !preview.value)
    return 0
  // The backend returns a candidate with source='summed' whose .price is already the total;
  // don't add the per-extra prices a second time in that case.
  if (selectedReference.value.source === 'summed')
    return Math.round(selectedReference.value.price * 100) / 100
  let total = selectedReference.value.price
  for (const sel of additionalSelectors.value) {
    const candidate = preview.value.priceCandidates.find(c => c.selector === sel)
    if (candidate) {
      total += candidate.price
      continue
    }
    const node = preview.value.renderedNodes.find(n => n.xpath === sel)
    if (node && node.price != null)
      total += node.price
  }
  return Math.round(total * 100) / 100
})

const sandboxSrcDoc = computed(() => {
  if (!preview.value?.sandboxHtml)
    return ''
  const scriptCloseTag = '</scr' + 'ipt>'
  const injection = `<script>(function(){
    function getXPath(el){if(!el||el.nodeType!==1)return '';var segs=[];for(var cur=el;cur&&cur.nodeType===1;cur=cur.parentNode){if(!cur.parentNode)break;var i=1,sib=cur.previousSibling;while(sib){if(sib.nodeType===1&&sib.nodeName===cur.nodeName)i++;sib=sib.previousSibling;}var tag=cur.nodeName.toLowerCase();segs.unshift(tag+'['+i+']');if(tag==='html')break;}return '/'+segs.join('/');}
    var pressTimer=null;var pressFired=false;
    function send(e,type){var el=e.target;if(!el||el.nodeType!==1)return;var rect=el.getBoundingClientRect();var msg={type:'ane-pick',xpath:getXPath(el),text:(el.innerText||'').trim().slice(0,200),x:rect.left,y:rect.top,w:rect.width,h:rect.height,ctrlKey:!!e.ctrlKey,shiftKey:!!e.shiftKey,metaKey:!!e.metaKey,longPress:type==='long'};try{window.parent.postMessage(msg,'*');}catch(err){}}
    document.addEventListener('click',function(e){if(pressFired){pressFired=false;e.preventDefault();return;}e.preventDefault();e.stopPropagation();send(e,'click');},true);
    document.addEventListener('touchstart',function(e){pressFired=false;if(pressTimer)clearTimeout(pressTimer);pressTimer=setTimeout(function(){pressFired=true;send(e,'long');},500);},true);
    document.addEventListener('touchend',function(){if(pressTimer){clearTimeout(pressTimer);pressTimer=null;}},true);
    document.addEventListener('touchcancel',function(){if(pressTimer){clearTimeout(pressTimer);pressTimer=null;}},true);
    document.addEventListener('submit',function(e){e.preventDefault();},true);
  })();${scriptCloseTag}`
  // Inject before </head> if present, otherwise before <body>.
  const html = preview.value.sandboxHtml
  if (/<\/head>/i.test(html))
    return html.replace(/<\/head>/i, injection + '</head>')
  if (/<body[^>]*>/i.test(html))
    return html.replace(/<body([^>]*)>/i, '<body$1>' + injection)
  return injection + html
})

watch(() => model.value?.referenceUrl, (value) => {
  if (value && value !== url.value)
    url.value = value
})

onMounted(() => {
  window.addEventListener('message', onIframeMessage)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onIframeMessage)
  for (const t of longPressTimers.values())
    clearTimeout(t)
  longPressTimers.clear()
})

function onIframeMessage(ev: MessageEvent) {
  const data = ev.data as { type?: string, xpath?: string, shiftKey?: boolean, ctrlKey?: boolean, metaKey?: boolean, longPress?: boolean }
  if (!data || data.type !== 'ane-pick' || !data.xpath)
    return
  const node = preview.value?.renderedNodes.find(n => n.xpath === data.xpath)
  const xpath = data.xpath
  const extra = !!(data.shiftKey || data.ctrlKey || data.metaKey || data.longPress)
  applySelection(xpath, node ?? null, extra)
}

async function loadPreview(extraSelectors?: string[]) {
  if (!canPreview.value && !extraSelectors)
    return
  if (!url.value.trim())
    return

  loading.value = true
  error.value = ''
  const isInitial = !extraSelectors
  if (isInitial) {
    preview.value = null
    selectedReference.value = null
    additionalSelectors.value = []
  }

  try {
    const baseUrl = apiClient.getConfig().baseURL ?? 'https://ane.coflnet.com'
    const endpoint = new URL('/api/reference-listings/preview', baseUrl).toString()
    const result = await $fetch<ReferenceListingPreviewResponse>(endpoint, {
      method: 'POST',
      body: {
        url: url.value.trim(),
        locale: locale.value === 'de' ? 'de-DE' : 'en-US',
        selectedSelector: selectedReference.value?.selector,
        additionalSelectors: extraSelectors ?? additionalSelectors.value,
      },
    })
    preview.value = result
    url.value = result.url
    if (result.selectedReference)
      selectedReference.value = result.selectedReference
    // If extras were applied, push the freshly summed total into the form's max price.
    if (!isInitial && additionalSelectors.value.length > 0)
      applySelectedReference(false)
  }
  catch (e: unknown) {
    console.error('Reference listing preview failed', e)
    const fetchError = e as { data?: { error?: string }, message?: string }
    const code = fetchError.data?.error ?? fetchError.message
    error.value = code ? `${t('referenceListingFailed')}: ${code}` : t('referenceListingFailed')
  }
  finally {
    loading.value = false
  }
}

function nodeButtonClass(node: ReferenceRenderedNode) {
  const isSelected = selectedReference.value && (selectedReference.value.selector === node.xpath || selectedReference.value.selector === node.css)
  const isExtra = additionalSelectors.value.includes(node.xpath)
  if (isSelected) return 'ane-node-selected'
  if (isExtra) return 'ane-node-extra'
  if (node.price != null) return 'ane-node-price'
  return 'ane-node-default'
}

function overlayStyle(node: ReferenceRenderedNode): Record<string, string> {
  if (!preview.value)
    return {}
  const W = preview.value.viewportWidth || 1
  const H = preview.value.fullPageHeight || 1
  return {
    position: 'absolute',
    left: `${(node.x / W) * 100}%`,
    top: `${(node.y / H) * 100}%`,
    width: `${(node.width / W) * 100}%`,
    height: `${(node.height / H) * 100}%`,
  }
}

function handleNodeClick(ev: MouseEvent, node: ReferenceRenderedNode) {
  const extra = ev.shiftKey || ev.ctrlKey || ev.metaKey
  applySelection(node.xpath, node, extra)
}

function onTouchStart(_ev: TouchEvent, node: ReferenceRenderedNode) {
  longPressFired.delete(node.xpath)
  const timer = setTimeout(() => {
    longPressFired.add(node.xpath)
    applySelection(node.xpath, node, true)
  }, LONG_PRESS_MS)
  longPressTimers.set(node.xpath, timer)
}

function onTouchEnd(_ev: TouchEvent, node: ReferenceRenderedNode) {
  const timer = longPressTimers.get(node.xpath)
  if (timer) {
    clearTimeout(timer)
    longPressTimers.delete(node.xpath)
  }
  if (!longPressFired.has(node.xpath))
    applySelection(node.xpath, node, false)
  longPressFired.delete(node.xpath)
}

function applySelection(selector: string, node: ReferenceRenderedNode | null, extra: boolean) {
  if (extra) {
    // Don't add the same selector as primary or an existing extra.
    if (selectedReference.value?.selector === selector)
      return
    if (additionalSelectors.value.includes(selector))
      return
    additionalSelectors.value = [...additionalSelectors.value, selector]
    // Re-fetch so backend sums prices server-side.
    void loadPreview(additionalSelectors.value)
    return
  }

  // Primary selection.
  const candidate = preview.value?.priceCandidates.find(c => c.selector === selector)
  if (candidate) {
    selectedReference.value = candidate
  }
  else if (node && node.price != null) {
    selectedReference.value = {
      selector: node.xpath,
      text: node.text,
      price: node.price,
      currency: node.currency || 'EUR',
      confidence: node.confidence,
      source: 'render',
      isAutoSelected: false,
    }
  }
  else {
    // Node has no price — ignore primary selection.
    return
  }
  // Re-fetch when extras exist so the backend recomputes the summed total.
  if (additionalSelectors.value.length > 0)
    void loadPreview(additionalSelectors.value)
  // Apply the picked price to the form's max-price immediately, no toast.
  applySelectedReference(false)
}

function extraLabel(selector: string) {
  if (!preview.value)
    return selector
  const node = preview.value.renderedNodes.find(n => n.xpath === selector)
  if (node?.price != null)
    return `${formatPrice(node.price, node.currency || 'EUR')}`
  const candidate = preview.value.priceCandidates.find(c => c.selector === selector)
  if (candidate)
    return `${formatPrice(candidate.price, candidate.currency)}`
  return selector.split('/').pop() ?? selector
}

function removeExtra(idx: number) {
  additionalSelectors.value = additionalSelectors.value.filter((_, i) => i !== idx)
  if (additionalSelectors.value.length > 0)
    void loadPreview(additionalSelectors.value)
}

function clearExtras() {
  additionalSelectors.value = []
}

function applySearchOnly() {
  if (!preview.value || !model.value)
    return
  applySearchFields()
  push.success(t('referenceSearchApplied'))
}

function applyReference() {
  if (!preview.value || !model.value || !selectedReference.value)
    return
  applySelectedReference(true)
}

function applySelectedReference(showToast: boolean) {
  if (!preview.value || !model.value || !selectedReference.value)
    return
  applySearchFields()
  const price = additionalSelectors.value.length > 0 ? summedPrice.value : selectedReference.value.price
  model.value.maxPrice = Math.max(1, Math.ceil(price))
  model.value.currency = selectedReference.value.currency
  model.value.referencePrice = Number(price.toFixed(2))
  model.value.referenceCurrency = selectedReference.value.currency
  model.value.referenceSelector = selectedReference.value.selector
  model.value.referenceAdditionalSelectors = [...additionalSelectors.value]
  model.value.referenceUrl = preview.value.url
  model.value.referenceTitle = preview.value.listing.title
  model.value.referenceMarketplace = preview.value.marketplace
  model.value.referenceLastRefreshedAt = new Date().toISOString()

  if (showToast)
    push.success(t('referenceListingApplied'))
}

function applySearchFields() {
  if (!preview.value || !model.value)
    return
  const suggestion = preview.value.suggestedFilter
  model.value.searchValue = suggestion.searchTerm || preview.value.listing.productSearchQuery
}

function formatPrice(value: number, currency?: string | null) {
  return formatCurrency(value, currency || 'EUR', locale.value)
}
</script>

<style scoped>
.ane-node-overlay {
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  transition: outline-color 0.1s ease, background-color 0.1s ease;
  outline: 1px solid transparent;
  outline-offset: -1px;
}
.ane-node-default:hover {
  outline: 1px dashed rgba(99, 102, 241, 0.4);
  background: rgba(99, 102, 241, 0.05);
}
.ane-node-price {
  outline: 1px dashed rgba(99, 102, 241, 0.5);
  background: rgba(99, 102, 241, 0.06);
}
.ane-node-price:hover {
  outline: 2px solid rgba(99, 102, 241, 0.7);
  background: rgba(99, 102, 241, 0.12);
}
.ane-node-selected {
  outline: 2px solid rgb(99, 102, 241);
  background: rgba(99, 102, 241, 0.18);
}
.ane-node-extra {
  outline: 2px solid rgb(16, 185, 129);
  background: rgba(16, 185, 129, 0.15);
}
</style>
