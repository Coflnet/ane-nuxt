<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      <div class="flex items-center justify-center min-h-screen p-4">
        <UiDefaultContainer
          class="max-w-xl transform"
          @click.stop
        >
          <div class="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 py-10 rounded-t-xl flex flex-col items-center">
            <div class=" bg-gray-200/10 rounded-full flex p-2 mb-3">
              <Icon
                name="tabler:award"
                class="size-12 text-white/90 "
              />
            </div>

            <UiHeaderLabel
              :label="$t('youGotRefered')"
              :xl="true"
            />
          </div>
          <div class="px-2 md:px-6 text-center flex flex-col">
            <UiHeaderLabel
              class="flex mt-8 pb-4"
              :white="true"
              :label="$t('startUsingApp')"
            />
            <UiFooterLabel
              :white="true"
              class="flex mb-8 justify-center"
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
              class="mb-4 w-full"
              @on-click="navigateTo(localePath('/filters/create'))"
            >
              {{ $t('createFilter') }}
            </UiButton>
            <UiTextButton
              class="w-full mb-8"
              :gray="true"
              :sm="true"
              @on-click="closePopup"
            >
              <div class="w-full">
                {{ $t('maybeLater') }}
              </div>
            </UiTextButton>
          </div>
        </UiDefaultContainer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

const open = ref(false)

const router = useRouter()
const referred = router.currentRoute.value.query.ref as string | undefined

function closePopup() {
  open.value = false
  console.log('closing')
}

onMounted(() => {
  // no referral code in url
  if (referred == null)
    return

  // user already clicked a referral code
  if (useUserStore().acceptingReferralCode != '')
    return

  open.value = true
  useUserStore().acceptingReferralCode = referred
})
</script>
