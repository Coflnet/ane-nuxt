<template>
  <div class="my-4">
    <div
      v-if="!isStyle || !hasCollectorPlan"
      class="flex items-center mb-2"
    >
      <UiHeaderLabel
        v-if="!isStyle"
        class="mt-1"
        :label="$t('visualSimilarity.title')"
        :sm="true"
        :accent="true"
      />
      <UiTooltipHover
        v-if="!isStyle"
        :text="$t('visualSimilarity.info')"
        class="mr-2 mt-1"
      >
        <UiQuestionMarkIcon />
      </UiTooltipHover>
      <div
        v-if="!hasCollectorPlan"
        class="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full"
      >
        {{ $t('pricing.plans.collector.name') }}
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-4 items-start">
      <!-- Reference image upload + preview -->
      <div class="flex-shrink-0">
        <label
          class="block w-40 h-40 border-2 border-dashed border-secondary rounded cursor-pointer flex items-center justify-center overflow-hidden bg-dark"
          :class="{ 'opacity-50 cursor-not-allowed': !hasCollectorPlan || preparing }"
        >
          <img
            v-if="thumbDataUrl"
            :src="thumbDataUrl"
            class="w-full h-full object-contain"
            alt="reference"
          >
          <span
            v-else
            class="text-light text-xs text-center px-2"
          >
            {{ $t('visualSimilarity.uploadHint') }}
          </span>
          <input
            :aria-label="$t('styleSearch.referencePhoto')"
            type="file"
            accept="image/*"
            class="hidden"
            :disabled="!hasCollectorPlan || preparing"
            @change="onFileSelected"
          >
        </label>
        <button
          v-if="thumbDataUrl"
          type="button"
          class="btn btn-sm btn-link text-danger p-0 mt-1 d-block"
          @click="clear"
        >
          {{ $t('remove') }}
        </button>
        <details
          v-if="isStyle && sourceDataUrl"
          class="w-full md:w-64"
        >
          <summary class="cursor-pointer text-sm mb-2">
            {{ $t('styleSearch.editPhoto') }}
          </summary>
          <p class="text-sm mb-2">
            {{ $t('styleSearch.cropHint') }}
          </p>
          <div
            class="relative inline-block touch-none select-none"
            @pointerdown="startCrop"
            @pointermove="moveCrop"
            @pointerup="endCrop"
            @pointercancel="endCrop"
          >
            <img
              :src="sourceDataUrl"
              class="max-h-64 max-w-full pointer-events-none"
              :alt="$t('styleSearch.reference')"
              draggable="false"
            >
            <div
              v-if="crop"
              class="absolute border-2 border-white bg-indigo-500/20 pointer-events-none"
              :style="{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }"
            />
          </div>
        </details>
        <div
          v-if="isStyle && crop"
          class="flex gap-3 text-sm mt-2"
        >
          <button
            type="button"
            class="underline"
            :disabled="!crop || preparing"
            @click="applyCrop"
          >
            {{ $t('styleSearch.applyCrop') }}
          </button>
          <button
            type="button"
            class="underline"
            :disabled="preparing"
            @click="useFullImage"
          >
            {{ $t('styleSearch.fullImage') }}
          </button>
        </div>
      </div>

      <!-- Threshold controls -->
      <div class="flex-grow w-full">
        <div
          v-if="isStyle"
          class="grid grid-cols-2 gap-x-3 max-w-md"
        >
          <div>
            <label
              class="block text-sm mb-1"
              for="style-garment"
            >{{ $t('styleSearch.garmentType') }}</label>
            <select
              id="style-garment"
              v-model="garmentType"
              class="w-full bg-dark border border-secondary rounded p-2"
              required
            >
              <option value="">
                {{ $t('styleSearch.chooseType') }}
              </option>
              <option
                v-for="type in garmentTypes"
                :key="type"
                :value="type"
              >
                {{ $t(`styleSearch.types.${type}`) }}
              </option>
            </select>
          </div>
          <div>
            <label
              for="style-size"
              class="block text-sm mb-1"
            >{{ $t('styleSearch.size') }}</label>
            <input
              id="style-size"
              v-model="size"
              class="w-full bg-dark border border-secondary rounded p-2"
              :placeholder="$t('styleSearch.sizeHint')"
            >
          </div>
          <details class="mt-3 col-span-2">
            <summary class="cursor-pointer text-sm">
              {{ $t('styleSearch.moreOptions') }}
            </summary>
            <label
              for="style-threshold"
              class="block text-sm mt-3"
            >{{ $t('styleSearch.matchRange') }}</label>
            <select
              id="style-threshold"
              v-model.number="threshold"
              class="w-full bg-dark border border-secondary rounded p-2"
            >
              <option :value="0.70">
                {{ $t('styleSearch.broader') }}
              </option>
              <option :value="0.80">
                {{ $t('styleSearch.balanced') }}
              </option>
              <option :value="0.88">
                {{ $t('styleSearch.closer') }}
              </option>
            </select>
          </details>
        </div>
        <template v-else>
          <label class="block text-sm mb-1">
            {{ $t('visualSimilarity.threshold') }}: {{ threshold.toFixed(2) }}
          </label>
          <input
            v-model.number="threshold"
            type="range"
            min="0.5"
            max="0.95"
            step="0.01"
            class="w-full"
            :disabled="!hasCollectorPlan"
          >
          <div class="flex justify-between text-xs text-light">
            <span>{{ $t('visualSimilarity.broader') }}</span>
            <span>{{ $t('visualSimilarity.stricter') }}</span>
          </div>
        </template>
        <p
          v-if="error"
          class="text-danger text-xs mt-2"
        >
          {{ error }}
          <button
            v-if="pendingFile"
            type="button"
            class="underline ml-2"
            :disabled="preparing || !hasCollectorPlan"
            @click="prepareImage(pendingFile, crop)"
          >
            {{ $t('retry') }}
          </button>
        </p>
        <p
          v-else-if="preparing"
          class="text-info text-xs mt-2"
        >
          {{ $t('visualSimilarity.preparing') }}
        </p>
        <p
          v-else-if="!isStyle && hasEmbedding && provenance"
          class="text-success text-xs mt-2"
        >
          {{ $t('visualSimilarity.ready') }}
        </p>
        <p
          v-if="hasEmbedding && !provenance"
          class="text-amber-300 text-xs mt-2"
        >
          {{ $t('visualSimilarity.refreshRequired') }}
          <button
            v-if="thumbBase64"
            type="button"
            class="underline ml-2"
            :disabled="preparing || !hasCollectorPlan"
            @click="refreshReference"
          >
            {{ $t('visualSimilarity.refresh') }}
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string // serialized JSON payload (or empty string)
  styleMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'ready', value: boolean): void
  (e: 'dirty'): void
}>()

