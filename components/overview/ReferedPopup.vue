<template>
  <Teleport to="body">
    <div
      v-if="model"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      <div class="flex items-center justify-center min-h-screen p-4">
        <UiDefaultContainer
          class="max-w-xl transform "
          @click.stop
        >
          <div class="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 py-10 rounded-t-xl flex flex-col items-center">
            <UiHeaderLabel
              :label="$t('youGotRefered')"
              :xl="true"
            />
          </div>
          <div class="px-6">
            <UiFooterLabel
              class="flex mt-8"
              :white="true"
              :label="$t('someoneInvitedYou')"
            />
            <UiFooterLabel
              :white="true"
              class="flex mb-10"
            >
              {{ $t('referedDetails') }}
              <UiTooltipHover
                :text="$t('countryShipping')"
                class="max-w-8"
              >
                <div
                  class="border bg-slate-700 text-white border-slate-800 text-sm rounded-full size-6 text-center ml-2 "
                >
                  ?
                </div>
              </UiTooltipHover>
            </UiFooterLabel>

            <UiButton
              :primary="true"
              class="mb-6"
            >
              Create Filter
            </UiButton>
          </div>
        </UiDefaultContainer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const model = defineModel()
</script>
