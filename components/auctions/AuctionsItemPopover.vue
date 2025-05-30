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
        class="absolute z-10 mt-1 rounded-lg border border-slate-600 bg-slate-800 shadow-lg overflow-auto -translate-x-1/2 p-3 min-w-72"
      >
        <Disclosure v-slot="{ open }">
          <DisclosureButton>
            <div class="flex ">
              <UiHeaderLabel
                :sm="true"
                :label="$t('thisAuctionDoesntMatch')"
              />
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
              class="w-full "
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
import { Popover, PopoverButton, PopoverPanel, Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'

const auctionBadText = ref('')

const props = defineProps<{ auction: FilterMatch }>()

async function sendWrongMatchMessage() {
  const apiToken = `Bearer ${useUserStore().token}`
  // Destructure props.auction to get a plain object
  const { auction: plainAuction } = props

  await reportMatch({
    composable: '$fetch',
    headers: { Authorization: apiToken },
    body: { match: plainAuction, message: auctionBadText },
  })
}
</script>
