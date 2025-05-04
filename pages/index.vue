<template>
  <div class="bg-gradient-to-b from-slate-950 to-slate-900 min-h-screen text-white">
    <!-- Navigation -->
    <nav class="container mx-auto px-6 py-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center">
          <span class="text-xl font-bold">ANE</span>
        </div>
        <div class="hidden md:flex space-x-8">
          <a href="#features" class="hover:text-slate-300 transition">{{
            $t("features")
            }}</a>
          <a href="#how-it-works" class="hover:text-slate-300 transition">{{
            $t("howItWorks")
            }}</a>
          <a href="#pricing" class="hover:text-slate-300 transition">{{
            $t("pricing")
            }}</a>
        </div>
        <NuxtLink to="/overview" class="bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition">
          {{ $t("getStarted") }}
        </NuxtLink>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="container mx-auto px-6 py-16 md:py-24">
      <div class="flex flex-col md:flex-row items-center">
        <div class="md:w-1/2 mb-10 md:mb-0 mr-8">
          <h1 class="text-4xl md:text-5xl font-bold leading-tight mb-6">
            <i18n-t keypath="marketingTextNeverMissADeal.text" tag="span">
              <template v-slot:deal>
                <span class="text-slate-400">{{
                  $t("marketingTextNeverMissADeal.deal")
                  }}</span>
              </template>
            </i18n-t>
          </h1>
          <p class="text-lg md:text-xl mb-8 text-slate-100">
            {{ $t("createCustomAlerts") }}
          </p>
          <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button @click="navigateTo(localePath('/overview'))"
              class="bg-slate-600 hover:bg-slate-700 px-6 py-3 rounded-lg font-medium text-lg transition">
              {{ $t("getStarted") }}
            </button>
          </div>
        </div>
        <div class="md:w-1/2">
          <div class="relative">
            <div class="absolute -top-4 -left-4 w-full h-full bg-slate-400 rounded-lg"></div>
            <div class="relative bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
              <div class="flex items-center mb-4">
                <Bell class="h-5 w-5 mr-2 text-slate-400" />
                <h3 class="font-medium">{{ $t("newAlert") }}</h3>
              </div>
              <div class="bg-slate-900 rounded-lg p-4 mb-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium">{{ $t("vintageCameraLens") }}</h4>
                    <p class="text-slate-300 text-sm">
                      {{ $t("listedXMinutesAgo", 3) }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-green-400 font-bold">$85.00</p>
                    <p class="text-slate-300 text-sm line-through">
                      {{ $t("market150") }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="bg-slate-900 rounded-lg p-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium">{{ $t("mechanicalKeyboard") }}</h4>
                    <p class="text-slate-300 text-sm">
                      {{ $t("listedXMinutesAgo", 17) }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-green-400 font-bold">$45.00</p>
                    <p class="text-slate-300 text-sm line-through">
                      {{ $t("market120") }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="container mx-auto px-6 py-16 md:py-24">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">
        <i18n-t keypath="marketingTextPowerTools.text" tag="span">
          <template v-slot:dealHunter>
            <span class="text-slate-400">{{
              $t("marketingTextPowerTools.dealHunter")
              }}</span>
          </template>
        </i18n-t>
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition">
          <div class="bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Bell class="h-6 w-6 text-slate-300" />
          </div>
          <h3 class="text-xl font-bold mb-3">{{ $t("realTimeAlerts") }}</h3>
          <p class="text-slate-200">
            {{ $t("instantNotifications") }}
          </p>
        </div>
        <div class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition">
          <div class="bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Filter class="h-6 w-6 text-slate-300" />
          </div>
          <h3 class="text-xl font-bold mb-3">{{ $t("advanvedFilters") }}</h3>
          <p class="text-slate-200">
            {{ $t("complexFilters") }}
          </p>
        </div>
        <div class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition">
          <div class="bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <TrendingUp class="h-6 w-6 text-slate-300" />
          </div>
          <h3 class="text-xl font-bold mb-3">{{ $t("marketAnalyist") }}</h3>
          <p class="text-slate-200">
            {{ $t("viewHistoricalData") }}
          </p>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="container mx-auto px-6 py-16 md:py-24 bg-slate-950/50 rounded-xl">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">
        {{ $t("how") }} <span class="text-slate-400">ANE</span>
        {{ $t("works") }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold">1</span>
          </div>
          <h3 class="text-xl font-bold mb-3">{{ $t("createFilter") }}</h3>
          <p class="text-slate-200">
            {{ $t("customFilter") }}
          </p>
        </div>
        <div class="text-center">
          <div class="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold">2</span>
          </div>
          <h3 class="text-xl font-bold mb-3">{{ $t("getNotified") }}</h3>
          <p class="text-slate-200">
            {{ $t("receiveInstantAlerts") }}
          </p>
        </div>
        <div class="text-center">
          <div class="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold">3</span>
          </div>
          <h3 class="text-xl font-bold mb-3">{{ $t("buyAndSave") }}</h3>
          <p class="text-slate-200">
            {{ $t("beTheFirst") }}
          </p>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="container mx-auto px-6 py-16 md:py-24">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">
        {{ $t("whatOur") }}
        <span class="text-slate-400">{{ $t("usersSay") }}</span>
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
          <div class="flex items-start mb-4">
            <div class="mr-4">
              <div class="bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center">
                <User class="h-6 w-6" />
              </div>
            </div>
            <div>
              <h4 class="font-bold">Sarah K.</h4>
              <p class="text-slate-300 text-sm">{{ $t("vintageCollector") }}</p>
              <div class="flex text-yellow-400 mt-1">
                <Star class="h-4 w-4" />
                <Star class="h-4 w-4" />
                <Star class="h-4 w-4" />
                <Star class="h-4 w-4" />
                <Star class="h-4 w-4" />
              </div>
            </div>
          </div>
          <p class="text-slate-200">
            {{ $t("vintageCollectorDecription") }}
          </p>
        </div>
        <div class="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
          <div class="flex items-start mb-4">
            <div class="mr-4">
              <div class="bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center">
                <User class="h-6 w-6" />
              </div>
            </div>
            <div>
              <h4 class="font-bold">Marcus T.</h4>
              <p class="text-slate-300 text-sm">{{ $t("reseller") }}</p>
              <div class="flex text-yellow-400 mt-1">
                <Star class="h-4 w-4" />
                <Star class="h-4 w-4" />
                <Star class="h-4 w-4" />
                <Star class="h-4 w-4" />
                <Star class="h-4 w-4" />
              </div>
            </div>
          </div>
          <p class="text-slate-200">
            {{
              $t("resellerDescription", {
                amount: $n(3000, "currency"),
                months: 3,
              })
            }}
          </p>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="container mx-auto px-6 py-16 md:py-24">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">
        {{ $t("simpleTransparent") }}
        <span class="text-slate-400"> {{ $t("pricing") }}</span>
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition flex flex-col justify-between">
          <div>
            <h3 class="text-xl font-bold mb-2">{{ $t("free") }}</h3>
            <p class="text-3xl font-bold mb-6">
              $0
              <span class="text-sm font-normal text-slate-300">{{
                $t("month")
                }}</span>
            </p>
            <ul class="mb-8 space-y-3">
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span> {{ $t("XactiveFilters", 30) }}</span>
              </li>
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span>{{ $t("pushNotifications") }}</span>
              </li>
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span>{{ $t("XMinuteDelay", 30) }}</span>
              </li>
            </ul>
          </div>
          <button @click="navigateTo(localePath('/overview'))"
            class="w-full bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition">
            {{ $t("getStarted") }}
          </button>
        </div>
        <div
          class="bg-slate-800 p-6 rounded-lg border-2 border-slate-500 transform md:-translate-y-4 relative flex flex-col justify-between">
          <div>
            <div
              class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-slate-500 px-4 py-1 rounded-full text-sm font-bold">
              {{ $t("mostPopular") }}
            </div>
            <h3 class="text-xl font-bold mb-2">Collectors</h3>
            <p class="text-3xl font-bold mb-6">
              $9.99
              <span class="text-sm font-normal text-slate-300">{{
                $t("month")
                }}</span>
            </p>
            <ul class="mb-8 space-y-3">
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span>{{ $t("XActiveFilters", 20) }}</span>
              </li>
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span>{{ $t("pushNotifications") }}</span>
              </li>
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span> {{ $t("XMinuteDelay", 10) }}</span>
              </li>
            </ul>
          </div>

          <button @click="navigateTo(localePath('/register?redirectTo=/subscription'))"
            class="w-full bg-slate-500 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition">
            {{ $t("getStarted") }}
          </button>
        </div>
        <div
          class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition flex flex-col justify-between">
          <div>
            <h3 class="text-xl font-bold mb-2">{{ $t("flippers") }}</h3>
            <p class="text-3xl font-bold mb-6">
              $69.69
              <span class="text-sm font-normal text-slate-300">{{
                $t("month")
                }}</span>
            </p>
            <ul class="mb-8 space-y-3">
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span>{{ $t("XactiveFilters", 500) }}</span>
              </li>
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span>{{ $t("XMinuteDelay", 2) }}</span>
              </li>
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span> {{ $t("priceCalculation") }}</span>
              </li>
            </ul>
          </div>
          <button class="w-full bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition">
            {{ $t("comingSoon") }}
          </button>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="container mx-auto px-6 py-16 md:py-24">
      <div class="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-8 md:p-12 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">
          {{ $t("startFindingDeals") }}
        </h2>
        <p class="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          {{ $t("joinThousandsSmartShoppers") }}
        </p>
        <NuxtLink to="/overview"
          class="bg-white text-slate-800 hover:bg-slate-200 px-8 py-3 rounded-lg font-medium text-lg transition">
          {{ $t("getStarted") }}
        </NuxtLink>
        <p class="mt-4 text-slate-200">
          {{ $t("joinFreeToday") }}
        </p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-slate-950 py-12">
      <div class="container mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between mb-8">
          <div class="mb-8 md:mb-0">
            <div class="flex items-center mb-4">
              <span class="text-xl font-bold">ANE</span>
            </div>
            <p class="text-slate-300 max-w-xs">
              {{ $t("smartWayToFindDeals") }}
            </p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div class="hidden">
              <h4 class="hidden font-bold mb-4">Product</h4>
              <ul class="space-y-2">
                <li>
                  <a href="#" class="text-slate-300 hover:text-white transition">Features</a>
                </li>
                <li>
                  <a href="#" class="text-slate-300 hover:text-white transition">Pricing</a>
                </li>
                <li>
                  <a href="#" class="text-slate-300 hover:text-white transition">Testimonials</a>
                </li>
                <li>
                  <a href="#" class="text-slate-300 hover:text-white transition">FAQ</a>
                </li>
              </ul>
            </div>
            <div class="hidden">
              <h4 class="font-bold mb-4">Company</h4>
              <ul class="space-y-2">
                <li>
                  <a href="#" class="text-slate-300 hover:text-white transition">About</a>
                </li>
                <li>
                  <a href="#" class="text-slate-300 hover:text-white transition">Blog</a>
                </li>
                <li>
                  <a href="#" class="text-slate-300 hover:text-white transition">Careers</a>
                </li>
                <li>
                  <a href="#" class="text-slate-300 hover:text-white transition">Contact</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold mb-4">Legal</h4>
              <ul class="space-y-2">
                <li>
                  <a href="https://coflnet.com/privacy" class="text-slate-300 hover:text-white transition">{{
                    $t("privacy")
                    }}</a>
                </li>
                <li>
                  <a href="https://coflnet.com/terms-of-service" class="text-slate-300 hover:text-white transition">{{
                    $t("terms") }}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="border-t border-slate-800 pt-8 mt-8 text-center text-slate-400 text-sm">
          <p>{{ $t("rights") }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { Bell, Filter, TrendingUp, Check, Star, User } from "lucide-vue-next";
const localePath = useLocalePath();

definePageMeta({
  layout: "landing",
});
</script>
