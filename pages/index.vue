<template>
  <div class="bg-gradient-to-b from-slate-950 to-slate-900 min-h-screen text-white">
    <!-- Navigation -->
    <nav class="container mx-auto px-6 py-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center">
          <AlertCircle class="h-6 w-6 mr-2" />
          <span class="text-xl font-bold">NimDing</span>
        </div>
        <div class="hidden md:flex space-x-8">
          <a href="#features" class="hover:text-slate-300 transition">Features</a>
          <a href="#how-it-works" class="hover:text-slate-300 transition">How It Works</a>
          <a href="#pricing" class="hover:text-slate-300 transition">Pricing</a>
        </div>
        <button class="bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition">
          Sign Up Free
        </button>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="container mx-auto px-6 py-16 md:py-24">
      <div class="flex flex-col md:flex-row items-center">
        <div class="md:w-1/2 mb-10 md:mb-0">
          <h1 class="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Never Miss a <span class="text-slate-400">Deal</span> Again
          </h1>
          <p class="text-lg md:text-xl mb-8 text-slate-100">
            Create custom alerts and filters for eBay and other marketplaces. Buy low, sell high, and maximize your
            profits.
          </p>
          <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button class="bg-slate-600 hover:bg-slate-700 px-6 py-3 rounded-lg font-medium text-lg transition">
              Get Started
            </button>
          </div>
        </div>
        <div class="md:w-1/2">
          <div class="relative">
            <div class="absolute -top-4 -left-4 w-full h-full bg-slate-400 rounded-lg"></div>
            <div class="relative bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
              <div class="flex items-center mb-4">
                <Bell class="h-5 w-5 mr-2 text-slate-400" />
                <h3 class="font-medium">New Alert Match!</h3>
              </div>
              <div class="bg-slate-900 rounded-lg p-4 mb-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium">Vintage Camera Lens</h4>
                    <p class="text-slate-300 text-sm">Listed 3 minutes ago</p>
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
                    <h4 class="font-medium">Mechanical Keyboard</h4>
                    <p class="text-slate-300 text-sm">Listed 17 minutes ago</p>
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
        Powerful Tools for <span class="text-slate-400">Deal Hunters</span>
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition">
          <div class="bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Bell class="h-6 w-6 text-slate-300" />
          </div>
          <h3 class="text-xl font-bold mb-3">Real-time Alerts</h3>
          <p class="text-slate-200">
            Get instant notifications when items matching your criteria are listed. Be the first to snag that deal.
          </p>
        </div>
        <div class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition">
          <div class="bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Filter class="h-6 w-6 text-slate-300" />
          </div>
          <h3 class="text-xl font-bold mb-3">Advanced Filters</h3>
          <p class="text-slate-200">
            Create complex filters with multiple conditions. Filter by price, condition, seller rating, and more.
          </p>
        </div>
        <div class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition">
          <div class="bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <TrendingUp class="h-6 w-6 text-slate-300" />
          </div>
          <h3 class="text-xl font-bold mb-3">Market Analysis</h3>
          <p class="text-slate-200">
            See historical price data and trends to identify the best buying and selling opportunities.
          </p>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="container mx-auto px-6 py-16 md:py-24 bg-slate-950/50 rounded-xl">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">
        How <span class="text-slate-400">NimDing</span> Works
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold">1</span>
          </div>
          <h3 class="text-xl font-bold mb-3">Create Your Filters</h3>
          <p class="text-slate-200">
            Set up custom filters for the items you're looking for. Specify price ranges, keywords, and conditions.
          </p>
        </div>
        <div class="text-center">
          <div class="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold">2</span>
          </div>
          <h3 class="text-xl font-bold mb-3">Get Notified</h3>
          <p class="text-slate-200">
            Receive instant alerts when matching items are listed. Choose from email, discord, or push notifications.
          </p>
        </div>
        <div class="text-center">
          <div class="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold">3</span>
          </div>
          <h3 class="text-xl font-bold mb-3">Buy & Save</h3>
          <p class="text-slate-200">
            Be the first to purchase underpriced items and save money on things you want </p>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="container mx-auto px-6 py-16 md:py-24">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">
        What Our <span class="text-slate-400">Users Say</span>
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
              <p class="text-slate-300 text-sm">Vintage Collector</p>
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
            "DealAlert has completely changed how I source vintage items. I've found rare pieces at 60% below market
            value because I was notified the moment they were listed."
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
              <p class="text-slate-300 text-sm">Reseller</p>
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
            "I've made over $5,000 in profit in just three months using DealAlert. The advanced filters let me zero in
            on exactly what I'm looking for, and the real-time alerts give me the edge over other buyers."
          </p>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="container mx-auto px-6 py-16 md:py-24">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">
        Simple, Transparent <span class="text-slate-400">Pricing</span>
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition">
          <h3 class="text-xl font-bold mb-2">Free</h3>
          <p class="text-3xl font-bold mb-6">$0<span class="text-sm font-normal text-slate-300">/month</span></p>
          <ul class="mb-8 space-y-3">
            <li class="flex items-center">
              <Check class="h-5 w-5 text-green-400 mr-2" />
              <span>3 active filters</span>
            </li>
            <li class="flex items-center">
              <Check class="h-5 w-5 text-green-400 mr-2" />
              <span>Email notifications</span>
            </li>
            <li class="flex items-center">
              <Check class="h-5 w-5 text-green-400 mr-2" />
              <span>Basic filter options</span>
            </li>
          </ul>
          <button class="w-full bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition">
            Get Started
          </button>
        </div>
        <div class="bg-slate-800 p-6 rounded-lg border-2 border-slate-500 transform md:-translate-y-4 relative">
          <div
            class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-slate-500 px-4 py-1 rounded-full text-sm font-bold">
            Most Popular
          </div>
          <h3 class="text-xl font-bold mb-2">Pro</h3>
          <p class="text-3xl font-bold mb-6">$9.99<span class="text-sm font-normal text-slate-300">/month</span></p>
          <ul class="mb-8 space-y-3">
            <li class="flex items-center">
              <Check class="h-5 w-5 text-green-400 mr-2" />
              <span>20 active filters</span>
            </li>
            <li class="flex items-center">
              <Check class="h-5 w-5 text-green-400 mr-2" />
              <span>Email, SMS & push notifications</span>
            </li>
            <li class="flex items-center">
              <Check class="h-5 w-5 text-green-400 mr-2" />
              <span>Advanced filter options</span>
            </li>
            <li class="flex items-center">
              <Check class="h-5 w-5 text-green-400 mr-2" />
              <span>Price history data</span>
            </li>
          </ul>
          <button class="w-full bg-slate-500 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition">
            Start 7-Day Free Trial
          </button>
        </div>
        <div class="bg-slate-900/50 p-6 rounded-lg border border-slate-800 hover:border-slate-600 transition">
          <h3 class="text-xl font-bold mb-2">Business</h3>
          <p class="text-3xl font-bold mb-6">$24.99<span class="text-sm font-normal text-slate-300">/month</span></p>
          <ul class="mb-8 space-y-3">
            <li class="flex items-center">
              <Check class="h-5 w-5 text-green-400 mr-2" />
              <span>Unlimited active filters</span>
            </li>
            <li class="flex items-center">
              <Check class="h-5 w-5 text-green-400 mr-2" />
              <span>Priority notifications</span>
            </li>
            <li class="flex items-center">
              <Check class="h-5 w-5 text-green-400 mr-2" />
              <span>Market analysis tools</span>
            </li>
            <li class="flex items-center">
              <Check class="h-5 w-5 text-green-400 mr-2" />
              <span>API access</span>
            </li>
          </ul>
          <button class="w-full bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition">
            Contact Sales
          </button>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="container mx-auto px-6 py-16 md:py-24">
      <div class="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-8 md:p-12 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">
          Ready to Start Finding Deals?
        </h2>
        <p class="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of smart shoppers and resellers who are saving money and making profits with DealAlert.
        </p>
        <button class="bg-white text-slate-800 hover:bg-slate-200 px-8 py-3 rounded-lg font-medium text-lg transition">
          Sign Up Free
        </button>
        <p class="mt-4 text-slate-200">
          No credit card required. Start with our free plan today.
        </p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-slate-950 py-12">
      <div class="container mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between mb-8">
          <div class="mb-8 md:mb-0">
            <div class="flex items-center mb-4">
              <AlertCircle class="h-6 w-6 mr-2" />
              <span class="text-xl font-bold">DealAlert</span>
            </div>
            <p class="text-slate-300 max-w-xs">
              The smart way to find deals and make profits on online marketplaces.
            </p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 class="font-bold mb-4">Product</h4>
              <ul class="space-y-2">
                <li><a href="#" class="text-slate-300 hover:text-white transition">Features</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">Pricing</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">Testimonials</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold mb-4">Company</h4>
              <ul class="space-y-2">
                <li><a href="#" class="text-slate-300 hover:text-white transition">About</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">Blog</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">Careers</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold mb-4">Legal</h4>
              <ul class="space-y-2">
                <li><a href="#" class="text-slate-300 hover:text-white transition">Privacy</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">Terms</a></li>
                <li><a href="#" class="text-slate-300 hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="border-t border-slate-800 pt-8 mt-8 text-center text-slate-400 text-sm">
          <p>© 2025 Coflnet. All rights reserved.</p>
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
