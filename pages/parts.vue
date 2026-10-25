<template>
  <div class="container mx-auto max-w-6xl px-4 py-8">
    <nav
      class="mb-6 flex gap-4 text-sm"
      :aria-label="t('parts.tools')"
    >
      <NuxtLink
        :to="localePath('/search')"
        class="text-slate-400 hover:text-white"
      >{{ t('appHeaderSearch') }}</NuxtLink>
      <span
        class="text-cyan-300"
        aria-current="page"
      >{{ t('parts.nav') }}</span>
    </nav>
    <h1 class="text-3xl font-bold text-white">
      {{ t('parts.title') }}
    </h1>
    <p class="mt-3 max-w-3xl text-slate-300">
      {{ t('parts.subtitle') }}
    </p>

    <NuxtLink
      :to="localePath({ path: '/search', query: searchRouteQuery(form.q || form.partNumber || form.machine, true) })"
      class="mt-4 inline-block text-sm text-cyan-300 hover:text-cyan-200"
      data-testid="parts-individual-offers"
    >{{ t('parts.findIndividualOffers') }} →</NuxtLink>

    <form
      class="mt-8 grid gap-6 lg:grid-cols-3"
      @submit.prevent="search"
    >
      <div class="space-y-6 lg:col-span-2">
        <section
          class="rounded-xl border border-slate-700 bg-slate-800/60 p-5"
          :aria-label="t('parts.describe')"
        >
          <h2 class="mb-4 text-lg font-semibold text-white">
            {{ t('parts.describe') }}
          </h2>
          <label
            for="part-query"
            class="mb-2 block text-sm text-slate-300"
          >{{ t('parts.query') }}</label>
          <input
            id="part-query"
            v-model="form.q"
            type="search"
            maxlength="200"
            class="part-input"
            :placeholder="t('parts.queryPlaceholder')"
            data-testid="parts-query"
            @input="clearInferred"
          >
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="example in examples"
              :key="example.q"
              type="button"
              class="rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-300 hover:border-cyan-400"
              @click="useExample(example)"
            >
              {{ example.label }}
            </button>
          </div>
          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <label class="text-sm text-slate-300">{{ t('parts.class') }}
              <select
                v-model="form.class"
                class="part-input mt-2"
                data-testid="parts-class"
                @change="onClassChange"
              >
                <option value="">{{ t('parts.auto') }}</option>
                <option
                  v-for="kind in partClasses"
                  :key="kind"
                  :value="kind"
                >{{ t(`parts.classes.${kind}`) }}</option>
              </select>
            </label>
            <label
              v-for="field in identityFields"
              :key="field"
              class="text-sm text-slate-300"
            >{{ t(`parts.fields.${field}`) }}
              <input
                v-model="form[field]"
                type="text"
                maxlength="200"
                class="part-input mt-2"
                :data-testid="`parts-${field}`"
              >
            </label>
          </div>
        </section>

        <section
          class="rounded-xl border border-slate-700 bg-slate-800/60 p-5"
          :aria-label="t('parts.measure')"
        >
          <h2 class="text-lg font-semibold text-white">
            {{ t('parts.measure') }}
          </h2>
          <p class="mt-2 text-sm text-slate-400">
            {{ t('parts.measureHint') }}
          </p>
          <label
            v-if="toothed"
            class="mt-4 block text-sm text-slate-300"
          >{{ t('parts.gearState') }}
            <select
              v-model="form.mode"
              class="part-input mt-2"
              data-testid="parts-mode"
            >
              <option value="full">{{ t('parts.full') }}</option>
              <option value="fragment">{{ t('parts.fragment') }}</option>
            </select>
          </label>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <label
              v-for="field in measurementFields"
              :key="field"
              class="text-sm text-slate-300"
            >{{ t(`parts.fields.${field}`) }}
              <input
                v-model="form[field]"
                type="number"
                :step="['teeth', 'teeth_observed'].includes(field) ? '1' : 'any'"
                :min="field === 'teeth_observed' ? 2 : field === 'teeth' ? 1 : 0.001"
                :max="field === 'arc_degrees' ? 360 : ['teeth', 'teeth_observed'].includes(field) ? 400 : 10000"
                class="part-input mt-2"
                :data-testid="`parts-${field}`"
              >
            </label>
          </div>
          <details class="mt-5 text-sm text-slate-300">
            <summary class="cursor-pointer text-cyan-300">
              {{ t('parts.tolerance') }}
            </summary>
            <p class="my-3 text-slate-400">
              {{ t('parts.toleranceHint') }}
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <label>{{ t('parts.relativeTolerance') }}
                <select
                  v-model="form.tolerance"
                  class="part-input mt-2"
                >
                  <option value="0.01">1%</option><option value="0.02">2%</option><option value="0.05">5%</option><option value="0.08">8%</option><option value="0.1">10%</option>
                </select>
              </label>
              <label>{{ t('parts.absoluteTolerance') }}
                <input
                  v-model="form.toleranceMm"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  class="part-input mt-2"
                >
              </label>
            </div>
          </details>
        </section>
      </div>

      <aside class="space-y-5">
        <section
          class="rounded-xl border border-slate-700 bg-slate-800/60 p-5"
          :aria-label="t('parts.photo')"
        >
          <h2 class="text-lg font-semibold text-white">
            {{ t('parts.photo') }}
          </h2>
          <p class="my-3 text-sm text-slate-400">
            {{ t('parts.photoHint') }}
          </p>
          <input
            id="gear-photo"
            ref="photoInput"
            type="file"
            accept="image/jpeg,image/png"
            class="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white"
            :aria-label="t('parts.choosePhoto')"
            data-testid="parts-photo-input"
            @change="choosePhoto"
          >
          <img
            v-if="photoPreview"
            :src="photoPreview"
            :alt="t('parts.photoPreview')"
            class="mt-4 max-h-56 w-full rounded-lg object-contain"
          >
          <button
            v-if="photoBase64"
            type="button"
            class="mt-4 w-full rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-600 disabled:opacity-50"
            :disabled="photoLoading"
            data-testid="parts-analyze"
            @click="analyzePhoto"
          >
            {{ photoLoading ? t('parts.analyzing') : t('parts.analyze') }}
          </button>
          <p
            v-if="photoError"
            role="alert"
            class="mt-3 text-sm text-amber-300"
          >
            {{ photoError }}
          </p>
          <div
            v-if="photoEstimate"
            role="status"
            class="mt-4 rounded-lg border border-cyan-800 bg-cyan-950/30 p-3 text-sm text-cyan-100"
            data-testid="parts-photo-estimate"
          >
            <p
              v-if="photoEstimate.teeth || photoEstimate.teethEstimatedFromFragment"
              class="font-medium"
            >
              {{ t('parts.estimatedTeeth', { count: photoEstimate.teeth || photoEstimate.teethEstimatedFromFragment }) }}
            </p>
            <p class="mt-1">
              {{ t('parts.reviewEstimate') }}
            </p>
          </div>
        </section>
        <div class="sticky top-4 rounded-xl border border-slate-700 bg-slate-800 p-5">
          <button
            type="submit"
            class="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            :disabled="loading"
            data-testid="parts-search"
          >
            {{ loading ? t('parts.searching') : t('parts.search') }}
          </button>
          <button
            type="button"
            class="mt-3 w-full py-2 text-sm text-slate-300 hover:text-white"
            @click="reset"
          >
            {{ t('parts.reset') }}
          </button>
          <p
            v-if="error"
            role="alert"
            class="mt-3 text-sm text-amber-300"
            data-testid="parts-error"
          >
            {{ error }}
          </p>
          <p class="mt-3 text-xs text-slate-400">
            {{ t('parts.shareHint') }}
          </p>
        </div>
      </aside>
    </form>

    <section
      v-if="hasSearched"
      class="mt-10"
      aria-live="polite"
      :aria-busy="loading"
      data-testid="parts-results"
    >
      <h2 class="text-2xl font-semibold text-white">
        {{ t('parts.results', { count: results?.items.length || 0 }) }}
      </h2>
      <p
        v-if="results?.estimate"
        class="mt-3 text-cyan-300"
      >
        {{ t('parts.range', { min: results.estimate.min, max: results.estimate.max }) }}
      </p>
      <p
        v-if="results?.items.length"
        class="my-4 text-sm text-slate-400"
      >
        {{ t('parts.compareHint') }}
      </p>
      <div
        v-if="results?.items.length"
        class="grid gap-4 md:grid-cols-2"
      >
        <article
          v-for="hit in results.items"
          :key="hit.id"
          class="rounded-xl border border-slate-700 bg-slate-800/60 p-5"
          data-testid="part-result"
        >
          <NuxtLink
            :to="localePath(`/product/${hit.id}`)"
            class="flex items-start gap-4"
          >
            <img
              v-if="hit.imageUrl"
              :src="hit.imageUrl"
              alt=""
              loading="lazy"
              class="h-24 w-24 shrink-0 rounded-lg object-contain"
            >
            <div><h3 class="font-semibold text-white">{{ hit.name }}</h3><p class="mt-2 text-cyan-300">{{ hit.minPrice ? formatPrice(hit.minPrice) : t('parts.priceUnknown') }}</p><p class="mt-1 text-sm text-slate-400">{{ t('parts.offers', { count: hit.listingCount }) }}</p></div>
          </NuxtLink>
          <dl class="mt-4 grid grid-cols-2 gap-2 text-sm">
            <template
              v-for="field in resultFields"
              :key="field"
            >
              <dt class="text-slate-400">
                {{ t(`parts.fields.${field}`) }}
              </dt><dd class="text-slate-200">
                {{ hit[field] ?? t('parts.unknown') }}
              </dd>
            </template>
          </dl>
          <p
            v-if="hit.via !== 'direct'"
            class="mt-4 text-sm text-amber-200"
          >
            {{ t(hit.via === 'same_part_confirmed' ? 'parts.sharedIdentifier' : 'parts.possibleMatch') }}
          </p>
          <NuxtLink
            :to="localePath(`/product/${hit.id}`)"
            class="mt-4 inline-block text-sm font-medium text-blue-300 hover:text-blue-200"
          >{{ t('parts.viewOffers') }} →</NuxtLink>
        </article>
      </div>
      <div
        v-else-if="!loading && !error"
        class="mt-4 rounded-xl border border-slate-700 p-6 text-slate-300"
        data-testid="parts-empty"
      >
        <p>{{ t('parts.noResults') }}</p><p class="mt-2 text-sm text-slate-400">
          {{ t('parts.noResultsHint') }}
        </p>
        <NuxtLink
          :to="localePath({ path: '/search', query: searchRouteQuery(form.q || form.partNumber || form.machine, true) })"
          class="mt-4 inline-block text-blue-300"
        >{{ t('parts.tryCatalog') }} →</NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { partClasses, partFormFromQuery, partSearchParams, type PartField, type PartHit, type PartResults, type GearPhotoEstimate } from '~/utils/partSearch'
