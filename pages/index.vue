<template>
  <div class="bg-gradient-to-b from-slate-950 to-slate-900 min-h-screen text-white">
    <!-- Navigation -->
    <nav class="container mx-auto px-6 py-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center">
          <span class="text-xl font-bold">NimDing</span>
        </div>
        <div class="hidden md:flex space-x-8">
          <a href="#features" class="hover:text-slate-300 transition">Features</a>
          <a href="#how-it-works" class="hover:text-slate-300 transition">How It Works</a>
          <a href="#pricing" class="hover:text-slate-300 transition">Pricing</a>
        </div>
        <NuxtLink to="/register" class="bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition">
          {{ $t('signup') }}
        </NuxtLink>

      </div>
    </nav>

    <!-- Hero Section -->
    <section class="container mx-auto px-6 py-16 md:py-24">
      <div class="flex flex-col md:flex-row items-center">
        <div class="md:w-1/2 mb-10 md:mb-0 mr-8">
          <h1 class="text-4xl md:text-5xl font-bold leading-tight mb-6">
            {{ $t('landingHero1') }} <span class="text-slate-400">{{ $t('landingHero2') }}</span> {{ $t('landingHero3')
            }}

          </h1>
          <p class="text-lg md:text-xl mb-8 text-slate-100">
            {{ $t('landingFooter') }}
          </p>
          <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button class="bg-slate-600 hover:bg-slate-700 px-6 py-3 rounded-lg font-medium text-lg transition">
              {{ $t('signup') }}
            </button>
          </div>
        </div>
        <div class="md:w-1/2">
          <div class="relative">
            <div class="absolute -top-4 -left-4 w-full h-full bg-slate-400 rounded-lg"></div>
            <div class="relative bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
              <div class="flex items-center mb-4">
                <Bell class="h-5 w-5 mr-2 text-slate-400" />
                <h3 class="font-medium">{{ $t('heroWidget1') }} </h3>
              </div>
              <div class="bg-slate-900 rounded-lg p-4 mb-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium">{{ $t('heroWidget2') }}</h4>
                    <p class="text-slate-300 text-sm">{{ $t('heroWidget3') }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-green-400 font-bold">$85.00</p>
                    <p class="text-slate-300 text-sm line-through">Market: $150+</p>
                  </div>
                </div>
              </div>
              <div class="bg-slate-900 rounded-lg p-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium">{{ $t('heroWidget4') }}</h4>
                    <p class="text-slate-300 text-sm">{{ $t('heroWidget4') }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-green-400 font-bold">$45.00</p>
                    <p class="text-slate-300 text-sm line-through">Market: $120+</p>
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
        {{ $t('tools') }}<span class="text-slate-400">{{ $t('dealHunters') }}</span>
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">

        <div class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition">
          <div class="bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Bell class="h-6 w-6 text-slate-300" />
          </div>
          <h3 class="text-xl font-bold mb-3">{{ $t('informWidget') }}</h3>
          <p class="text-slate-200">
            {{ $t('informFooter') }}
          </p>

        </div>
        <div class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition">
          <div class="bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Filter class="h-6 w-6 text-slate-300" />
          </div>
          <h3 class="text-xl font-bold mb-3">{{ $t('informWidget2') }}</h3>
          <p class="text-slate-200">
            {{ $t('informFooter2') }}
          </p>
        </div>
        <div class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition">
          <div class="bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <TrendingUp class="h-6 w-6 text-slate-300" />
          </div>
          <h3 class="text-xl font-bold mb-3">{{ $t('informWidget3') }}</h3>
          <p class="text-slate-200">
            {{ $t('informFooter3') }}
          </p>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="container mx-auto px-6 py-16 md:py-24 bg-slate-950/50 rounded-xl">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">
        {{ $t('how') }} <span class="text-slate-400">NimDing</span> {{ $t('works') }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold">1</span>
          </div>
          <h3 class="text-xl font-bold mb-3">{{ $t('createFiler') }}</h3>
          <p class="text-slate-200">
            {{ $t('custumFilter') }}
          </p>
        </div>
        <div class="text-center">
          <div class="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold">2</span>
          </div>
          <h3 class="text-xl font-bold mb-3">{{ $t('notif') }}</h3>
          <p class="text-slate-200">
            {{ $t('revInst') }}
          </p>
        </div>
        <div class="text-center">
          <div class="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold">3</span>
          </div>
          <h3 class="text-xl font-bold mb-3">{{ $t('bs') }}</h3>
          <p class="text-slate-200">
            {{ $t('befirst') }}</p>

        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="container mx-auto px-6 py-16 md:py-24">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">
        {{ $t('whatour') }} <span class="text-slate-400">{{ $t('usersay') }}</span>
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
              <p class="text-slate-300 text-sm">{{ $t('vinCol') }}</p>
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
            {{ $t('vinColDesc') }}
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
              <p class="text-slate-300 text-sm">{{ $t('resSeller') }}</p>
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
            {{ $t('resSeller') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="container mx-auto px-6 py-16 md:py-24">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">
        {{ $t('simpleTran') }}<span class="text-slate-400">{{ $t('price') }}</span>
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition flex flex-col justify-between">
          <div>
            <h3 class="text-xl font-bold mb-2">Free</h3>
            <p class="text-3xl font-bold mb-6">$0<span class="text-sm font-normal text-slate-300">/month</span></p>
            <ul class="mb-8 space-y-3">
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span> {{ $t('actfil') }}</span>
              </li>
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span>{{ $t('pushNotif') }}</span>
              </li>
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span>{{ $t('30delay') }}</span>
              </li>
            </ul>
          </div>
          <button class="w-full bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition">
            {{ $t('getStarted') }}
          </button>
        </div>
        <div
          class="bg-slate-800 p-6 rounded-lg border-2 border-slate-500 transform md:-translate-y-4 relative flex flex-col justify-between">
          <div>
            <div
              class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-slate-500 px-4 py-1 rounded-full text-sm font-bold">
              {{ $t('mospol') }}
            </div>
            <h3 class="text-xl font-bold mb-2">Collectors</h3>
            <p class="text-3xl font-bold mb-6">$9.99<span class="text-sm font-normal text-slate-300">/month</span></p>
            <ul class="mb-8 space-y-3">
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span>{{ $t('20 active filters') }}</span>
              </li>
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span>{{ $t('pushNotif') }}</span>
              </li>
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span> {{ $t('10delay') }}</span>
              </li>
            </ul>
          </div>

          <button class="w-full bg-slate-500 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition">
            {{ $t('getStarted') }}
          </button>
        </div>
        <div
          class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition flex flex-col justify-between">
          <div>
            <h3 class="text-xl font-bold mb-2">Flippers</h3>
            <p class="text-3xl font-bold mb-6">$69.69<span class="text-sm font-normal text-slate-300">/month</span></p>
            <ul class="mb-8 space-y-3">
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span>{{ $t('500act') }}</span>
              </li>
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span>{{ $t('12del') }}</span>
              </li>
              <li class="flex items-center">
                <Check class="h-5 w-5 text-green-400 mr-2" />
                <span> {{ $t('priceCalc') }}</span>
              </li>
            </ul>
          </div>
          <button class="w-full bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition">
            {{ $t('soon') }}
          </button>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="container mx-auto px-6 py-16 md:py-24">
      <div class="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-8 md:p-12 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">
          {{ $t('ready') }}
        </h2>
        <p class="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          {{ $t('joint') }}
        </p>
        <NuxtLink to="/register"
          class="bg-white text-slate-800 hover:bg-slate-200 px-8 py-3 rounded-lg font-medium text-lg transition">
          Sign Up Free
          {{ $t('signup') }}
        </NuxtLink>
        <p class="mt-4 text-slate-200">
          {{ $t('joinno') }}
        </p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-slate-950 py-12">
      <div class="container mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between mb-8">
          <div class="mb-8 md:mb-0">
            <div class="flex items-center mb-4">
              <span class="text-xl font-bold">NimDing</span>
            </div>
            <p class="text-slate-300 max-w-xs">
              {{ $t('smart') }}
            </p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div class="hidden">
              <h4 class="hidden font-bold mb-4">Product</h4>
              <ul class="space-y-2">
                <li><a href="#" class="text-slate-300 hover:text-white transition">Features</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">Pricing</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">Testimonials</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div class="hidden">
              <h4 class="font-bold mb-4">Company</h4>
              <ul class="space-y-2">
                <li><a href="#" class="text-slate-300 hover:text-white transition">About</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">Blog</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">Careers</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div class="flex flex-row">
              <h4 class=" font-bold mb-4">Legal</h4>
              <ul class="space-y-2 flex">
                <li><a href="https://coflnet.com/privacy" class="text-slate-300 hover:text-white transition">{{
                  $t('privacy') }}</a>
                </li>
                <li><a href="https://coflnet.com/terms-of-service" class="text-slate-300 hover:text-white transition">{{
                  $t('terms') }}</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="border-t border-slate-800 pt-8 mt-8 text-center text-slate-400 text-sm">
          <p>{{ $t('rights') }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { AlertCircle, Bell, Filter, TrendingUp, Check, Star, User } from 'lucide-vue-next'

definePageMeta({
  layout: 'landing'
})
</script>
