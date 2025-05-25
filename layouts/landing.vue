<template>
  <div class="flex flex-col min-h-screen">
    <nav class=" py-4 sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <div class="flex items-center justify-between container mx-auto">
        <div class="flex items-center">
          <UiLogo />
        </div>
        <div class="hidden md:block">
          <div class="flex items-center space-x-8">
            <a
              href="/#features"
              class="text-gray-300 hover:text-indigo-400 transition-colors"
            >{{ $t('featuresHeader')
            }}</a>
            <a
              href="/#how-it-works"
              class="text-gray-300 hover:text-indigo-400 transition-colors"
            >{{
              $t('howItWorksHeader') }}</a>
            <a
              href="/#pricing"
              class="text-gray-300 hover:text-indigo-400 transition-colors"
            >{{ $t('pricingHeader')
            }}</a>
            <a
              href="/#faq"
              class="text-gray-300 hover:text-indigo-400 transition-colors"
            >{{ $t('faqHeader') }}</a>
            <a
              :href="localePath('/login')"
              class="px-4 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-all"
            >{{
              $t('signIn') }}</a>
            <a
              :href="localePath('/filters/create')"
              class="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20"
            >{{
              $t('getStarted') }}</a>
          </div>
        </div>
        <div class="md:hidden">
          <button
            class="text-gray-300"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <Icon
              v-if="!mobileMenuOpen"
              name="menu"
              class="w-6 h-6"
            />
            <Icon
              v-else
              name="x"
              class="w-6 h-6"
            />
          </button>
        </div>
      </div>
      <!-- Mobile menu -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden mt-4 space-y-4"
      >
        <a
          href="/#features"
          class="block text-gray-300 hover:text-indigo-400 py-2"
        >{{ $t('nav.features') }}</a>
        <a
          href="/#how-it-works"
          class="block text-gray-300 hover:text-indigo-400 py-2"
        >{{ $t('nav.howItWorks') }}</a>
        <a
          href="/#pricing"
          class="block text-gray-300 hover:text-indigo-400 py-2"
        >{{ $t('nav.pricing') }}</a>
        <a
          href="/#faq"
          class="block text-gray-300 hover:text-indigo-400 py-2"
        >{{ $t('nav.faq') }}</a>
        <a
          :href="localePath('/login')"
          class="block px-4 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-all text-center my-2"
        >{{
          $t('nav.signIn') }}</a>
        <a
          :href="localePath('/filters/create')"
          class="block px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all text-center shadow-lg shadow-indigo-900/20"
        >{{
          $t('nav.getStarted') }}</a>
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
