<template>
  <div class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
    <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
      {{ title }}
    </h3>
    <p class="text-xs text-slate-400 mb-3">
      {{ $t('filterMatchAny') }}
    </p>
    <input
      v-model="query"
      type="search"
      maxlength="100"
      :aria-label="$t('findFilterValue', { name: title })"
      :placeholder="$t('findFilterValue', { name: title })"
      class="w-full mb-3 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
    >
    <div
      class="flex flex-wrap gap-2 max-h-44 overflow-y-auto"
      :aria-busy="loading"
    >
      <button
        v-for="bucket in visibleBuckets"
        :key="bucket.value!"
        type="button"
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors min-w-0 max-w-full sm:max-w-[220px]"
        :class="selected.includes(bucket.value!) ? 'bg-purple-500/20 text-purple-400 font-medium' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'"
        :aria-pressed="selected.includes(bucket.value!)"
        @click="$emit('select', bucket.value!)"
      >
        <span class="truncate">{{ formatValue(bucket.value!) }}</span>
        <span
          v-if="bucket.count != null"
          class="text-xs opacity-60 ml-1 flex-shrink-0"
        >({{ bucket.count }})</span>
      </button>
    </div>
    <p
      v-if="loading"
      class="text-xs text-slate-400 mt-2"
      role="status"
    >
      {{ $t('loading') }}
    </p>
    <p
      v-else-if="error"
      class="text-xs text-slate-400 mt-2"
      role="alert"
    >
      {{ $t('filterValuesFailed') }}
      <button
        type="button"
        class="text-purple-400 underline ml-1"
        @click="load"
      >
        {{ $t('retry', 'Retry') }}
      </button>
    </p>
    <p
      v-else-if="options.length === 0"
      class="text-xs text-slate-400 mt-2"
      role="status"
    >
      {{ $t('noMatchingFilterValues') }}
    </p>
    <p
      v-else-if="options.length >= 50"
      class="text-xs text-slate-400 mt-2"
      role="status"
    >
      {{ $t('refineFilterValues') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ServicesProductServiceFilterBucket as FilterBucket } from '~/src/api-client/types.gen'

const props = defineProps<{
  title: string
  buckets: FilterBucket[]
  selected: string[]
  scope: string
  formatValue: (value: string) => string
  loadValues: (query: string) => Promise<FilterBucket[]>
}>()
defineEmits<{ select: [value: string] }>()

const query = ref('')
const found = ref<FilterBucket[] | null>(null)
const loading = ref(false)
const error = ref(false)
const options = computed(() => found.value ?? props.buckets)
const visibleBuckets = computed<FilterBucket[]>(() => {
  const values = options.value.filter(b => b.value)
  return [...props.selected.filter(value => !values.some(b => b.value === value)).map(value => ({ value })), ...values]
})
let request = 0
let timer: ReturnType<typeof setTimeout> | undefined

async function load() {
  const value = query.value.trim()
  if (!value && !props.selected.length) return
  const current = ++request
  loading.value = true
  error.value = false
  try {
    const values = await props.loadValues(value)
    if (current === request) found.value = values
  }
  catch {
    if (current === request) error.value = true
  }
  finally {
    if (current === request) loading.value = false
  }
}

function scheduleDiscovery() {
  ++request
  clearTimeout(timer)
  found.value = null
  error.value = false
  loading.value = !!query.value.trim() || props.selected.length > 0
  if (loading.value) timer = setTimeout(load, 300)
}
watch([query, () => props.scope], scheduleDiscovery)
onMounted(scheduleDiscovery)
onBeforeUnmount(() => {
  ++request
  clearTimeout(timer)
})
</script>
