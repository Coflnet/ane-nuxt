<template>
  <div class="items-center">
    <button @click="isModalOpen = true" class="mt-0.5 ml-1">
      <UiIcon name="tabler:trash" />
    </button>

    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="isModalOpen = false"></div>

        <div class="flex items-center justify-center min-h-screen p-4">
          <UiDefaultContainer @click.stop class="max-w-md transform p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {{ $t('confirmDeletion') }}
            </h3>

            <UiFooterLabel :label="$t('areYouSureDeletion')" />

            <div class="flex justify-end space-x-3 mt-6">
              <UiButton @on-click="isModalOpen = false">{{ $t('cancel') }}</UiButton>
              <UiButton @on-click="deleteFilterId" :warning="true">{{ $t('delete') }}</UiButton>
            </div>
          </UiDefaultContainer>

        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { UiButton } from '#components';
import { ref } from 'vue';
import { deleteFilter } from '~/src/api-client';

interface Props {
  itemId: number;
}

const props = defineProps<Props>();

const userStore = useUserStore()
var apiToken = `Bearer ${userStore.token}`;
const filterStore = useFilterStore();


// State
const isModalOpen = ref(false);

const deleteFilterId = async () => {
  await deleteFilter({
    path: { id: props.itemId },
    composable: "$fetch",
    headers: { Authorization: apiToken },
  })
  push.success("Filter successfully deleted");
  await filterStore.loadFilters();
  isModalOpen.value = false;
}


</script>