const userStore = useUserStore()
const hasCollectorPlan = computed(() => {
  const product = userStore.currentPlan?.product
  return product === 'collector' || product === 'flipper'
})

const garmentTypes = ['jacket', 'coat', 'dress', 'shirt', 'tshirt', 'sweatshirt', 'sweater', 'trousers', 'jeans', 'shorts', 'skirt', 'shoes', 'boots', 'bag'] as const
const garmentType = ref('')
const size = ref('')
const savedStyle = ref(false)
const isStyle = computed(() => props.styleMode || savedStyle.value)
const sourceDataUrl = ref('')
const sourceFile = shallowRef<File | null>(null)
const crop = ref<{ x: number, y: number, w: number, h: number } | null>(null)
let cropStart: { x: number, y: number } | null = null
const cropPending = ref(false)

interface StyleExample {
  sourceListingId: string
  sourcePlatform: string
  sourceImageUrl: string
  emb: number[]
  provenance: Record<string, unknown>
  positive: boolean
}
const examples = ref<StyleExample[]>([])

interface Payload {
  examples?: StyleExample[]
  mode?: 'style'
  garmentType?: string
  size?: string
  threshold: number
  emb: number[]
  thumb: string
  thumbMime: string
  provenance?: Record<string, unknown>
}

const threshold = ref(props.styleMode ? 0.8 : 0.7)
const thumbDataUrl = ref<string>('')
const embedding = ref<number[]>([])
const thumbBase64 = ref<string>('')
const thumbMime = ref<string>('image/jpeg')
const provenance = ref<Record<string, unknown> | undefined>()
const preparing = ref(false)
const error = ref<string>('')
const pendingFile = shallowRef<File | null>(null)
let preparation: AbortController | undefined

