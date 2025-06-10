<template>
  <Teleport to="body">
    <div
      v-if="modalValue"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      <div class="flex items-center justify-center min-h-screen p-4">
        <UiDefaultContainer
          class="max-w-md transform p-6"
          @click.stop
        >
          <h3 class="text-lg font-medium text-gray-100 mb-2">
            {{ header }}
          </h3>

          <UiFooterLabel :label="footer" />

          <div class="flex justify-end space-x-3 mt-6">
            <UiButton
              aria-label="Cancel Deletion"
              @on-click="$emit('cancel')"
            >
              {{ $t('cancel') }}
            </UiButton>
            <UiButton
              aria-label="Confirm Deletion"
              :warning="true"
              :proccessing="loading"
              @on-click="$emit('confirm'); loading = true"
            >
              {{
                $t('delete') }}
            </UiButton>
          </div>
        </UiDefaultContainer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineEmits(['confirm', 'cancel'])

const modalValue = defineModel()
const loading = ref(false)

defineProps({ header: String, footer: String })
</script>