import { searchRouteQuery } from '~/utils/searchQuery'
import { useFormat } from '~/composable/useFormat'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const apiBase = useApiBaseUrl()
const { formatCurrency } = useFormat()
const form = reactive(partFormFromQuery(route.query))
const loading = ref(false)
const error = ref('')
const results = ref<PartResults | null>(null)
const hasSearched = ref(false)
const photoBase64 = ref('')
const photoPreview = ref('')
const photoLoading = ref(false)
const photoError = ref('')
const photoEstimate = ref<GearPhotoEstimate | null>(null)
const photoDirty = ref(false)
const photoInput = ref<HTMLInputElement | null>(null)
const submitted = ref(JSON.stringify(partSearchParams(form)))
let request: AbortController | undefined
let photoRequest: AbortController | undefined
let navigating = false
let photoVersion = 0
const inferredFields = new Map<PartField | 'class', string>()
const dirty = computed(() => photoDirty.value || JSON.stringify(partSearchParams(form)) !== submitted.value)
const toothed = computed(() => ['', 'gear', 'sprocket', 'pulley'].includes(form.class))
const identityFields = computed<PartField[]>(() => form.class === 'bearing' ? ['part_key', 'partNumber', 'machine'] : ['partNumber', 'machine'])
const measurementFields = computed<PartField[]>(() => [
  ...(toothed.value ? form.mode === 'fragment' ? ['teeth_observed', 'arc_degrees'] : ['teeth'] : []),
  'outerDiameterMm', form.class === 'bearing' ? 'innerDiameterMm' : 'boreMm', 'widthMm',
  ...(toothed.value ? ['module'] : []),
] as PartField[])
const resultFields = ['teeth', 'outerDiameterMm', 'boreMm', 'innerDiameterMm', 'widthMm', 'module', 'partNumber'] as const satisfies readonly (keyof PartHit)[]
const examples = computed(() => [
  { q: 'Zahnrad 42 Zähne Bohrung 8 mm', kind: 'gear', label: t('parts.gearExample') },
  { q: 'Kugellager 6203-2RS', kind: 'bearing', label: '6203-2RS' },
])

