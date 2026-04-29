<template>
  <div class="my-4">
    <div class="flex items-center mb-2">
      <UiHeaderLabel
        class="mt-1"
        :label="$t('visualSimilarity.title')"
        :sm="true"
        :accent="true"
      />
      <UiTooltipHover
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
          class="block w-32 h-32 border-2 border-dashed border-secondary rounded cursor-pointer flex items-center justify-center overflow-hidden bg-dark"
          :class="{ 'opacity-50 cursor-not-allowed': !hasCollectorPlan || preparing }"
        >
          <img
            v-if="thumbDataUrl"
            :src="thumbDataUrl"
            class="w-full h-full object-cover"
            alt="reference"
          >
          <span
            v-else
            class="text-light text-xs text-center px-2"
          >
            {{ $t('visualSimilarity.uploadHint') }}
          </span>
          <input
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
      </div>

      <!-- Threshold slider -->
      <div class="flex-grow w-full">
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
        <p
          v-if="error"
          class="text-danger text-xs mt-2"
        >
          {{ error }}
        </p>
        <p
          v-else-if="preparing"
          class="text-info text-xs mt-2"
        >
          {{ $t('visualSimilarity.preparing') }}
        </p>
        <p
          v-else-if="hasEmbedding"
          class="text-success text-xs mt-2"
        >
          {{ $t('visualSimilarity.ready') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string // serialized JSON payload (or empty string)
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const userStore = useUserStore()
const hasCollectorPlan = computed(() => {
  const product = userStore.currentPlan?.product
  return product === 'collector' || product === 'flipper'
})

interface Payload {
  threshold: number
  emb: number[]
  thumb: string
  thumbMime: string
}

const threshold = ref(0.7)
const thumbDataUrl = ref<string>('')
const embedding = ref<number[]>([])
const thumbBase64 = ref<string>('')
const thumbMime = ref<string>('image/jpeg')
const preparing = ref(false)
const error = ref<string>('')

const hasEmbedding = computed(() => embedding.value.length > 0)

// Load existing value (edit mode)
function loadFromValue(raw: string) {
  if (!raw) return
  try {
    const p = JSON.parse(raw) as Payload
    threshold.value = p.threshold ?? 0.7
    embedding.value = p.emb ?? []
    thumbBase64.value = p.thumb ?? ''
    thumbMime.value = p.thumbMime ?? 'image/jpeg'
    if (thumbBase64.value) {
      thumbDataUrl.value = `data:${thumbMime.value};base64,${thumbBase64.value}`
    }
  }
  catch (e) {
    console.warn('VisualSimilarityFilter: failed to parse value', e)
  }
}

watch(() => props.modelValue, loadFromValue, { immediate: true })

function emitPayload() {
  if (!hasEmbedding.value) {
    emit('update:modelValue', '')
    return
  }
  const payload: Payload = {
    threshold: threshold.value,
    emb: embedding.value,
    thumb: thumbBase64.value,
    thumbMime: thumbMime.value,
  }
  emit('update:modelValue', JSON.stringify(payload))
}

watch(threshold, emitPayload)

function clear() {
  thumbDataUrl.value = ''
  thumbBase64.value = ''
  embedding.value = []
  error.value = ''
  emit('update:modelValue', '')
}

async function onFileSelected(ev: Event) {
  error.value = ''
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!hasCollectorPlan.value) {
    error.value = useI18n().t('visualSimilarity.collectorRequired')
    input.value = ''
    return
  }

  try {
    preparing.value = true
    // Resize/compress to ~256x256 JPEG to keep payload small
    const compressed = await compressImage(file, 256, 0.85)
    thumbDataUrl.value = compressed.dataUrl
    thumbBase64.value = compressed.base64
    thumbMime.value = 'image/jpeg'

    // Ask backend to embed it (single CLIP call, stored on the filter)
    const apiToken = userStore.token ? `Bearer ${userStore.token}` : ''
    const res = await $fetch<{ embedding: number[], dimensions: number, threshold: number, thumbBase64: string, thumbMime: string } | { emb: number[], threshold: number, thumb: string, thumbMime: string }>(
      'https://ane.coflnet.com/api/filters/visual-similarity/prepare',
      {
        method: 'POST',
        headers: apiToken ? { Authorization: apiToken } : {},
        body: {
          imageBase64: thumbBase64.value,
          imageMime: 'image/jpeg',
          threshold: threshold.value,
        },
      },
    )
    // C# property naming: PascalCase → camelCase serialization → emb/thumb
    const emb = (res as { emb?: number[], embedding?: number[] }).emb
      ?? (res as { emb?: number[], embedding?: number[] }).embedding
    if (!emb || emb.length === 0) throw new Error('No embedding returned')
    embedding.value = emb
    emitPayload()
  }
  catch (e: unknown) {
    console.error('VisualSimilarity prepare failed', e)
    const msg = (e as { data?: { error?: string }, message?: string })?.data?.error
      ?? (e as { message?: string })?.message
      ?? 'Failed to prepare image'
    error.value = msg
    embedding.value = []
    emit('update:modelValue', '')
  }
  finally {
    preparing.value = false
    input.value = ''
  }
}

interface CompressedImage {
  base64: string
  dataUrl: string
}

async function compressImage(file: File, maxDim: number, quality: number): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('FileReader failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Image decode failed'))
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
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
