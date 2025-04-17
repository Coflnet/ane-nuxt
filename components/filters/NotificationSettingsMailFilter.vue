<template>
  <div
    class="flex items-start p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
    <div class="flex items-center h-5">
      <input id="email-notification" v-model="filter.notificationType" type="radio" value="Email"
        @click="filter.notificationTarget = userStore.notificationSettings.email.address"
        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
    </div>
    <label for="email-notification" class="ml-3 flex flex-col">
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
          <MailIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p class="font-medium text-slate-900 dark:text-white">{{ $t('email') }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ $t('emailTe') }} </p>
        </div>
      </div>
      <div v-if="filter.notificationType === 'Email'" class="mt-3 ml-11">
        <AneTextField type="string" :placeholder="$t('enterEma')" v-model="emailAddress"
          :radiusError="!isValidEmail && emailAddress" />
        <p v-if="!isValidEmail && emailAddress" class="mt-1 text-sm text-red-500">
          {{ $t('invalidEmail') || 'Please enter a valid email address' }}
        </p>
      </div>
    </label>
  </div>
</template>

<script setup lang='ts'>
import { ref, watch } from 'vue'
import { MailIcon } from 'lucide-vue-next'

const userStore = useUserStore()

const props = defineProps({
  filter: {
    type: Object,
    required: true
  }
})

const emailAddress = ref(props.filter.notificationTarget || '')
const isValidEmail = ref(true)

const validateEmail = () => {
  if (!emailAddress.value) {
    isValidEmail.value = true
    return
  }
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  isValidEmail.value = emailPattern.test(emailAddress.value)

  if (isValidEmail.value) {
    props.filter.notificationTarget = emailAddress.value
  }
}

watch(emailAddress, (newValue) => {
  if (newValue) {
    validateEmail()
  } else {
    isValidEmail.value = true
    props.filter.notificationTarget = ''
  }
})

watch(() => props.filter.notificationTarget, (newValue) => {
  if (newValue !== emailAddress.value) {
    emailAddress.value = newValue || ''
    validateEmail()
  }
}, { immediate: true })
</script>
