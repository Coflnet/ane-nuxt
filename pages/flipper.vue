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
    </UiDefaultContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getFlips } from '~/src/api-client'

const selectedMarketplace = ref('all')
const items = ref<Flip[]>([])
const scrollContainer = ref(null)

async function loadFlips() {
  const apiToken = `Bearer ${useUserStore().token}`
  const flipResponse = await getFlips({
    composable: '$fetch',
    path: { category: 'lego' },
    query: { limit: 10 },
    headers: { Authorization: apiToken },
  })
  flipResponse.map((flip) => {
    items.value.push(flip)
  })
}

const filteredItems = computed(() => {
  if (selectedMarketplace.value === 'all') {
    return items.value
  }
  return items.value.filter(item =>
    item.listing?.platform!.toLowerCase() === selectedMarketplace.value,
  )
})

onMounted(() => {
  loadFlips()
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('wheel', (e) => {
      e.preventDefault()

      scrollContainer.value.scrollLeft += e.deltaY
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