const hasEmbedding = computed(() => embedding.value.length > 0)

// Load existing value (edit mode)
function loadFromValue(raw: string) {
  if (raw === serializedPayload()) return // Parent echoes must not cancel an in-flight replacement.
  cancelPreparation()
  if (!raw) {
    resetImage()
    return
  }
  try {
    const p = JSON.parse(raw) as Payload
    threshold.value = p.threshold ?? (props.styleMode ? 0.8 : 0.7)
    examples.value = (p.examples ?? []).slice(0, 4)
    savedStyle.value = p.mode === 'style'
    garmentType.value = p.garmentType ?? ''
    size.value = p.size ?? ''
    embedding.value = p.emb ?? []
    thumbBase64.value = p.thumb ?? ''
    thumbMime.value = p.thumbMime ?? 'image/jpeg'
    provenance.value = p.provenance
    thumbDataUrl.value = thumbBase64.value ? `data:${thumbMime.value};base64,${thumbBase64.value}` : ''
  }
  catch (e) {
    console.warn('VisualSimilarityFilter: failed to parse value', e)
  }
}

watch(() => props.modelValue, loadFromValue, { immediate: true })

function serializedPayload() {
  if (!hasEmbedding.value) return ''
  const payload: Payload = {
    ...(isStyle.value ? { ...(examples.value.length ? { examples: examples.value } : {}), mode: 'style' as const, garmentType: garmentType.value, ...(size.value.trim() ? { size: size.value.trim() } : {}) } : {}),
    threshold: threshold.value,
    emb: embedding.value,
    thumb: thumbBase64.value,
    thumbMime: thumbMime.value,
    provenance: provenance.value,
  }
  return JSON.stringify(payload)
}

function emitPayload() {
  emit('update:modelValue', serializedPayload())
}

watch([threshold, garmentType, size], emitPayload)
watch(() => !preparing.value && !error.value && !cropPending.value && (isStyle.value ? hasEmbedding.value && !!provenance.value && !!garmentType.value : !hasEmbedding.value || !!provenance.value), ready => emit('ready', ready), { immediate: true })

function cancelPreparation() {
  preparation?.abort()
  preparation = undefined
  preparing.value = false
  pendingFile.value = null
  error.value = ''
}

onBeforeUnmount(cancelPreparation)

function resetImage() {
  thumbDataUrl.value = ''
  thumbBase64.value = ''
  embedding.value = []
  provenance.value = undefined
  examples.value = []
  sourceDataUrl.value = ''
  sourceFile.value = null
  crop.value = null
  cropPending.value = false
}

function clear() {
  cancelPreparation()
  resetImage()
  emit('update:modelValue', '')
}

async function onFileSelected(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  emit('dirty')
  sourceFile.value = file
  crop.value = null
  cropPending.value = false
  await prepareImage(file)
}

function refreshReference() {
  try {
    const bytes = Uint8Array.from(atob(thumbBase64.value), char => char.charCodeAt(0))
    void prepareImage(new File([bytes], 'reference.jpg', { type: thumbMime.value }))
  }
  catch {
    error.value = useI18n().t('visualSimilarity.refreshFailed')
  }
}

