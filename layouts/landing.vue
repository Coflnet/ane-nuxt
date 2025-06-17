<template>
  <div class="flex flex-col min-h-screen">
    <nav class=" py-4 sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <div class="flex items-center justify-between container mx-auto">
        <div class="flex items-center ml-4">
          <UiLogo :location="localePath(useUserStore().isLoggedIn ? '/' : '/overview')" />
        </div>
        <div class="hidden md:block">
          <div class="flex items-center space-x-8">
            <a
              :href="localePath('/#features')"
              class="text-gray-300 hover:text-indigo-400 transition-colors"
            >{{ $t('featuresHeader')
            }}</a>
            <a
              :href="localePath('/#how-it-works')"
              class="text-gray-300 hover:text-indigo-400 transition-colors"
            >{{
              $t('howItWorksHeader') }}</a>
            <a
              :href="localePath('/#pricing')"
              class="text-gray-300 hover:text-indigo-400 transition-colors"
            >{{ $t('pricingHeader')
            }}</a>
            <a
              :href="localePath('/#faq')"
              class="text-gray-300 hover:text-indigo-400 transition-colors"
            >{{ $t('faqHeader') }}</a>
            <a
              :href="localePath('/login')"
              aria-label="Header Sign In"
              class="px-4 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-all"
            >{{
              $t('signIn') }}</a>
            <a
              :href="localePath(useUserStore().isLoggedIn ? '/filters/create' : '/overview')"
              aria-label="Header Get Started"
              class="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20"
            >
              {{ useUserStore().isLoggedIn ? $t('overview') : $t('getStarted') }}
            </a>
          </div>
        </div>
        <div class="md:hidden">
          <button
            class="text-gray-300 mr-4"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <Icon
              v-if="!mobileMenuOpen"
              name="tabler:menu"
              class="w-6 h-6"
            />
            <Icon
              v-else
              name="tabler:x"
              class="w-6 h-6"
            />
          </button>
        </div>
      </div>
      <!-- Mobile menu -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden mt-4 space-y-4 text-center"
      >
        <a
          :href="localePath('/#features')"
          class="block text-gray-300 hover:text-indigo-400 py-2"
        >{{ $t('featuresHeader') }}</a>
        <a
          :href="localePath('/#how-it-works')"
          class="block text-gray-300 hover:text-indigo-400 py-2"
        >{{ $t('howItWorksHeader') }}</a>
        <a
          :href="localePath('/#pricing')"
          class="block text-gray-300 hover:text-indigo-400 py-2"
        >{{ $t('pricingHeader') }}</a>
        <a
          :href="localePath('/#faq')"
          class="block text-gray-300 hover:text-indigo-400 py-2"
        >{{ $t('faqHeader') }}</a>
        <a
          :href="localePath('/login')"
          class="block px-4 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-all text-center my-2"
        >{{
          $t('signIn') }}</a>
        <a
          :href="localePath(useUserStore().isLoggedIn ? '/filters/create' : '/overview')"
          class="block px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all text-center shadow-lg shadow-indigo-900/20"
        >
          {{ useUserStore().isLoggedIn ? $t('overview') : $t('getStarted') }}
        </a>
      </div>
    </nav>

    <main class="flex-grow">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const mobileMenuOpen = ref(false)
</script>
