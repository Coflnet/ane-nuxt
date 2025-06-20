<template>
  <UiInput
    v-model="email"
    type="email"
    name="email"
    :placeholder="$t('email')"
    :radius-error="emailPassError"
  />
  <UiInput
    v-model="password"
    type="password"
    name="password"
    :placeholder="$t('password')"
    class="mt-3"
    :radius-error="emailPassError"
  />
  <div class="flex justify-end mt-1.5 mb-3">
    <a
      :href="localePath('/forgot-password')"
      class="text-blue-600 text-sm"
    >{{ $t('forgotPassword') }}</a>
  </div>
  <UiButton
    class="w-full text-center"
    :primary="true"
    @click="login"
  >
    {{ isLogin ? $t("signIn") : $t('register') }}
  </UiButton>
</template>

<script setup lang="ts">
const email = ref('')
const password = ref('')

const props = defineProps({ isLogin: Boolean })

const auth = useFirebaseAuth()

const userStore = useUserStore()

const emailPassError = ref(false)
const localePath = useLocalePath()
const router = useRouter()
const redirectTo = router.currentRoute.value.query.redirectTo as string | undefined

const { t } = useI18n()

async function login() {
  if (!email.value || !password.value) {
    push.error('Please fill in all fields')
    emailPassError.value = true
    return
  }

  emailPassError.value = false
  const result = await userStore.signInWithEmailPassword(auth!, email.value, password.value, props.isLogin)
  if (!result.success) {
    push.error(`There was an error creating your account \n If you have not made a account yet try making one`)
    return
  }
  userStore.isAuthenticated = true
  userStore.isAnonymous = false
  if (userStore.acceptingReferralCode != null) {
    const useRefferalResult = await userStore.useRefferalCode()
    if (useRefferalResult) {
      push.success(t('successfullReffer'))
      userStore.userReferralCode = ''
    }
    else {
      push.error(t('errorReffering'))
    }
  }

  navigateTo(localePath(redirectTo ?? props.isLogin ? '/overview' : '/filters/create'))
}
</script>