async function prepareImage(file: File, selectedCrop: typeof crop.value = null) {
  if (!hasCollectorPlan.value) {
    error.value = useI18n().t('visualSimilarity.collectorRequired')
    return
  }

  cancelPreparation()
  const current = new AbortController()
  preparation = current
  pendingFile.value = file
  try {
    preparing.value = true
    // Resize/compress to ~256x256 JPEG to keep payload small
    const compressed = await compressImage(file, 256, 0.85, selectedCrop)
    if (preparation !== current) return
    if (isStyle.value && !selectedCrop) sourceDataUrl.value = compressed.dataUrl

    // Ask backend to embed it (single CLIP call, stored on the filter)
    const apiToken = userStore.token ? `Bearer ${userStore.token}` : ''
    const res = await $fetch<Partial<Payload> & { embedding?: number[], suggestedGarmentType?: string }>(
      'https://ane.coflnet.com/api/filters/visual-similarity/prepare',
      {
        method: 'POST',
        signal: current.signal,
        headers: apiToken ? { Authorization: apiToken } : {},
        body: {
          imageBase64: compressed.base64,
          imageMime: 'image/jpeg',
          ...(isStyle.value ? { mode: 'style' } : {}),
          threshold: threshold.value,
        },
      },
    )
    if (preparation !== current) return
    // C# property naming: PascalCase → camelCase serialization → emb/thumb
    const emb = (res as { emb?: number[], embedding?: number[] }).emb
      ?? (res as { emb?: number[], embedding?: number[] }).embedding
    if (!emb || emb.length === 0 || !res.provenance) throw new Error(useI18n().t('visualSimilarity.refreshFailed'))
    thumbDataUrl.value = compressed.dataUrl
    thumbBase64.value = compressed.base64
    thumbMime.value = 'image/jpeg'
    examples.value = []
    embedding.value = emb
    provenance.value = res.provenance
    if (!garmentType.value && garmentTypes.includes(res.suggestedGarmentType as typeof garmentTypes[number])) garmentType.value = res.suggestedGarmentType!
    cropPending.value = false
    pendingFile.value = null
    emitPayload()
  }
  catch (e: unknown) {
    if (preparation !== current) return
    console.error('VisualSimilarity prepare failed', e)
    const msg = (e as { data?: { error?: string }, message?: string })?.data?.error
      ?? (e as { message?: string })?.message
      ?? 'Failed to prepare image'
    error.value = msg
  }
  finally {
    if (preparation === current) {
      preparation = undefined
      preparing.value = false
    }
  }
}

function cropPoint(event: PointerEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) }
}
function startCrop(event: PointerEvent) {
  if (preparing.value) return
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)
  emit('dirty')
  cropStart = cropPoint(event)
}
function moveCrop(event: PointerEvent) {
  if (!cropStart) return
  const point = cropPoint(event)
  crop.value = { x: Math.min(point.x, cropStart.x), y: Math.min(point.y, cropStart.y), w: Math.abs(point.x - cropStart.x), h: Math.abs(point.y - cropStart.y) }
  cropPending.value = true
}
function endCrop() {
  cropStart = null
  if (crop.value && (crop.value.w < 0.01 || crop.value.h < 0.01)) {
    crop.value = null
    cropPending.value = false
  }
}
function applyCrop() {
  if (sourceFile.value && crop.value) void prepareImage(sourceFile.value, crop.value)
}
function useFullImage() {
  crop.value = null
  if (sourceFile.value) void prepareImage(sourceFile.value)
}

interface CompressedImage {
  base64: string
  dataUrl: string
}

async function compressImage(file: File, maxDim: number, quality: number, selectedCrop: typeof crop.value = null): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('FileReader failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Image decode failed'))
      img.onload = () => {
        const sx = (selectedCrop?.x ?? 0) * img.width
        const sy = (selectedCrop?.y ?? 0) * img.height
        const sw = (selectedCrop?.w ?? 1) * img.width
        const sh = (selectedCrop?.h ?? 1) * img.height
        const scale = Math.min(1, maxDim / Math.max(sw, sh))
        const w = Math.max(1, Math.round(sw * scale))
        const h = Math.max(1, Math.round(sh * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'))
          return
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const base64 = dataUrl.split(',')[1] ?? ''
        resolve({ base64, dataUrl })
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
</script>
