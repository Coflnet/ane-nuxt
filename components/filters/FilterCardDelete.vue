<template>
  <div class="items-center">
    <button
      :aria-label="`Delete Filter ${props.itemId}`"
      class="mt-0.5 ml-1"
      @click="isModalOpen = true"
    >
      <UiIcon
        name="tabler:trash"
        :large="true"
      />
    </button>

    <UiConformationPopup
      :footer="$t('areYouSureDeletion')"
      :header="$t('confirmDeletion')"
      :model-value="isModalOpen"
      @confirm="deleteFilterId"
      @cancel="isModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { deleteFilter } from '~/src/api-client'

const props = defineProps({ itemId: Number })

const userStore = useUserStore()
const apiToken = `Bearer ${userStore.token}`
const filterStore = useFilterStore()
const deleting = ref(false)

const isModalOpen = ref(false)

const deleteFilterId = async () => {
  deleting.value = true
  await deleteFilter({
    path: { id: props.itemId ?? 0 },
    composable: '$fetch',
    headers: { Authorization: apiToken },
  })
  await filterStore.loadFilters()
  push.success('Filter successfully deleted')
  isModalOpen.value = false
  deleting.value = false
}
</script>