useHead({ title: computed(() => `${t('parts.title')} | ane.deals`) })

function formatPrice(value: number) {
  return formatCurrency(value, 'EUR', locale.value)
}

function useExample(example: { q: string, kind: string }) {
  inferredFields.clear()
  Object.assign(form, partFormFromQuery({ q: example.q, class: example.kind }))
}

function clearInferred() {
  for (const [key, value] of inferredFields) {
    if (form[key] === value) form[key] = ''
  }
  inferredFields.clear()
}

function onClassChange() {
  inferredFields.delete('class')
  photoRequest?.abort()
  photoEstimate.value = null
}

async function fetchResults() {
  request?.abort()
  const current = new AbortController()
  request = current
  loading.value = true
  error.value = ''
  hasSearched.value = true
  const criteria = JSON.stringify(partSearchParams(form))
  try {
    const query = partSearchParams(form)
    delete query.mode
    const response = await $fetch<PartResults>(`${apiBase}/api/parts/search`, { query, signal: current.signal })
    if (!current.signal.aborted) {
      results.value = response
      if (JSON.stringify(partSearchParams(form)) !== criteria) return
      if (!form.class && typeof response.query.partClass === 'string') {
        form.class = response.query.partClass
        inferredFields.set('class', form.class)
      }
      for (const key of ['teeth', 'outerDiameterMm', 'boreMm', 'innerDiameterMm', 'module', 'widthMm', 'partNumber', 'machine'] as const) {
        if (!form[key] && response.query[key] != null) {
          form[key] = String(response.query[key])
          inferredFields.set(key, form[key])
        }
      }
      if (!form.part_key && response.query.partKey) {
        form.part_key = String(response.query.partKey)
        inferredFields.set('part_key', form.part_key)
      }
      submitted.value = JSON.stringify(partSearchParams(form))
    }
  }
  catch (e: unknown) {
    if (current.signal.aborted) return
    const status = (e as { statusCode?: number }).statusCode
    error.value = t(status === 400 ? 'parts.invalidQuery' : 'parts.searchError')
    results.value = null
  }
  finally { if (request === current) loading.value = false }
}

