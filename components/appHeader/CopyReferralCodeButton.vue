<template>
  <UiTextButton
    aria-label="Profile Copy Refferal Code Button"
    class="m-1 mt-2"
    @on-click="copyReferralCode"
  >
    <Icon
      name="tabler:clipboard-copy"
      class="w-4 h-4 mr-2"
    />
    {{ $t('copyReferralCode') }}
  </UiTextButton>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const userStore = useUserStore()

/** Cached invite link id; created only for signed-in (non-anonymous) users. */
async function loadReferralCode(): Promise<string> {
  if (userStore.userReferralCode || !userStore.isLoggedIn)
    return userStore.userReferralCode
  try {
    userStore.userReferralCode = await userStore.generateReferralCode()
  }
  catch (error) {
    console.warn('Could not load the referral link', error)
  }
  return userStore.userReferralCode
}

async function copyReferralCode() {
  if (!userStore.isLoggedIn) {
    // anonymous visitors need an account before they can invite others
    navigateTo(localePath('/login'))
    return
  }

  const referralCode = await loadReferralCode()

  if (referralCode) {
    const path = localePath(`/overview?ref=${referralCode}`)
    const inviteLink = `${useRequestURL().origin}${path}`
    navigator.clipboard.writeText(inviteLink)
    push.success(t('copyReferralCodeSuccess'))
    return
  }
  push.error(t('errorCopyingReferralCode'))
}

onMounted(() => {
  // prefetch so the clipboard write happens right in the click handler; no request for anonymous visitors
  watch(() => userStore.isLoggedIn, (loggedIn) => {
    if (loggedIn)
      loadReferralCode()
  }, { immediate: true })
})
</script>
