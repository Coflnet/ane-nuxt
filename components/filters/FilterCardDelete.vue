<template>
  <div class="items-center">
    <button @click="isModalOpen = true" class="mt-0.5 ml-1">
      <Icon name="tabler:trash" class="w-4 h-4 text-slate-500 dark:text-slate-400" />
    </button>

    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop overlay -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="isModalOpen = false"></div>

        <!-- Modal -->
        <div class="flex items-center justify-center min-h-screen p-4">
          <div
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all"
            @click.stop>
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                {{ $t('cofdelt') }}
              </h3>
              <button @click="isModalOpen = false" class="text-gray-400 hover:text-gray-500 focus:outline-none">
                <Icon name="x" class="w-5 h-5" />
              </button>
            </div>

            <div class="mb-6">
              <p class="text-gray-600 dark:text-gray-300">
                {{ $t('confdel') }}
              </p>
            </div>

            <div class="flex justify-end space-x-3">
              <button @click="isModalOpen = false"
                class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition-colors">
                {{ $t('canc') }}
              </button>
              <button @click="deleteFilterId"
                class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors">
                {{ $t('del') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
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
  await filterStore.loadFilters();
}


</script>
