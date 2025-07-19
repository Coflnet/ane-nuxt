<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-8">
      <h1>
        <UiHeaderLabel
          :label="$t('accountSettings')"
          :xl="true"
        />
      </h1>
      <UiFooterLabel :label="$t('accountSettingsSubtitle')" />
    </div>

    <UiDefaultContainer class="p-4">
      <h2 class="text-xl font-semibold text-white mb-4">
        <UiHeaderLabel
          :label="$t('accountInformation')"
        />
      </h2>

      <div class="mb-6">
        <UiFooterLabel :label="$t('email')" />
        <UiDefaultInputBox class="p-2 text-slate-200">
          {{ userEmail }}
        </UiDefaultInputBox>
      </div>

      <!-- Account ID -->
      <div class="mb-6">
        <UiFooterLabel :label="$t('accountID')" />
        <div class="flex items-center gap-3">
          <UiDefaultInputBox class="p-3 text-slate-200 w-full line-clamp-1">
            {{ accountId }}
          </UiDefaultInputBox>
          <UiButton
            :primary="true"
            @click="copyAccountId"
          >
            {{ copied ? $t('copied') : $t('copy') }}
          </UiButton>
        </div>
      </div>

      <div class="mb-6">
        <UiFooterLabel :label="$t('referralCode')" />
        <div class="flex items-center gap-3">
          <UiDefaultInputBox class="p-3 text-slate-200 w-full line-clamp-1">
            {{ referralCode }}
          </UiDefaultInputBox>
          <UiButton
            :primary="true"
            @click="copyReferralCode"
          >
            {{ copied ? $t('copied') : $t('copy') }}
          </UiButton>
        </div>
      </div>
    </UiDefaultContainer>

    <!-- Preferences Card -->
    <UiDefaultContainer class="p-6 mt-6">
      <UiHeaderLabel
        :label="$t('preferences')"
      />

      <!-- Language Selection -->
      <div class="mb-6">
        <UiFooterLabel
          :label="$t('switchLanguage')"
          class="mb-2"
        />
        <UiButton
          v-for="locale in availableLocales"
          :key="locale.code"
          aria-label="Profile Switch Locale Button"
          @on-click="navigateTo(switchLocalePath(locale.code))"
        >
          <Icon
            name="tabler:language"
            class="w-4 h-4 mr-2"
          />
          {{ locale.name }}
        </UiButton>
      </div>
    </UiDefaultContainer>

    <!-- Actions Card -->
    <UiDefaultContainer class="p-6 mt-6">
      <UiHeaderLabel
        :label="$t('accountActions')"
      />

      <div class="space-y-4 mt-4">
        <UiLinkButton
          :primary="true"
          class="w-full h-12 flex items-center justify-center"
          :href="localePath('/subscriptions')"
        >
          <CreditCard class="w-5 h-5 mr-2" />
          {{ $t('manageSubscription') }}
        </UiLinkButton>

        <UiButton
          :warning="true"
          class="w-full h-12"
          @on-click="signOut()"
        >
          <LogOut class="w-5 h-5 mr-2" />
          {{ $t('signOut') }}
        </UiButton>
      </div>
    </UiDefaultContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CreditCard, LogOut } from 'lucide-vue-next'

const { locale, locales, t } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()

const availableLocales = computed(() => {
  return locales.value.filter(i => i.code !== locale.value)
})

const userStore = useUserStore()
const userEmail = ref(userStore.getUser?.email)
const accountId = ref(userStore.accountId)
const copied = ref(false)
const referralCode = ref(userStore.userReferralCode)

// Methods
async function copyAccountId() {
  await navigator.clipboard.writeText(accountId.value)
}

async function copyReferralCode() {
  const referralCode = userStore.userReferralCode

  if (referralCode) {
    const path = localePath(`/overview?ref=${referralCode}`)
    const inviteLink = `https://ane.deals${path}`
    navigator.clipboard.writeText(inviteLink)
    push.success(t('copyReferralCodeSuccess'))
    return
  }
  push.error(t('errorCopyingReferralCode'))
}

async function signOut() {
  await userStore.logout()
  localStorage.clear()
  navigateTo(localePath('/login'))
}

onMounted(async () => {
  if (userStore.isLoggedIn && userStore.accountId === '') {
    const userData = await userStore.getUserData()
    userEmail.value = userData.email
    accountId.value = userData.id
  }

  if (userStore.userReferralCode != '')
    return

  const newReferralCode = await userStore.generateReferralCode()
  userStore.userReferralCode = newReferralCode

  referralCode.value = newReferralCode
})

// Set page meta
useHead({
  title: 'Account Settings',
  meta: [
    { name: 'description', content: 'Manage your account settings and preferences' },
  ],
})
</script>
