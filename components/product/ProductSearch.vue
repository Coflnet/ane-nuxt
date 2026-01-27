<template>
  <div class="w-full max-w-2xl mx-auto">
    <div class="relative group">
      <div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
      <div class="relative flex items-center bg-slate-800 rounded-lg shadow-xl ring-1 ring-slate-700/50">
        <div class="pl-4 text-slate-400">
          <Icon
            name="tabler:search"
            class="w-6 h-6"
          />
        </div>
        <input
          v-model="query"
          type="text"
          :placeholder="$t('searchProductsPlaceholder', 'Search for products (e.g. iPhone 15, MacBook)...')"
          class="w-full p-4 bg-transparent border-none text-slate-100 placeholder-slate-500 focus:ring-0 text-lg"
          @keyup.enter="handleSearch"
        >
        <div class="pr-2">
          <button
            class="p-2 text-slate-400 hover:text-white transition-colors"
            @click="handleSearch"
          >
            <Icon
              name="tabler:arrow-right"
              class="w-6 h-6"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  initialQuery?: string
}>()

const emit = defineEmits<{
  (e: 'search', query: string): void
}>()

const query = ref(props.initialQuery || '')

watch(() => props.initialQuery, (newQuery) => {
  query.value = newQuery || ''
})

function handleSearch() {
  if (query.value.trim()) {
    emit('search', query.value)
  }
}
</script>
