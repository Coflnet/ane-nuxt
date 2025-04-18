<template>
  <div class="min-h-screen flex flex-col ">
    <main class="flex-1 flex flex-col items-center justify-center px-4 py-8 mb-8 ">
      <UiDefaultContainer class="p-6 max-w-md py-4 w-full px-12">
        <div class="text-center my-8">
          <HeaderLabel :label="$t('forgotPassword')" class="mb-2" />
        </div>

        <UiInput type="email" :placeholder="$t('email')" v-model="email" />
        <button @click="resetPassword()" class="my-4 w-full bg-indigo-600 rounded-lg py-2 text-white font-medium">
          {{ $t('sendEmail') }}
        </button>
      </UiDefaultContainer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { sendPasswordResetEmail } from 'firebase/auth';


definePageMeta({
  layout: 'landing'
})

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
