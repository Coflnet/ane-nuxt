<template>
  <div
    v-if="loading || error || url"
    class="mt-3 rounded-xl border border-slate-700 bg-slate-900/40 p-3"
    data-testid="reference-card"
    aria-live="polite"
  >
    <p
      v-if="loading"
      class="flex items-center gap-2 text-sm text-slate-300"
    >
      <UiIcon name="svg-spinners:90-ring-with-bg" />
      {{ $t('filterTree.reference.loading') }}
    </p>
    <p
      v-else-if="error"
      class="break-words text-sm text-rose-300"
      role="alert"
    >
      {{ error }}
    </p>
    <div
      v-if="url && !loading"
      class="flex items-center gap-3"
    >
      <img
        v-if="image"
        :src="image"
        alt=""
        class="size-12 shrink-0 rounded-lg object-cover"
      >
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-slate-100">
          {{ title || host }}
        </p>
        <p class="text-xs text-slate-400">
          {{ $t('filterTree.reference.from', { host }) }}
        </p>
      </div>
      <a
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex size-10 shrink-0 items-center justify-center rounded-md hover:bg-slate-700"
        :aria-label="$t('filterTree.reference.open')"
        :title="$t('filterTree.reference.open')"
      >
        <UiIcon name="tabler:external-link" />
      </a>
      <button
        type="button"
        class="flex size-10 shrink-0 items-center justify-center rounded-md hover:bg-slate-700"
        :aria-label="$t('filterTree.reference.remove')"
        :title="$t('filterTree.reference.remove')"
        @click="$emit('remove')"
      >
        <UiIcon name="tabler:x" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { referenceHost } from '~/utils/referencePreview'

const props = defineProps<{ url: string, title: string, image?: string, loading: boolean, error: string }>()
defineEmits<{ (e: 'remove'): void }>()

const host = computed(() => referenceHost(props.url))
</script>
