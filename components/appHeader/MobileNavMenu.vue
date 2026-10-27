<template>
  <div
    id="mobile-navigation-menu"
    class="fixed inset-y-0 left-0 w-64 bg-slate-800 shadow-lg transform transition-transform duration-300 ease-in-out z-30 md:hidden"
    :class="[isOpen ? 'translate-x-0' : '-translate-x-full', isWebView ? 'pt-6' : '']"
  >
    <div class="flex flex-col h-full">
      <!-- Header with close button -->
      <div class="flex items-center justify-between p-4 border-b border-slate-700">
        <UiLogo location="/overview" />
        <button
          type="button"
          class="size-11 shrink-0 inline-flex items-center justify-center rounded-lg text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
          aria-label="Close navigation menu"
          @click="$emit('close')"
        >
          <Icon
            name="lucide:x"
            class="w-6 h-6"
          />
        </button>
      </div>

      <!-- Sidebar content -->
      <div class="flex-1 overflow-y-auto p-4">
        <AppHeaderNavButtonsMobile @navigate="$emit('close')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const isWebView = useUserStore().isWebView

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close'])
</script>
