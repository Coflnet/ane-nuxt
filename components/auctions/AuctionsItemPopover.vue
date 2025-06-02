<template>
  <Popover>
    <PopoverButton class="outline-none">
      <slot />
    </PopoverButton>

    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-1 opacity-0"
    >
      <PopoverPanel
        class="absolute z-10 rounded-lg border border-slate-600 bg-slate-800 shadow-lg overflow-auto md:-translate-x-1/2 p-3 min-w-72
        -translate-x-3/4"
      >
        <Disclosure v-slot="{ open }">
          <DisclosureButton class="mt-1">
            <div class="flex">
              <UiHeaderLabel
                :sm="true"
                class="items-center flex"
              >
                <UiIcon
                  name="tabler:question-circle"
                  class="mr-2"
                  :large="true"
                />
                {{ $t('thisAuctionDoesntMatch') }}
              </UiHeaderLabel>
            </div>
          </DisclosureButton>
          <div
            class="text-gray-500 overflow-hidden transition-all duration-200"
            :class="open ? 'max-h-96 max-w-96' : 'max-h-0 max-w-0'"
          >
            <textarea
              v-model="auctionBadText"
              class="bg-transparent rounded-lg border border-slate-600 m-2 p-1 text-white placeholder-gray-500"
              rows="3"
              cols="30"
              name="text"
              :placeholder="$t('tellUsWhatsWrongs')"
            />
            <UiButton
              :disabled="auctionBadText == ''"
              :primary="true"
              class="w-full"
              @on-click="sendWrongMatchMessage"
            >
              Submit
            </UiButton>
          </div>
        </Disclosure>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel, Disclosure, DisclosureButton } from '@headlessui/vue'

const { t } = useI18n()

const auctionBadText = ref('')

const props = defineProps<{ auction: FilterMatch }>()

async function sendWrongMatchMessage() {
  const apiToken = `Bearer ${useUserStore().token}`
  // Destructure props.auction to get a plain object
  const { auction: plainAuction } = props

  const response = await reportMatch({
    composable: '$fetch',
    headers: { Authorization: apiToken },
    body: { match: plainAuction as any, message: auctionBadText },
  })

  push.success(t('reportSuccessfull', { id: response }))
}
</script>
