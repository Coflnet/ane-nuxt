<template>
  <div class="min-h-screen bg-gray-950">
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950 -z-10" />
      <div
        class="absolute -top-24 -right-24 w-96 h-96 bg-indigo-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
      />
      <div
        class="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"
      />

      <div class="container mx-auto px-6 py-20 md:py-32">
        <div class="flex flex-col md:flex-row items-center">
          <div class="md:w-1/2 mb-12 md:mb-0">
            <div class="inline-block px-3 py-1 rounded-full bg-indigo-900 text-indigo-400 font-medium text-sm mb-6">
              {{ $t('hero.badge') }}
            </div>
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
              <i18n-t
                keypath="hero.marketingTextNeverMissADeal.text"
                tag="span"
              >
                <template #deal>
                  <span class="text-indigo-400">{{
                    $t('hero.marketingTextNeverMissADeal.deal')
                  }}</span>
                </template>
              </i18n-t>
            </h1>

            <p class="text-lg text-gray-300 mb-8 max-w-lg">
              {{ $t('hero.description') }}
            </p>
            <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <a
                :href="localePath('/filters/create')"
                class="px-8 py-4 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all text-center shadow-lg shadow-indigo-900/20 font-medium"
              >
                {{ $t('hero.startFree') }}
              </a>
            </div>
          </div>
          <div class="md:w-1/2">
            <div class="relative">
              <div
                class="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"
              />
              <NuxtImg
                src="/DashboardPreview.webp"
                alt="Dashboard Preview"
                class="relative rounded-2xl shadow-2xl border border-gray-800"
                width="1000"
                height="550"
                sizes="sm:100vw md:75vw lg:50vw"
                format="webp,avif"
                priority="true"
              />
              <div
                class="absolute -right-6 -bottom-6 bg-gray-800 rounded-2xl shadow-xl p-4 flex items-center space-x-2"
              >
                <div class="w-10 h-10 bg-indigo-900 rounded-full flex items-center justify-center">
                  <Icon
                    name="tabler:bell"
                    class="w-5 h-5 text-indigo-400"
                  />
                </div>
                <div>
                  <div class="text-sm font-semibold text-white">
                    {{ $t('hero.notification.title') }}
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ $t('hero.notification.content') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-12 bg-gray-900 border-y border-gray-800">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-4xl font-bold text-indigo-400 mb-2">
              {{ $t('stats.itemsTracked.number') }}
            </div>
            <div class="text-gray-300">
              {{ $t('stats.itemsTracked.label') }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-indigo-400 mb-2">
              {{ $t('stats.marketplaces.number') }}
            </div>
            <div class="text-gray-300">
              {{ $t('stats.marketplaces.label') }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-indigo-400 mb-2">
              {{ $t('stats.uptime.number') }}
            </div>
            <div class="text-gray-300">
              {{ $t('stats.uptime.label') }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-indigo-400 mb-2">
              {{ $t('stats.monitoring.number') }}
            </div>
            <div class="text-gray-300">
              {{ $t('stats.monitoring.label') }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section
      id="features"
      class="py-20 md:py-32 bg-gray-950"
    >
      <div class="container mx-auto px-6">
        <div class="text-center mb-20">
          <div class="inline-block px-3 py-1 rounded-full bg-indigo-900 text-indigo-400 font-medium text-sm mb-6">
            {{ $t('features.badge') }}
          </div>
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
            {{ $t('features.title') }}
          </h2>
          <p class="text-lg text-gray-300 max-w-2xl mx-auto">
            {{ $t('features.description') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div
            v-intersect="fadeInUp"
            class="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 transition-all hover:shadow-2xl hover:-translate-y-1 opacity-0"
          >
            <div
              class="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-900/20"
            >
              <Icon
                name="tabler:bell"
                class="w-7 h-7 text-white"
              />
            </div>
            <h3 class="text-xl font-semibold text-white mb-3">
              {{ $t('features.notifiers.title') }}
            </h3>
            <p class="text-gray-300 mb-4">
              {{ $t('features.notifiers.description') }}
            </p>
            <ul class="space-y-2 mb-6">
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('features.notifiers.benefits.first') }}</span>
              </li>
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('features.notifiers.benefits.second') }}</span>
              </li>
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('features.notifiers.benefits.third') }}</span>
              </li>
            </ul>
          </div>

          <!-- Feature 2 -->
          <div
            v-intersect="fadeInUp"
            class="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 transition-all hover:shadow-2xl hover:-translate-y-1 opacity-0"
          >
            <div
              class="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-900/20"
            >
              <Icon
                name="tabler:filter"
                class="w-7 h-7 text-white"
              />
            </div>
            <h3 class="text-xl font-semibold text-white mb-3">
              {{ $t('features.filters.title') }}
            </h3>
            <p class="text-gray-300 mb-4">
              {{ $t('features.filters.description') }}
            </p>
            <ul class="space-y-2 mb-6">
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('features.filters.benefits.first') }}</span>
              </li>
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('features.filters.benefits.second') }}</span>
              </li>
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('features.filters.benefits.third') }}</span>
              </li>
            </ul>
          </div>

          <!-- Feature 3 -->
          <div
            v-intersect="fadeInUp"
            class="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 transition-all hover:shadow-2xl hover:-translate-y-1 opacity-0"
          >
            <div
              class="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-900/20"
            >
              <Icon
                name="tabler:brand-speedtest"
                class="w-7 h-7 text-white"
              />
            </div>
            <h3 class="text-xl font-semibold text-white mb-3">
              {{ $t('features.alerts.title') }}
            </h3>
            <p class="text-gray-300 mb-4">
              {{ $t('features.alerts.description') }}
            </p>
            <ul class="space-y-2 mb-6">
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('features.alerts.benefits.first') }}</span>
              </li>
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('features.alerts.benefits.second') }}</span>
              </li>
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('features.alerts.benefits.third') }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section
      id="how-it-works"
      class="py-20 md:py-32 bg-gray-900"
    >
      <div class="container mx-auto px-6">
        <div
          v-intersect="fadeIn"
          class="text-center mb-20 opacity-0"
        >
          <div class="inline-block px-3 py-1 rounded-full bg-indigo-900 text-indigo-400 font-medium text-sm mb-6">
            {{ $t('howItWorks.badge') }}
          </div>
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
            {{ $t('howItWorks.title') }}
          </h2>
          <p class="text-lg text-gray-300 max-w-2xl mx-auto">
            {{ $t('howItWorks.description') }}
          </p>
        </div>

        <div class="relative">
          <!-- Connection Line -->
          <div class="absolute top-1/2 left-0 right-0 h-1 bg-indigo-800 -translate-y-1/2 hidden md:block" />

          <div class="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <!-- Step 1 -->
            <div
              v-intersect="fadeInUp"
              class="relative opacity-0"
            >
              <div
                class="w-16 h-16 bg-gray-900 rounded-full border-4 border-indigo-500 flex items-center justify-center text-2xl font-bold text-indigo-400 mx-auto mb-6 relative z-10"
              >
                1
              </div>
              <div class="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
                <h3 class="text-xl font-semibold text-white mb-3">
                  {{ $t('howItWorks.steps.first.title') }}
                </h3>
                <p class="text-gray-300">
                  {{ $t('howItWorks.steps.first.description') }}
                </p>
              </div>
            </div>

            <!-- Step 2 -->
            <div
              v-intersect="fadeInUp"
              class="relative opacity-0"
            >
              <div
                class="w-16 h-16 bg-gray-900 rounded-full border-4 border-indigo-500 flex items-center justify-center text-2xl font-bold text-indigo-400 mx-auto mb-6 relative z-10"
              >
                2
              </div>
              <div class="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
                <h3 class="text-xl font-semibold text-white mb-3">
                  {{ $t('howItWorks.steps.second.title') }}
                </h3>
                <p class="text-gray-300">
                  {{ $t('howItWorks.steps.second.description') }}
                </p>
              </div>
            </div>

            <!-- Step 3 -->
            <div
              v-intersect="fadeInUp"
              class="relative opacity-0"
            >
              <div
                class="w-16 h-16 bg-gray-900 rounded-full border-4 border-indigo-500 flex items-center justify-center text-2xl font-bold text-indigo-400 mx-auto mb-6 relative z-10"
              >
                3
              </div>
              <div class="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
                <h3 class="text-xl font-semibold text-white mb-3">
                  {{ $t('howItWorks.steps.third.title') }}
                </h3>
                <p class="text-gray-300">
                  {{ $t('howItWorks.steps.third.description') }}
                </p>
              </div>
            </div>

            <!-- Step 4 -->
            <div
              v-intersect="fadeInUp"
              class="relative opacity-0"
            >
              <div
                class="w-16 h-16 bg-gray-900 rounded-full border-4 border-indigo-500 flex items-center justify-center text-2xl font-bold text-indigo-400 mx-auto mb-6 relative z-10"
              >
                4
              </div>
              <div class="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
                <h3 class="text-xl font-semibold text-white mb-3">
                  {{ $t('howItWorks.steps.fourth.title') }}
                </h3>
                <p class="text-gray-300">
                  {{ $t('howItWorks.steps.fourth.description') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-intersect="fadeIn"
          class="mt-16 text-center opacity-0"
        >
          <a
            :href="localePath('/filters/create')"
            class="px-8 py-4 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all inline-block shadow-lg shadow-indigo-900/20 font-medium"
          >
            {{ $t('howItWorks.cta') }}
          </a>
        </div>
      </div>
    </section>

    <!-- Use Cases Section -->
    <section class="py-20 md:py-32 bg-gray-950">
      <div class="container mx-auto px-6">
        <div
          v-intersect="fadeIn"
          class="text-center mb-20 opacity-0"
        >
          <div class="inline-block px-3 py-1 rounded-full bg-indigo-900 text-indigo-400 font-medium text-sm mb-6">
            {{ $t('useCases.badge') }}
          </div>
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
            {{ $t('useCases.title') }}
          </h2>
          <p class="text-lg text-gray-300 max-w-2xl mx-auto">
            {{ $t('useCases.description') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Use Case 1 -->
          <div
            v-intersect="fadeInUp"
            class="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 opacity-0"
          >
            <div
              class="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-900/20"
            >
              <Icon
                name="tabler:shopping-bag"
                class="w-7 h-7 text-white"
              />
            </div>
            <h3 class="text-xl font-semibold text-white mb-3">
              {{ $t('useCases.collectors.title') }}
            </h3>
            <p class="text-gray-300 mb-4">
              {{ $t('useCases.collectors.description') }}
            </p>
            <ul class="space-y-2 mb-6">
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('useCases.collectors.benefits.first') }}</span>
              </li>
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('useCases.collectors.benefits.second') }}</span>
              </li>
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('useCases.collectors.benefits.third') }}</span>
              </li>
            </ul>
          </div>

          <!-- Use Case 2 -->
          <div
            v-intersect="fadeInUp"
            class="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 opacity-0"
          >
            <div
              class="w-14 h-14 bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-900/20"
            >
              <Icon
                name="tabler:trending-up"
                class="w-7 h-7 text-white"
              />
            </div>
            <h3 class="text-xl font-semibold text-white mb-3">
              {{ $t('useCases.resellers.title') }}
            </h3>
            <p class="text-gray-300 mb-4">
              {{ $t('useCases.resellers.description') }}
            </p>
            <ul class="space-y-2 mb-6">
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('useCases.resellers.benefits.first') }}</span>
              </li>
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('useCases.resellers.benefits.second') }}</span>
              </li>
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('useCases.resellers.benefits.third') }}</span>
              </li>
            </ul>
          </div>

          <!-- Use Case 3 -->
          <div
            v-intersect="fadeInUp"
            class="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 opacity-0"
          >
            <div
              class="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-900/20"
            >
              <Icon
                name="tabler:users"
                class="w-7 h-7 text-white"
              />
            </div>
            <h3 class="text-xl font-semibold text-white mb-3">
              {{ $t('useCases.bargainHunters.title') }}
            </h3>
            <p class="text-gray-300 mb-4">
              {{ $t('useCases.bargainHunters.description') }}
            </p>
            <ul class="space-y-2 mb-6">
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('useCases.bargainHunters.benefits.first') }}</span>
              </li>
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('useCases.bargainHunters.benefits.second') }}</span>
              </li>
              <li class="flex items-start">
                <Icon
                  name="tabler:circle-dashed-check"
                  class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                />
                <span class="text-gray-300">{{ $t('useCases.bargainHunters.benefits.third') }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Marketplace Support Section -->
    <section class="py-20 md:py-32 bg-gray-900">
      <div class="container mx-auto px-6">
        <div
          v-intersect="fadeIn"
          class="text-center mb-16 opacity-0"
        >
          <div class="inline-block px-3 py-1 rounded-full bg-indigo-900 text-indigo-400 font-medium text-sm mb-6">
            {{ $t('marketplaces.badge') }}
          </div>
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
            {{ $t('marketplaces.title') }}
          </h2>
          <p class="text-lg text-gray-300 max-w-2xl mx-auto">
            {{ $t('marketplaces.description') }}
          </p>
        </div>

        <div
          v-intersect="fadeIn"
          class="grid grid-cols-2 md:grid-cols-3 gap-8 opacity-0"
        >
          <a :href="localePath('/marketplaces/ebay')">
            <div
              class="flex items-center justify-center p-8 bg-gray-800 rounded-2xl shadow-sm border border-gray-700 transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div class="text-xl font-semibold text-gray-200">
                {{ $t('marketplaces.platforms.ebay') }}
              </div>
            </div>
          </a>
          <a :href="localePath('/marketplaces/facebook')">
            <div
              class="flex items-center justify-center p-8 bg-gray-800 rounded-2xl shadow-sm border border-gray-700 transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div class="text-xl font-semibold text-gray-200">
                {{ $t('marketplaces.platforms.facebook') }}
              </div>
            </div>
          </a>

          <a :href="localePath('/marketplaces/craigslist')">
            <div
              class="flex items-center justify-center p-8 bg-gray-800 rounded-2xl shadow-sm border border-gray-700 transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div class="text-xl font-semibold text-gray-200">
                {{ $t('marketplaces.platforms.craigslist') }}
              </div>
            </div>

          </a>

          <a :href="localePath('/marketplaces/kleinanzeigen')">
            <div
              class="flex items-center justify-center p-8 bg-gray-800 rounded-2xl shadow-sm border border-gray-700 transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div class="text-xl font-semibold text-gray-200">
                {{ $t('marketplaces.platforms.kleinanzeigen') }}
              </div>
            </div>

          </a>

          <a :href="localePath('/marketplaces/autoscout24')">
            <div
              class="flex items-center justify-center p-8 bg-gray-800 rounded-2xl shadow-sm border border-gray-700 transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div class="text-xl font-semibold text-gray-200">
                {{ $t('marketplaces.platforms.autoscout24') }}
              </div>
            </div>

          </a>
          <div
            class="flex items-center justify-center p-8 bg-gray-800 rounded-2xl shadow-sm border border-gray-700 transition-all hover:shadow-md hover:-translate-y-1"
          >
            <div class="text-xl font-semibold text-gray-200">
              {{ $t('marketplaces.platforms.more') }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="py-20 md:py-32 bg-gray-950">
      <div class="container mx-auto px-6">
        <div
          v-intersect="fadeIn"
          class="text-center mb-16 opacity-0"
        >
          <div class="inline-block px-3 py-1 rounded-full bg-indigo-900 text-indigo-400 font-medium text-sm mb-6">
            {{ $t('testimonials.badge') }}
          </div>
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
            {{ $t('testimonials.title') }}
          </h2>
          <p class="text-lg text-gray-300 max-w-2xl mx-auto">
            {{ $t('testimonials.description') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Testimonial 1 -->
          <div
            v-intersect="fadeInUp"
            class="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 opacity-0"
          >
            <p class="text-gray-300 mb-6 italic">
              {{ $t('testimonials.items.first.quote') }}
            </p>
            <div class="flex items-center">
              <div class="bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mr-3">
                <User class="h-6 w-6" />
              </div>
              <div>
                <div class="font-semibold text-white">
                  {{ $t('testimonials.items.first.name') }}
                </div>
                <div class="text-sm text-gray-400">
                  {{ $t('testimonials.items.first.role') }}
                </div>
                <div class="text-indigo-400 flex">
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Testimonial 2 -->
          <div
            v-intersect="fadeInUp"
            class="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 opacity-0"
          >
            <p class="text-gray-300 mb-6 italic">
              {{ $t('testimonials.items.second.quote') }}
            </p>
            <div class="flex items-center">
              <div class="bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mr-3">
                <User class="h-6 w-6" />
              </div>
              <div>
                <div class="font-semibold text-white">
                  {{ $t('testimonials.items.second.name') }}
                </div>
                <div class="text-sm text-gray-400">
                  {{ $t('testimonials.items.second.role') }}
                </div>
                <div class="text-indigo-400 flex">
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Testimonial 3 -->
          <div
            v-intersect="fadeInUp"
            class="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 opacity-0"
          >
            <p class="text-gray-300 mb-6 italic">
              {{ $t('testimonials.items.third.quote') }}
            </p>
            <div class="flex items-center">
              <div class="bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mr-3">
                <User class="h-6 w-6" />
              </div>
              <div>
                <div class="font-semibold text-white">
                  {{ $t('testimonials.items.third.name') }}
                </div>
                <div class="text-sm text-gray-400">
                  {{ $t('testimonials.items.third.role') }}
                </div>
                <div class="text-indigo-400 flex">
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                  <Icon
                    name="tabler:star-filled"
                    class="h- w-4"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section
      id="pricing"
      class="py-20 md:py-32 bg-gray-900"
    >
      <div class="container mx-auto px-6">
        <div
          v-intersect="fadeIn"
          class="text-center mb-16 opacity-0"
        >
          <div class="inline-block px-3 py-1 rounded-full bg-indigo-900 text-indigo-400 font-medium text-sm mb-6">
            {{ $t('pricing.badge') }}
          </div>
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
            {{ $t('pricing.title') }}
          </h2>
          <p class="text-lg text-gray-300 max-w-2xl mx-auto">
            {{ $t('pricing.description') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Free Plan -->
          <div
            v-intersect="fadeInUp"
            class="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 transition-all hover:shadow-2xl hover:-translate-y-1 opacity-0"
          >
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2">
                {{ $t('pricing.plans.free.name') }}
              </h3>
              <p class="text-gray-300 mb-4">
                {{ $t('pricing.plans.free.subtitle') }}
              </p>
              <div class="text-4xl font-bold text-white mb-1">
                {{ $t('pricing.plans.free.price') }}
              </div>
              <p class="text-gray-300">
                {{ $t('pricing.plans.free.billing') }}
              </p>
            </div>
            <div class="border-t border-gray-700 pt-6 mb-6">
              <ul class="space-y-4">
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-check"
                    class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                  />
                  <span class="text-gray-300">{{ $t('pricing.plans.free.features.notifiers') }}</span>
                </li>
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-check"
                    class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                  />
                  <span class="text-gray-300">{{ $t('pricing.plans.free.features.premiumSearches') }}</span>
                </li>
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-check"
                    class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                  />
                  <span class="text-gray-300">{{ $t('pricing.plans.free.features.email') }}</span>
                </li>
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-check"
                    class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                  />
                  <span class="text-gray-300">{{ $t('pricing.plans.free.features.updates') }}</span>
                </li>

                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-x"
                    class="w-5 h-5 text-gray-600 mr-2 mt-0.5"
                  />
                  <span class="text-gray-500">{{ $t('pricing.plans.free.features.analytics') }}</span>
                </li>
              </ul>
            </div>
            <a
              :href="localePath('/filters/create')"
              class="block w-full px-4 py-3 rounded-full border border-gray-600 text-gray-300 hover:bg-gray-700 transition-all text-center font-medium"
            >
              {{ $t('pricing.plans.free.cta') }}
            </a>
          </div>

          <!-- Collector Plan -->
          <div
            v-intersect="fadeInUp"
            class="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-indigo-800 transform scale-105 relative z-10 opacity-0"
          >
            <div
              class="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium"
            >
              {{ $t('pricing.popular') }}
            </div>
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2">
                {{ $t('pricing.plans.collector.name') }}
              </h3>
              <p class="text-gray-300 mb-4">
                {{ $t('pricing.plans.collector.subtitle') }}
              </p>
              <div class="text-4xl font-bold text-white mb-1">
                {{ $t('pricing.plans.collector.price') }}
              </div>
              <p class="text-gray-300">
                {{ $t('pricing.plans.collector.billing') }}
              </p>
            </div>
            <div class="border-t border-gray-700 pt-6 mb-6">
              <ul class="space-y-4">
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-check"
                    class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                  />
                  <span class="text-gray-300">{{ $t('pricing.plans.collector.features.notifiers') }}</span>
                </li>
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-check"
                    class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                  />
                  <span class="text-gray-300">{{ $t('pricing.plans.collector.features.premiumSearches') }}</span>
                </li>
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-check"
                    class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                  />
                  <span class="text-gray-300">{{ $t('pricing.plans.collector.features.notifications') }}</span>
                </li>
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-check"
                    class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                  />
                  <span class="text-gray-300">{{ $t('pricing.plans.collector.features.updates') }}</span>
                </li>
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-x"
                    class="w-5 h-5 text-gray-600 mr-2 mt-0.5"
                  />
                  <span class="text-gray-500">{{ $t('pricing.plans.collector.features.priceCalculation') }}</span>
                </li>
              </ul>
            </div>
            <a
              :href="localePath('/register?redirectTo=/subscriptions')"
              class="block w-full px-4 py-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all text-center font-medium shadow-lg shadow-indigo-900/20"
            >
              {{ $t('pricing.plans.collector.cta') }}
            </a>
          </div>

          <!-- Flipper Plan -->
          <div
            v-intersect="fadeInUp"
            class="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 relative transition-all hover:shadow-2xl hover:-translate-y-1 opacity-0"
          >
            <div
              class="absolute top-0 right-0 bg-gray-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium"
            >
              {{ $t('pricing.comingSoon') }}
            </div>
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2">
                {{ $t('pricing.plans.flipper.name') }}
              </h3>
              <p class="text-gray-300 mb-4">
                {{ $t('pricing.plans.flipper.subtitle') }}
              </p>
              <div class="text-4xl font-bold text-white mb-1">
                {{ $t('pricing.plans.flipper.price') }}
              </div>
              <p class="text-gray-300">
                {{ $t('pricing.plans.flipper.billing') }}
              </p>
            </div>
            <div class="border-t border-gray-700 pt-6 mb-6">
              <ul class="space-y-4">
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-check"
                    class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                  />
                  <span class="text-gray-300">{{ $t('pricing.plans.flipper.features.notifiers') }}</span>
                </li>
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-check"
                    class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                  />
                  <span class="text-gray-300">{{ $t('pricing.plans.flipper.features.premiumSearches') }}</span>
                </li>
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-check"
                    class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                  />
                  <span class="text-gray-300">{{ $t('pricing.plans.flipper.features.notifications') }}</span>
                </li>
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-check"
                    class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                  />
                  <span class="text-gray-300">{{ $t('pricing.plans.flipper.features.updates') }}</span>
                </li>
                <li class="flex items-start">
                  <Icon
                    name="tabler:circle-dashed-check"
                    class="w-5 h-5 text-indigo-400 mr-2 mt-0.5"
                  />
                  <span class="text-gray-300">{{ $t('pricing.plans.flipper.features.analytics') }}</span>
                </li>
              </ul>
            </div>
            <button
              disabled
              class="block w-full px-4 py-3 rounded-full bg-gray-700 text-gray-500 cursor-not-allowed text-center font-medium"
            >
              {{ $t('pricing.plans.flipper.cta') }}
            </button>
          </div>
        </div>

        <div
          v-intersect="fadeIn"
          class="mt-16 bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 opacity-0"
        >
          <h3 class="text-xl font-semibold text-white mb-4 text-center">
            {{ $t('pricing.allPlansInclude.title') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 ">
            <div class="flex items-center">
              <Icon
                name="tabler:shield"
                class="w-5 h-5 text-indigo-400 mr-2"
              />
              <span class="text-gray-300">{{ $t('pricing.allPlansInclude.security') }}</span>
            </div>
            <div class="flex items-center">
              <Icon
                name="tabler:headphones"
                class="w-5 h-5 text-indigo-400 mr-2"
              />
              <span class="text-gray-300">{{ $t('pricing.allPlansInclude.support') }}</span>
            </div>
            <div class="flex items-center">
              <Icon
                name="tabler:refresh"
                class="w-5 h-5 text-indigo-400 mr-2"
              />
              <span class="text-gray-300">{{ $t('pricing.allPlansInclude.updates') }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section
      id="faq"
      class="py-20 md:py-32 bg-gray-950"
    >
      <div class="container mx-auto px-6">
        <div
          v-intersect="fadeIn"
          class="text-center mb-16 opacity-0"
        >
          <div class="inline-block px-3 py-1 rounded-full bg-indigo-900 text-indigo-400 font-medium text-sm mb-6">
            {{ $t('faq.badge') }}
          </div>
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
            {{ $t('faq.title') }}
          </h2>
          <p class="text-lg text-gray-300 max-w-2xl mx-auto">
            {{ $t('faq.description') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- FAQ Item 1 -->
          <div
            v-intersect="fadeIn"
            class="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800 opacity-0"
          >
            <h3 class="text-xl font-semibold text-white mb-3">
              {{ $t('faq.items.first.question') }}
            </h3>
            <p class="text-gray-300">
              {{ $t('faq.items.first.answer') }}
            </p>
          </div>
          <div
            v-intersect="fadeIn"
            class="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800 opacity-0"
          >
            <h3 class="text-xl font-semibold text-white mb-3">
              {{ $t('faq.items.second.question') }}
            </h3>
            <p class="text-gray-300">
              {{ $t('faq.items.second.answer') }}
            </p>
          </div>

          <!-- FAQ Item 3 -->
          <div
            v-intersect="fadeIn"
            class="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800 opacity-0"
          >
            <h3 class="text-xl font-semibold text-white mb-3">
              {{ $t('faq.items.third.question') }}
            </h3>
            <p class="text-gray-300">
              {{ $t('faq.items.third.answer') }}
            </p>
          </div>
          <div
            v-intersect="fadeIn"
            class="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800 opacity-0"
          >
            <h3 class="text-xl font-semibold text-white mb-3">
              {{ $t('faq.items.fourth.question') }}
            </h3>
            <p class="text-gray-300">
              {{ $t('faq.items.fourth.answer') }}
            </p>
          </div>
          <!-- FAQ Item 5 -->
          <div
            v-intersect="fadeIn"
            class="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800 opacity-0"
          >
            <h3 class="text-xl font-semibold text-white mb-3">
              {{ $t('faq.items.fifth.question') }}
            </h3>
            <p class="text-gray-300">
              {{ $t('faq.items.fifth.answer') }}
            </p>
          </div>

          <!-- FAQ Item 6 -->
          <div
            v-intersect="fadeIn"
            class="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800 opacity-0"
          >
            <h3 class="text-xl font-semibold text-white mb-3">
              {{ $t('faq.items.sixth.question') }}
            </h3>
            <p class="text-gray-300">
              {{ $t('faq.items.sixth.answer') }}
            </p>
          </div>
        </div>

        <div
          v-intersect="fadeIn"
          class="mt-12 text-center opacity-0"
        >
          <p class="text-gray-300 mb-4">
            {{ $t('faq.moreQuestions') }}
          </p>
          <a
            href="https://discord.gg/vdjgMWDDzW"
            class="px-6 py-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-all inline-block"
          >
            {{ $t('faq.contactSupport') }}
          </a>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 md:py-32 bg-gray-950">
      <div class="container mx-auto px-6">
        <div
          v-intersect="fadeIn"
          class="bg-gradient-to-r from-indigo-800 to-purple-800 rounded-3xl p-12 text-center text-white relative overflow-hidden opacity-0"
        >
          <div
            class="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob"
          />
          <div
            class="absolute -bottom-24 -left-24 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob animation-delay-2000"
          />

          <div class="relative z-10">
            <h2 class="text-3xl md:text-4xl font-bold mb-6">
              {{ $t('cta.title') }}
            </h2>
            <p class="text-lg mb-8 max-w-2xl mx-auto">
              {{ $t('cta.description') }}
            </p>
            <div class="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <a
                :href="localePath('/filters/create')"
                class="px-8 py-4 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all font-medium shadow-lg"
              >
                {{ $t('cta.primaryButton') }}
              </a>
            </div>

            <div
              class="mt-12 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8"
            >
              <div class="flex items-center">
                <Icon
                  name="tabler:shield-check"
                  class="w-6 h-6 mr-2"
                />
                <span>{{ $t('cta.benefits.noCreditCard') }}</span>
              </div>

              <div class="flex items-center">
                <Icon
                  name="tabler:mail-x"
                  class="w-6 h-6 mr-2"
                />
                <span>{{ $t('cta.benefits.noEmailRequired') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-950 py-12 border-t border-gray-800">
      <div class="container mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between mb-8">
          <div class="mb-8 md:mb-0">
            <div class="flex items-center mb-4">
              <span class="text-xl font-bold text-white">ANE</span>
            </div>
            <p class="text-gray-400 max-w-xs">
              {{ $t('smartWayToFindDeals') }}
            </p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div class="hidden">
              <h4 class="hidden font-bold mb-4 text-white">
                Product
              </h4>
              <ul class="space-y-2">
                <li>
                  <a
                    href="#"
                    class="text-gray-400 hover:text-white transition"
                  >Features</a>
                </li>
                <li>
                  <a
                    href="#"
                    class="text-gray-400 hover:text-white transition"
                  >Pricing</a>
                </li>
                <li>
                  <a
                    href="#"
                    class="text-gray-400 hover:text-white transition"
                  >Testimonials</a>
                </li>
                <li>
                  <a
                    href="#"
                    class="text-gray-400 hover:text-white transition"
                  >FAQ</a>
                </li>
              </ul>
            </div>
            <div class="hidden">
              <h4 class="font-bold mb-4 text-white">
                Company
              </h4>
              <ul class="space-y-2">
                <li>
                  <a
                    href="#"
                    class="text-gray-400 hover:text-white transition"
                  >About</a>
                </li>
                <li>
                  <a
                    href="#"
                    class="text-gray-400 hover:text-white transition"
                  >Blog</a>
                </li>
                <li>
                  <a
                    href="#"
                    class="text-gray-400 hover:text-white transition"
                  >Careers</a>
                </li>
                <li>
                  <a
                    href="#"
                    class="text-gray-400 hover:text-white transition"
                  >Contact</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold mb-4 text-white">
                Legal
              </h4>
              <ul class="space-y-2">
                <li>
                  <a
                    href="https://coflnet.com/privacy"
                    class="text-gray-400 hover:text-white transition"
                  >{{
                    $t('privacy')
                  }}</a>
                </li>
                <li>
                  <a
                    href="https://coflnet.com/terms-of-service"
                    class="text-gray-400 hover:text-white transition"
                  >{{
                    $t('terms') }}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-8 mt-8 text-center text-gray-500 text-sm">
          <p>{{ $t('rights') }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { User } from 'lucide-vue-next'
import { useIntersectionObserver } from '@vueuse/core'
import { definePageMeta } from '#imports'

const localePath = useLocalePath()

const vIntersect = {
  mounted: (el: Element, binding: any) => {
    const callback = binding.value
    const { stop } = useIntersectionObserver(
      el,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          callback(el)
          stop()
        }
      },
      { threshold: 0.1 },
    )
  },
}

// Animation functions
const fadeIn = (el: Element) => {
  el.classList.add('transition-opacity', 'duration-1000')
  el.classList.remove('opacity-0')
  el.classList.add('opacity-100')
}

const fadeInUp = (el: Element) => {
  el.classList.add('transition-all', 'duration-1000')
  el.classList.remove('opacity-0', 'translate-y-10')
  el.classList.add('opacity-100', 'translate-y-0')
}

definePageMeta({
  layout: 'landing',
})
</script>

<style>
/* Animation classes */
.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }

  33% {
    transform: translate(30px, -50px) scale(1.1);
  }

  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }

  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}
</style>