async function search() {
  const query = partSearchParams(form)
  if (!['q', 'teeth', 'teeth_observed', 'part_key', 'partNumber', 'machine'].some(key => query[key]) && !(query.module && query.outerDiameterMm)) {
    error.value = t('parts.needIdentity')
    return
  }
  submitted.value = JSON.stringify(query)
  navigating = true
  try {
    await router.push({ query })
  }
  finally { navigating = false }
  await fetchResults()
}

async function reset() {
  request?.abort()
  photoRequest?.abort()
  photoVersion++
  inferredFields.clear()
  Object.assign(form, partFormFromQuery({}))
  submitted.value = JSON.stringify(partSearchParams(form))
  results.value = null
  hasSearched.value = false
  error.value = ''
  photoError.value = ''
  photoBase64.value = ''
  photoEstimate.value = null
  photoDirty.value = false
  if (photoInput.value) photoInput.value.value = ''
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = ''
  navigating = true
  try {
    await router.push({ query: {} })
  }
  finally { navigating = false }
}

async function choosePhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const version = ++photoVersion
  photoRequest?.abort()
  photoError.value = ''
  photoEstimate.value = null
  photoBase64.value = ''
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = ''
  if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 15 * 1024 * 1024) {
    photoError.value = t('parts.photoTypeError')
    return
  }
  try {
    const image = await createImageBitmap(file)
    if (version !== photoVersion) {
      image.close()
      return
    }
    const ratio = Math.min(1, 1200 / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * ratio))
    canvas.height = Math.max(1, Math.round(image.height * ratio))
    const context = canvas.getContext('2d')!
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    image.close()
    photoBase64.value = canvas.toDataURL('image/jpeg', 0.9)
    if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
    photoPreview.value = URL.createObjectURL(file)
    photoDirty.value = true
  }
  catch { photoError.value = t('parts.photoReadError') }
}

