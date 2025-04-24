<template>
  <button @click="loginWithGoogle"
    class="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors">
    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" class="w-5 h-5" />
    <span class="text-white font-medium">{{ $t('continueWithGoogle') }}</span>
  </button>
</template>

<script setup lang="ts">
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
</script>
