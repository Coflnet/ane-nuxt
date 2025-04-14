<template>
  <div class="min-h-screen flex flex-col ">
    <header class="w-full py-4 px-6 bg-white dark:bg-slate-800 shadow-sm">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center space-x-2">
          <div
            class="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold ">
            A
          </div>
          <span class="text-xl font-bold text-slate-900 dark:text-white">ANE</span>
        </NuxtLink>

        <nav
          class="hidden md:flex items-center space-x-6 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <NuxtLink to="/" class="">
            {{ $t('features') }}
          </NuxtLink>
          <NuxtLink to="/">
            {{ $t('pricing') }}
          </NuxtLink>
          <NuxtLink to="/">
            {{ $t('support') }}
          </NuxtLink>
        </nav>

        <div class="flex items-center space-x-4">
          <NuxtLink to="/login"
            class="text-slate-700 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
            {{ $t('signinNormal') || 'Sign In' }}
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="flex-1 flex items-center justify-center px-4 py-12 mb-12">
      <div class="w-full max-w-md">
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden py-4">
          <div class="p-8">
            <div class="text-center mb-8">
              <div
                class="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto">
                <BellIcon class="w-8 h-8 text-white" />
              </div>
              <h1 class="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                {{ $t('createAcco') || 'Create Account' }}
              </h1>
              <p class="mt-2 text-slate-500 dark:text-slate-400">{{ $t('registerHead') || 'Register to get started' }}
              </p>
            </div>

            <div class="space-y-4">
              <button @click="loginWithGoogle"
                class="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo"
                  class="w-5 h-5" />
                <span class="text-slate-700 dark:text-white font-medium">{{ $t('signupGoog') || 'Sign up with Google'
                  }}</span>
              </button>

              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {{ $t('moreOpt') || 'More options' }}
                  </span>
                </div>
              </div>

              <div class="text-center text-sm text-slate-500 dark:text-slate-400 pt-2">
                <p>{{ $t('sellSoul') || 'By signing up, you agree to our' }}
                  <a href="https://coflnet.com/terms-of-service"
                    class="text-indigo-600 dark:text-indigo-400 hover:underline">
                    {{ $t('tos') || 'Terms of Service' }}
                  </a>
                  {{ $t('and') || 'and' }}
                  <a href="https://coflnet.com/privacy" class="text-indigo-600 dark:text-indigo-400 hover:underline">
                    {{ $t('pp') || 'Privacy Policy' }}
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 text-center">
          <p class="text-slate-500 dark:text-slate-400">
            {{ $t('already') || 'Already have an account?' }}
            <NuxtLink to="/login" class="text-indigo-600 dark:text-indigo-400 hover:underline">
              {{ $t('signinNormal') || 'Sign in' }}
            </NuxtLink>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import { BellIcon } from 'lucide-vue-next'
const userStore = useUserStore()
const auth = useFirebaseAuth()!

async function loginWithGoogle() {
  if (!auth) {
    console.log(auth)
    console.error('Firebase shit the bed');
    return;
  }
  if (await userStore.loginWithGoogle(auth)) {
    navigateTo("/overview");
  }
}

async function checkLogin() {
  const userStore = useUserStore();
  await userStore.loadUser();
  if (userStore.isAuthenticated)
    navigateTo("/overview")
}

definePageMeta({
  layout: 'landing'
})

onMounted(() => { checkLogin() })

</script>
