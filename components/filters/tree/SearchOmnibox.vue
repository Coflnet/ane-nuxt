<template>
  <div>
    <label
      for="Search Value"
      class="mb-1 block text-sm font-medium text-slate-300"
    >{{ $t('filterTree.looking.label') }}</label>
    <div class="relative">
      <input
        id="Search Value"
        ref="input"
        v-model="model"
        type="text"
        name="searchValue"
        autocomplete="off"
        :placeholder="$t('filterTree.looking.placeholder')"
        :aria-describedby="hint ? 'search-value-hint' : undefined"
        class="w-full rounded-lg border border-slate-600 bg-slate-700 py-2.5 pl-4 pr-24 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        @paste="onPaste"
        @change="checkForLink"
      >
      <div class="absolute inset-y-0 right-1 flex items-center gap-1">
        <button
          type="button"
          class="flex size-10 items-center justify-center rounded-md hover:bg-slate-600"
          :title="$t('filterTree.looking.pasteLink')"
          :aria-label="$t('filterTree.looking.pasteLink')"
          data-testid="omnibox-paste-link"
          @click="pasteLink"
        >
          <UiIcon
            name="tabler:link"
            :large="true"
          />
        </button>
        <button
          type="button"
          class="flex size-10 items-center justify-center rounded-md hover:bg-slate-600"
          :title="$t('filterTree.looking.usePhoto')"
          :aria-label="$t('filterTree.looking.usePhoto')"
          data-testid="omnibox-photo"
          @click="$emit('open-photo')"
        >
          <UiIcon
            name="tabler:camera"
            :large="true"
          />
        </button>
      </div>
    </div>
    <p
      v-if="hint"
      id="search-value-hint"
      class="mt-1 text-xs text-slate-400"
      aria-live="polite"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { parseListingUrl } from '~/utils/filterPrefill'

const model = defineModel<string>({ required: true })
const emit = defineEmits<{
  (e: 'import-url', url: string): void
  (e: 'open-photo'): void
}>()

const { t } = useI18n()
const input = ref<HTMLInputElement | null>(null)
const hint = ref('')

function importIfLink(text: string): boolean {
  const url = parseListingUrl(text)
  if (!url) return false
  hint.value = ''
  emit('import-url', url)
  return true
}

function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!parseListingUrl(text)) return
  event.preventDefault()
  importIfLink(text)
}

function checkForLink() {
  importIfLink(model.value)
}

async function pasteLink() {
  try {
    const text = await navigator.clipboard.readText()
    if (importIfLink(text)) return
    hint.value = t('filterTree.looking.noLinkInClipboard')
  }
  catch {
    hint.value = t('filterTree.looking.pasteHere')
  }
  input.value?.focus()
}

function focus() {
  input.value?.focus()
}

defineExpose({ focus })
</script>
