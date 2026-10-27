<template>
  <div>
    <div
      v-if="isWebView"
      class="flex flex-col min-h-screen bg-slate-900 border-slate-800"
    >
      <AppHeader />
      <main class="flex-grow container mx-auto px-4 py-8">
        <slot />
      </main>
      <AppFooter />
    </div>
    <div
      v-else
      class="flex flex-col min-h-screen"
    >
      <nav class=" py-4 sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div class="flex items-center justify-between container mx-auto">
          <div class="flex items-center ml-4">
            <UiLogo :location="logoPath" />
          </div>
          <div class="hidden md:block">
            <div class="flex items-center space-x-8">
              <a
                :href="localePath('/search')"
                class="text-gray-300 hover:text-indigo-400 transition-colors"
              >{{ $t('searchHeader') }}</a>
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
                :href="desktopCtaPath"
                aria-label="Header Get Started"
                class="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20"
              >
                {{ isLoggedIn ? $t('overview') : $t('getStarted') }}
              </a>
            </div>
          </div>
          <div class="md:hidden">
            <button
              type="button"
              class="size-11 inline-flex items-center justify-center rounded-lg text-gray-300 mr-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
              aria-label="Toggle navigation menu"
              :aria-expanded="mobileMenuOpen"
              aria-controls="landing-mobile-navigation"
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
          id="landing-mobile-navigation"
          class="md:hidden mt-4 space-y-4 text-center"
        >
          <a
            :href="localePath('/search')"
            class="block text-gray-300 hover:text-indigo-400 py-2"
          >{{ $t('searchHeader') }}</a>
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
            :href="desktopCtaPath"
            class="block px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all text-center shadow-lg shadow-indigo-900/20"
          >
            {{ isLoggedIn ? $t('overview') : $t('getStarted') }}
          </a>
        </div>
      </nav>

      <main class="flex-grow">
        <slot />
      </main>
      <AppFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const mobileMenuOpen = ref(false)
const userStore = import.meta.client ? useUserStore() : null

const isLoggedIn = computed(() => userStore?.isLoggedIn ?? false)
const isWebView = computed(() => userStore?.isWebView ?? false)
const logoPath = computed(() => localePath(isLoggedIn.value ? '/overview' : '/'))
const desktopCtaPath = computed(() => localePath(isLoggedIn.value ? '/overview' : '/filters/create'))
</script>