async function analyzePhoto() {
  photoRequest?.abort()
  const current = new AbortController()
  photoRequest = current
  photoLoading.value = true
  photoError.value = ''
  try {
    const estimate = await $fetch<GearPhotoEstimate>(`${apiBase}/api/parts/photo`, {
      method: 'POST', body: { imageBase64: photoBase64.value, mode: form.mode }, signal: current.signal,
    })
    if (current.signal.aborted) return
    photoEstimate.value = estimate
    if (form.mode === 'fragment' && estimate.teethObserved && estimate.arcDegrees) {
      form.class = 'gear'
      form.teeth_observed = String(estimate.teethObserved)
      form.arc_degrees = String(Math.round(estimate.arcDegrees * 10) / 10)
    }
    else if (form.mode === 'full' && estimate.teeth) {
      form.class = 'gear'
      form.teeth = String(estimate.teeth)
    }
    else photoError.value = t('parts.photoUnclear')
    photoDirty.value = false
  }
  catch (e: unknown) {
    if (!current.signal.aborted) photoError.value = t((e as { statusCode?: number }).statusCode === 429 ? 'parts.photoBusy' : 'parts.photoError')
  }
  finally { if (photoRequest === current) photoLoading.value = false }
}

watch(() => route.query, () => {
  if (navigating) return
  inferredFields.clear()
  Object.assign(form, partFormFromQuery(route.query))
  submitted.value = JSON.stringify(partSearchParams(form))
  if (Object.keys(route.query).length) fetchResults()
  else {
    results.value = null
    hasSearched.value = false
  }
})
watch(() => form.mode, () => {
  photoRequest?.abort()
  photoEstimate.value = null
})
const confirmNavigation = () => !dirty.value || window.confirm(t('parts.discardDraft'))
onBeforeRouteLeave(confirmNavigation)
onBeforeRouteUpdate(() => navigating || confirmNavigation())
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
  if (Object.keys(route.query).length) fetchResults()
})
onBeforeUnmount(() => {
  request?.abort()
  photoRequest?.abort()
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  window.removeEventListener('beforeunload', beforeUnload)
})
</script>

<style scoped>
.part-input { @apply w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400; }
</style>
