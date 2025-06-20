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

onMounted(async () => {
  // user already generated a referral code
  if (userStore.userReferralCode != '')
    return

  const referralCode = await userStore.generateReferralCode()

  userStore.userReferralCode = referralCode
})
</script>
