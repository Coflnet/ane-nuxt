<template>
  <div class="w-full justify-between flex">
    <div class="mb-8">
      <UiTextButton @on-click="navigateTo(localePath('/filters'))">
        <Icon
          name="tabler:arrow-left"
          class="mr-2"
        />
        {{ $t('backToFilters') }}
      </UiTextButton>
      <UiHeaderLabel
        :label="isNewFilter ? $t('createFilter') : $t('editFilter')"
        :xl="true"
        class="mt-2"
      />
      <UiFooterLabel :label="isNewFilter ? $t('setUpNewAuctionFilter') : $t('updateExistingFilter')" />
    </div>
    <UiButton
      v-if="itemId != 0"
      class="size-11"
      @on-click="isModalOpen = true"
    >
      <UiIcon
        name="tabler:trash"
        :bold="true"
        :large="true"
      />
    </UiButton>

    <UiConformationPopup
      :footer="$t('areYouSureDeletion')"
      :header="$t('confirmDeletion')"
      :model-value="isModalOpen"
      :confirm-text="$t('delete')"
      @confirm="deleteFilterId"
      @cancel="isModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

const props = defineProps({
  isNewFilter: Boolean, itemId: Number,
})

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
  navigateTo(localePath('/filters'))
}
</script>
