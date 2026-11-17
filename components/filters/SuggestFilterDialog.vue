<template>
  <button
    ref="opener"
    type="button"
    data-testid="suggest-filter-open"
    :class="openerClass ?? 'text-sm text-indigo-300 underline hover:text-indigo-200'"
    aria-haspopup="dialog"
    @click="openDialog"
  >
    {{ $t('filterTree.suggest.open') }}
  </button>

  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      @click.self="closeDialog"
    >
      <div
        ref="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="suggest-filter-title"
        class="w-full max-w-lg rounded-xl bg-slate-800 p-4 shadow-xl sm:p-6"
        @keydown.esc.prevent="closeDialog"
        @keydown.tab="trapFocus"
      >
        <h2
          id="suggest-filter-title"
          class="text-lg font-semibold text-white"
        >
          {{ $t('filterTree.suggest.title') }}
        </h2>

        <div
          v-if="sentId"
          class="mt-3 space-y-4"
          aria-live="polite"
        >
          <p class="text-slate-200">
            {{ $t('filterTree.suggest.thanks') }}
          </p>
          <div class="flex justify-end">
            <button
              ref="closeButton"
              type="button"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              @click="closeDialog"
            >
              {{ $t('filterTree.suggest.close') }}
            </button>
          </div>
        </div>

        <form
          v-else
          class="mt-3 space-y-3"
          @submit.prevent="submit"
        >
          <label
            for="suggest-filter-text"
            class="block text-sm text-slate-300"
          >{{ $t('filterTree.suggest.label') }}</label>
          <textarea
            id="suggest-filter-text"
            ref="textarea"
            v-model="text"
            data-testid="suggest-filter-text"
            rows="4"
            required
            :minlength="MIN_LENGTH"
            :maxlength="MAX_LENGTH"
            :placeholder="$t('filterTree.suggest.placeholder')"
            aria-describedby="suggest-filter-count"
            class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <p
            id="suggest-filter-count"
            class="text-right text-xs text-slate-400"
          >
            {{ $t('filterTree.suggest.count', { count: trimmed.length, max: MAX_LENGTH }) }}
          </p>
          <p
            v-if="error"
            class="text-sm text-rose-300"
            role="alert"
          >
            {{ error }}
          </p>
          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-700"
              @click="closeDialog"
            >
              {{ $t('cancel') }}
            </button>
            <button
              type="submit"
              data-testid="suggest-filter-submit"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
              :disabled="!canSubmit"
            >
              {{ sending ? $t('filterTree.suggest.sending') : $t('filterTree.suggest.submit') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const MIN_LENGTH = 3
const MAX_LENGTH = 1000
const MAX_CONTEXT_LENGTH = 2000

const props = defineProps<{
  /** Only the search term and filter names — never notification targets, photos or embeddings. */
  context?: { searchTerm: string, filterNames: string[] }
  openerClass?: string
}>()

const { t, locale } = useI18n()
const route = useRoute()
const apiBase = useApiBaseUrl()
const userStore = useUserStore()

const isOpen = ref(false)
const text = ref('')
const sending = ref(false)
const error = ref('')
const sentId = ref('')
const opener = ref<HTMLButtonElement | null>(null)
const dialog = ref<HTMLElement | null>(null)
const textarea = ref<HTMLTextAreaElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)

const trimmed = computed(() => text.value.trim())
const canSubmit = computed(() => !sending.value && trimmed.value.length >= MIN_LENGTH && trimmed.value.length <= MAX_LENGTH)

/** JSON of the search term and filter names, shortened to the 2000 character limit. */
function serializedContext(): string {
  const filterNames = (props.context?.filterNames ?? []).slice(0, 50)
  const base = JSON.stringify({ searchTerm: '', filterNames })
  const searchTerm = (props.context?.searchTerm ?? '').slice(0, Math.max(0, MAX_CONTEXT_LENGTH - base.length - 50))
  return JSON.stringify({ searchTerm, filterNames }).slice(0, MAX_CONTEXT_LENGTH)
}

async function openDialog() {
  isOpen.value = true
  error.value = ''
  await nextTick()
  textarea.value?.focus()
}

async function closeDialog() {
  isOpen.value = false
  if (sentId.value) {
    sentId.value = ''
    text.value = ''
  }
  await nextTick()
  opener.value?.focus()
}

function trapFocus(event: KeyboardEvent) {
  const focusable = dialog.value?.querySelectorAll<HTMLElement>('button:not([disabled]), textarea, [href], input')
  if (!focusable?.length) return
  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function errorMessage(e: unknown): string {
  const failure = e as { status?: number, statusCode?: number, data?: { error?: string } }
  const status = failure.status ?? failure.statusCode
  if (status === 429) return t('filterTree.suggest.tooMany')
  if (status === 400 && failure.data?.error) return failure.data.error
  return t('filterTree.suggest.failed')
}

async function submit() {
  if (!canSubmit.value) return
  sending.value = true
  error.value = ''
  try {
    const result = await $fetch<{ id: string }>(`${apiBase}/api/filters/suggestions`, {
      method: 'POST',
      headers: userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {},
      body: { text: trimmed.value, context: serializedContext(), locale: locale.value, page: route.path },
    })
    sentId.value = String(result?.id ?? 'sent')
    await nextTick()
    closeButton.value?.focus()
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    sending.value = false
  }
}
</script>
