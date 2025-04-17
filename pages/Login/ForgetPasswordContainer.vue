<template>
  <main class="flex-1 flex flex-col items-center justify-center px-4 py-8 mb-8 ">
    <UiDefaultContainer class="p-6 max-w-md py-4 w-full px-12">
      <ForgotPasswordContainerHeader />
      <ForgotPasswordEmail v-model="email" />
      <button @click="resetPassword()" class="my-4 w-full bg-indigo-600 rounded-lg py-2 text-white font-medium">
        Send Email
      </button>
    </UiDefaultContainer>
  </main>
</template>
<script setup lang="ts">
import { sendPasswordResetEmail } from 'firebase/auth';
import ForgotPasswordContainerHeader from './ForgotPasswordContainerHeader.vue';
import ForgotPasswordEmail from './ForgotPasswordEmail.vue';

const email = ref("");

const auth = useFirebaseAuth()

async function resetPassword() {
  if (!email) {
    push.error("Please enter your email address");
    return;
  }
  sendPasswordResetEmail(auth!, email.value)
    .then(() => {
      push.success("Password reset email sent");
      navigateTo("/login");
      return true;
    })
    .catch((error) => {
      push.error(`Error sending password reset email: ${error.message}`);
      return false;
    });

}


</script>
