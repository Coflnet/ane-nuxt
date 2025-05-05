<template>
  <UiInput type="email" :placeholder="$t('email')" v-model="email" :radiusError="emailPassError" />
  <UiInput type="password" :placeholder="$t('password')" v-model="password" class="mt-3"
    :radiusError="emailPassError" />
  <div class="flex justify-end mt-1.5 mb-3">
    <a href="/forgot-password" class="text-blue-600 text-sm">{{ $t('forgotPassword') }}</a>
  </div>
  <UiButton @click="login" class="w-full text-center" :primary="true">
    {{ isLogin ? $t("signIn") : $t('register') }}
  </UiButton>
</template>

<script setup lang="ts">
const email = ref('');
const password = ref('');

const props = defineProps({ isLogin: Boolean })

const auth = useFirebaseAuth()
const userStore = useUserStore();
const emailPassError = ref(false)
const localePath = useLocalePath()
const router = useRouter()
const redirectTo = router.currentRoute.value.query.redirectTo as string | undefined

async function login() {
  if (!email.value || !password.value) {
    push.error('Please fill in all fields');
    emailPassError.value = true;
    return;
  }

  emailPassError.value = false;
  const result = await userStore.signInWithEmailPassword(auth!, email.value, password.value, props.isLogin);
  if (!result.success) {
    push.error(`There was an error creating your account \n If you have not made a account yet try making one`);
    return;
  }

  navigateTo(localePath(redirectTo ?? '/overview'))
}

</script>
