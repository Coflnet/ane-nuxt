<template>
  <div class="min-h-screen flex flex-col ">
    <main class="flex-1 flex flex-col items-center justify-center px-4 py-8 mb-8 ">
      <UiDefaultContainer class="p-6 max-w-md py-4 w-full px-12">
        <div class="text-center my-8">
          <UiHeaderLabel
            :label="$t('forgotPassword')"
            class="mb-2"
          />
        </div>

        <UiInput
          v-model="email"
          type="email"
          :placeholder="$t('email')"
        />
        <button
          class="my-4 w-full bg-indigo-600 rounded-lg py-2 text-white font-medium"
          @click="resetPassword()"
        >
          {{ $t('sendEmail') }}
        </button>
      </UiDefaultContainer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { sendPasswordResetEmail } from 'firebase/auth'

const localePath = useLocalePath()
const { t } = useI18n()

definePageMeta({
  layout: 'landing',
})

const email = ref('')

const auth = useFirebaseAuth()

async function resetPassword() {
  if (!email.value) {
    push.error(t('enterEmailAdress'))
    return
  }
  sendPasswordResetEmail(auth!, email.value)
    .then(() => {
      push.success(t('passwordResetSent'))
      navigateTo(localePath('/login'))
      return true
    })
    .catch((error) => {
      push.error(`${t('passwordResetError')} ${error.message}`)
      return false
    })
}
</script>
