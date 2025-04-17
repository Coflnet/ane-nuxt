<template>
  <AneTextField type="email" placeholder="Email" v-model="email" :radiusError="emailPassError" />
  <AneTextField type="password" placeholder="Password" v-model="password" class="mt-3" :radiusError="emailPassError" />
  <ForgotPassword />
  <button @click="login" class="mt-4 w-full bg-indigo-600 rounded-lg py-2 text-white font-medium">
    {{ isLogin ? 'Sign in' : 'Register' }}
  </button>
</template>

<script setup lang="ts">
import { AneTextField } from '#components';
import ForgotPassword from './ForgotPassword.vue';
const email = ref('');
const password = ref('');

const props = defineProps({ isLogin: Boolean })

const auth = useFirebaseAuth()
const userStore = useUserStore();

const emailPassError = ref(false)

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
  return;
  navigateTo('/overview');
}

</script>
