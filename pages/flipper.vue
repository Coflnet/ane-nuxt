<template>
  <div>
    <h1 class="mb-8">
      <UiHeaderLabel
        :label="$t('newFlips')"
        :xl="true"
      />
    </h1>
    <UiDefaultContainer class="mb-6 p-6 relative">
      <div
        ref="scrollContainer"
        class="overflow-x-auto py-4"
        style="direction: rtl;"
      >
        <div
          class="flex gap-6 w-max "
          style="direction: ltr;"
        >
          <div
            v-for="item in filteredItems"
            :key="item.listing!.id ?? ''"
          >
            <FlipperFlipItem :item="item" />
          </div>
        </div>
      </div>
      <div
        v-if="items.length === 0 && !loading"
        class="text-center py-12 text-slate-400"
      >
        {{ $t('noFlipsFound') }}
      </div>
      <div
        v-if="loading"
        class="text-center py-12 text-slate-400"
      >
        {{ $t('loading') }}...
      </div>
    </UiDefaultContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Flip } from '~/src/api-client/types.gen'
import { getFlips } from '~/src/api-client'

const selectedMarketplace = ref('all')
const items = ref<Flip[]>([])
const loading = ref(true)
const scrollContainer = ref<HTMLElement | null>(null)

async function loadFlips() {
  loading.value = true
  try {
    const apiToken = `Bearer ${useUserStore().token}`
    const flipResponse = await getFlips({
      composable: '$fetch',
      path: { category: 'lego' },
      query: { limit: 10 },
      headers: { Authorization: apiToken },
    })
    if (Array.isArray(flipResponse)) {
      items.value = flipResponse
    }
  }
  catch (e) {
    console.error('Failed to load flips:', e)
  }
  finally {
    loading.value = false
  }
}

const filteredItems = computed(() => {
  if (selectedMarketplace.value === 'all') {
    return items.value
  }
  return items.value.filter(item =>
    item.listing?.platform?.toLowerCase() === selectedMarketplace.value,
  )
})

onMounted(() => {
  loadFlips()
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('wheel', (e) => {
      e.preventDefault()
      scrollContainer.value!.scrollLeft += e.deltaY
    })
  }
})

useHead({
  title: 'Flipper Dashboard',
  meta: [
    { name: 'description', content: 'Real-time marketplace flipping opportunities' },
  ],
})
</script>
