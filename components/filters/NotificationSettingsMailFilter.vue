<template>
  <FiltersNotificationSettingItem
    v-model="emailAddress"
    label-aria="Email Address"
    :filter="model!"
    :config="{
      notificationType: 'Email',
      predefinedValue: userStore.notificationSettings.email.address,
      name: $t('email'),
      placeholder: $t('enterEmailAddress'),
      icon: 'tabler:mail',
      textInput: true,
    }"
    :messages="{
      error: $t('invalidEmail'),
      footer: $t('sendNotificationsToEmail'),
    }"
    :validation="{
      error: !isValidEmail && !!emailAddress,
    }"
  />
</template>

<script setup lang='ts'>
import { ref, watch } from 'vue'
import type { Filter } from '~/types/FilterType'

const userStore = useUserStore()

const model = defineModel<Filter>()

const emailAddress = ref(model.value!.notificationTarget || '')
const isValidEmail = ref(true)

watch(() => model.value!.notificationTarget,
  () => {
    emailAddress.value = model.value?.notificationTarget ?? ''
  })

const validateEmail = () => {
  if (!emailAddress.value) {
    isValidEmail.value = true
    return
  }
  // validate the email format
  const emailPattern = /^[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i
  isValidEmail.value = emailPattern.test(emailAddress.value)

  if (isValidEmail.value) {
    model.value!.notificationTarget = emailAddress.value
    // store email address for predefined values
    userStore.notificationSettings.email.address = emailAddress.value
  }
}

watch(emailAddress, (newValue) => {
  if (newValue) {
    validateEmail()
  }
  else {
    isValidEmail.value = true
    model.value!.notificationTarget = ''
  }
})
</script>
