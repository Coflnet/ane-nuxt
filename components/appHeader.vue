<template>
  <header class="bg-slate-900 border-b border-slate-800 relative z-30">
    <div
      class="container mx-auto px-4 py-4"
      :class="isWebView ? 'mt-6' : ''"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center w-full md:w-24 justify-between">
          <div class="flex items-center">
            <UiLogo location="/overview" />
            <div class="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
              {{ $t('appHeaderBeta') }}
            </div>
          </div>
          <button
            class="mr-3 text-white md:hidden focus:outline-none"
            aria-label="Toggle navigation menu"
            @click="toggleMobileMenu"
          >
            <Icon
              name="lucide:menu"
              class="w-6 h-6"
            />
          </button>
        </div>

        <div class="hidden md:block">
          <AppHeaderNavButtons />
        </div>
      </div>
    </div>

    <!-- Mobile sidebar navigation -->
    <AppHeaderMobileNavMenu
      :is-open="isMobileMenuOpen"
      @close="closeMobileMenu"
    />

    <!-- Overlay when mobile menu is open -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
      @click="closeMobileMenu"
    />
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isWebView = ref(false)

const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value

  // Prevent scrolling when menu is open
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  }
  else {
    document.body.style.overflow = ''
  }
}

onMounted(async () => {
  isWebView.value = useUserStore().isWebView
})

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  document.body.style.overflow = ''
}
</script>
