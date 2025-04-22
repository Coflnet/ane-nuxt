<template>
  <FiltersNotificationSettingItem v-model="emailAddress" :filter="filter" :config="{
    notificationType: 'Email',
    predefinedValue: userStore.notificationSettings.email.address,
    name: $t('email'),
    placeholder: $t('enterEmailAddress'),
    icon: 'tabler:mail',
    textInput: true
  }" :messages="{
    error: $t('invalidEmail'),
    footer: $t('sendDiscordNotifications')
  }" :validation="{
    error: !isValidEmail && !!emailAddress
  }" />

</template>

<script setup lang='ts'>
import { ref, watch } from 'vue'
import type { Filter } from '~/types/FilterType';

const userStore = useUserStore()


const props = defineProps<{ filter: Filter }>()

const emailAddress = ref(props.filter.notificationTarget || '')
const isValidEmail = ref(true)

const validateEmail = () => {
  if (!emailAddress.value) {
    isValidEmail.value = true
    return
  }
  // validate the email format
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  isValidEmail.value = emailPattern.test(emailAddress.value)

  if (isValidEmail.value)
    props.filter.notificationTarget = emailAddress.value
}

watch(emailAddress, (newValue) => {
  if (newValue) {
    validateEmail()
  } else {
    isValidEmail.value = true
    props.filter.notificationTarget = ''
  }
})

</script>
