<template>
  <section
    class="mt-3 rounded-xl border border-purple-500/40 bg-slate-900/40 p-3"
    data-testid="photo-entry"
    :aria-label="$t('filterTree.photo.title')"
  >
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-sm font-semibold text-purple-300">
        {{ $t('filterTree.photo.title') }}
      </h3>
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-md hover:bg-slate-700"
        :aria-label="$t('filterTree.photo.close')"
        :title="$t('filterTree.photo.close')"
        @click="$emit('close')"
      >
        <UiIcon name="tabler:x" />
      </button>
    </div>

    <template v-if="!lane">
      <p
        v-if="checkingPlan"
        class="mt-2 text-sm text-slate-400"
      >
        {{ $t('loading') }}
      </p>
      <div
        v-else-if="!hasCollectorPlan"
        class="mt-2 text-sm text-slate-300"
      >
        <p>{{ $t('visualSimilarity.collectorRequired') }}</p>
        <NuxtLink
          :to="localePath('/subscriptions')"
          class="mt-1 inline-block text-indigo-300 underline"
        >
          {{ $t('pricing.plans.collector.name') }}
        </NuxtLink>
      </div>
      <label
        v-else-if="!pendingFile"
        class="mt-2 flex min-h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-600 p-4 text-center text-sm text-slate-300 focus-within:ring-2 focus-within:ring-indigo-400 hover:border-slate-500"
      >
        {{ $t('filterTree.photo.choose') }}
        <input
          type="file"
          accept="image/*"
          class="sr-only"
          data-testid="photo-entry-file"
          :aria-label="$t('filterTree.photo.choose')"
          @change="onFileSelected"
        >
      </label>
      <div
        v-else
        class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <img
          :src="previewUrl"
          alt=""
          class="size-24 shrink-0 rounded-lg object-cover"
        >
        <fieldset class="min-w-0 flex-1">
          <legend class="mb-2 text-sm text-slate-200">
            {{ $t('filterTree.photo.question') }}
          </legend>
          <div class="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              data-testid="photo-lane-style"
              class="min-h-11 rounded-lg bg-purple-500/20 px-3 py-2 text-sm text-purple-300 hover:bg-purple-500/30"
              @click="choose('style')"
            >
              {{ $t('filterTree.photo.clothing') }}
            </button>
            <button
              type="button"
              data-testid="photo-lane-other"
              class="min-h-11 rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-600"
              @click="choose('other')"
            >
              {{ $t('filterTree.photo.other') }}
            </button>
          </div>
        </fieldset>
      </div>
    </template>

    <template v-else>
      <p
        v-if="lane === 'other'"
        class="mt-2 text-sm text-slate-300"
      >
        {{ $t('filterTree.photo.nameIt') }}
        <button
          type="button"
          class="text-indigo-300 underline"
          @click="$emit('focus-search')"
        >
          {{ $t('filterTree.photo.nameItAction') }}
        </button>
      </p>
      <p
        v-else
        class="mt-2 text-sm text-slate-300"
      >
        {{ $t('filterTree.photo.styleHint') }}
      </p>
      <FiltersVisualSimilarityFilter
        :key="lane"
        v-model="visual"
        :style-mode="lane === 'style'"
        :presets="true"
        :file="handedFile"
        @ready="$emit('ready', $event)"
        @dirty="$emit('dirty')"
      />
      <button
        type="button"
        class="text-sm text-indigo-300 underline"
        @click="$emit('change-lane', lane === 'style' ? 'other' : 'style')"
      >
        {{ lane === 'style' ? $t('filterTree.photo.switchToOther') : $t('filterTree.photo.switchToStyle') }}
      </button>
    </template>
  </section>
</template>

<script setup lang="ts">
export type PhotoLane = 'style' | 'other'

const visual = defineModel<string>({ required: true })
const props = defineProps<{ lane: PhotoLane | null }>()
const emit = defineEmits<{
  (e: 'choose-lane' | 'change-lane', lane: PhotoLane): void
  (e: 'ready', value: boolean): void
  (e: 'dirty' | 'close' | 'focus-search'): void
}>()

const userStore = useUserStore()
const localePath = useLocalePath()
const checkingPlan = ref(true)
const hasCollectorPlan = computed(() => !checkingPlan.value && userStore.effectiveTier !== 'free')
const pendingFile = shallowRef<File | null>(null)
const handedFile = shallowRef<File | null>(null)
const previewUrl = ref('')

async function loadPlan() {
  checkingPlan.value = true
  try {
    await userStore.ensureEntitlements()
  }
  catch (error) {
    console.error('Failed to load entitlements:', error)
  }
  finally {
    checkingPlan.value = false
  }
}

function setPreview(file: File | null) {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = file ? URL.createObjectURL(file) : ''
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  pendingFile.value = file
  setPreview(file)
}

/** The lane decides how the photo is prepared, so it is handed over only after the answer. */
function choose(lane: PhotoLane) {
  handedFile.value = pendingFile.value
  emit('choose-lane', lane)
}

watch(() => props.lane, (lane, previous) => {
  // A lane switch discards the prepared photo; the new lane starts with its own upload.
  if (lane && previous) handedFile.value = null
  if (lane) return
  pendingFile.value = null
  handedFile.value = null
  setPreview(null)
})

onMounted(() => {
  watch(() => userStore.token, loadPlan, { immediate: true })
})
onBeforeUnmount(() => setPreview(null))
</script>
