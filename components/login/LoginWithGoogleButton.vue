<template>
  <button
    class="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
    @click="loginWithGoogle"
  >
    <img
      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
      alt="Google logo"
      class="w-5 h-5"
    >
    <span class="text-white font-medium">{{ $t('continueWithGoogle') }}</span>
  </button>
</template>

<script setup lang="ts">
const userStore = useUserStore()
const auth = useFirebaseAuth()
const localePath = useLocalePath()
const router = useRouter()
const redirectTo = router.currentRoute.value.query.redirectTo as string | undefined

const props = defineProps({ login: Boolean })
const { t } = useI18n()

async function loginWithGoogle() {
  if (!auth) {
    return
  }
  const googleSignInRequest = await userStore.loginWithGoogle(auth, props.login)
  if (googleSignInRequest.success) {
    userStore.isAuthenticated = true
    userStore.isAnonymous = false

    if (userStore.acceptingReferralCode != '') {
      const useRefferalResult = await userStore.useRefferalCode()
      if (useRefferalResult) {
        push.success(t('successfullReffer'))
        userStore.userReferralCode = ''
      }
      else {
        push.error(t('errorReffering'))
      }
    }

    navigateTo(localePath(redirectTo ?? googleSignInRequest.newUser ? '/filters/create' : '/overview'))
    return
  }
  push.error(t(googleSignInRequest.error ?? 'Something is very wrong'))
}
</script>
