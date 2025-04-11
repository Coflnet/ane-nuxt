<template>
  <footer class="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-8">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <div class="mb-4 md:mb-0">
          <div class="flex items-center space-x-2">
            <div
              class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BellIcon class="w-4 h-4 text-white" />
            </div>
            <span
              class="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">ANE</span>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Advanced Notification Engine for auction marketplaces
          </p>
        </div>

        <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-12">
          <div>
            <h3 class="font-medium text-slate-900 dark:text-white mb-2">Resources</h3>
            <ul class="space-y-2">
              <li>
                <a href="#"
                  class="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                  Documentation
                </a>
              </li>
              <li>
                <a href="https://ane.coflnet.com/api/index.html"
                  class="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                  API Reference
                </a>
              </li>
              <li>
                <a href="https://discord.gg/vdjgMWDDzW"
                  class="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium text-slate-900 dark:text-white mb-2">Company</h3>
            <ul class="space-y-2">
              <li>
                <a href="#"
                  class="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                  About
                </a>
              </li>
              <li>
                <a href="https://coflnet.com/privacy"
                  class="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                  Privacy
                </a>
              </li>
              <li>
                <a href="https://coflnet.com/terms-of-service"
                  class="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div
        class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
        &copy; {{ new Date().getFullYear() }} Coflnet GMH. All rights reserved.
      </div>
    </div>
  </footer>
</template>

<script setup>
import { BellIcon } from 'lucide-vue-next'
</script>
