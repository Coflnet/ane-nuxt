<template>
  <div class="max-w-md mx-auto mt-12">
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      <div class="p-8">
        <div class="text-center mb-8">
          <div
            class="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto">
            <BellIcon class="w-8 h-8 text-white" />
          </div>
          <h1 class="mt-4 text-2xl font-bold text-slate-900 dark:text-white">{{ $t('welcom') }}</h1>
          <p class="mt-2 text-slate-500 dark:text-slate-400">{{ $t('signinAc') }}</p>
        </div>

        <div class="space-y-4">
          <button @click="loginWithGoogle"
            class="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo"
              class="w-5 h-5" />
            <span class="text-slate-700 dark:text-white font-medium">{{ $t('cwg') }}</span>
          </button>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400"> {{ $t('moreOpt') }}
              </span>
            </div>
          </div>

          <div class="text-center text-sm text-slate-500 dark:text-slate-400">
            <p> {{ $t('sellSoul') }}<a href="https://coflnet.com/terms-of-service"
                class="text-indigo-600 dark:text-indigo-400 hover:underline">{{
                  $t('tos') }}</a> {{ $t('and') }} <a href="https://coflnet.com/privacy"
                class="text-indigo-600 dark:text-indigo-400 hover:underline"> {{
                  $t('pp') }}</a>.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 text-center">
      <p class="text-slate-500 dark:text-slate-400">
        {{ $t('dhac') }}<NuxtLink to="/register" class="text-indigo-600 dark:text-indigo-400 hover:underline">
          {{ $t('signup') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BellIcon } from 'lucide-vue-next'


const userStore = useUserStore()
const auth = useFirebaseAuth()

async function loginWithGoogle() {
  if (!auth) {
    console.error('Firebase shit the bed');
    return;
  }
  if (await userStore.loginWithGoogle(auth)) {
    navigateTo("/overview");
  }
}

onMounted(() => console.log(userStore.getUser))
</script>
