<template>
  <div
    v-if="loggedIn"
    ref="profileMenuRef"
    class="relative w-14"
  >
    <button
      aria-label="Profile Dropdown Button"
      class="flex items-center space-x-1 text-slate-300 hover:text-indigo-400 focus:outline-none"
      @click="isProfileMenuOpen = !isProfileMenuOpen"
    >
      <img
        v-if="userStore.user?.avatar != ''"
        :src="userStore.user?.avatar ?? ''"
        alt="Profile"
        class="w-8 h-8 rounded-full"
      >
      <div
        v-else
        class="bg-slate-700 w-10 h-10 rounded-full flex items-center justify-center"
      >
        <Icon
          name="tabler:user"
          class="size-6"
        />
      </div>
      <Icon :name="isProfileMenuOpen ? 'tabler:chevron-up' : 'tabler:chevron-down'" />
    </button>

    <transition name="fade">
      <div
        v-show="isProfileMenuOpen"
        class="absolute right-[-55px] md:right-0 mt-2 w-60 bg-slate-800 rounded-md shadow-lg py-1 border border-slate-700 z-50"
      >
        <div class="px-4 py-2 border-b border-slate-700">
          <p class="text-sm font-medium text-white">
            {{ userStore.user?.name }}
          </p>
          <p class="text-xs text-slate-400">
            {{ userStore.user?.email }}
          </p>
        </div>

        <UiLinkButton
          aria-label="Profile Account Navigation Button"
          class="m-1 mt-2"
          :white="true"
          :to="localePath('/account')"
        >
          <Icon
            name="tabler:user"
            class="w-4 h-4 mr-2"
          />
          {{ $t('account') }}
        </UiLinkButton>

        <UiLinkButton
          aria-label="Profile Subscriptions Navigation Button"
          class="m-1 mt-2"
          :white="true"
          :to="localePath('/subscriptions')"
        >
          <Icon
            name="tabler:calendar-week"
            class="w-4 h-4 mr-2"
          />
          {{ $t('subscriptions') }}
        </UiLinkButton>

        <AppHeaderCopyReferralCodeButton />

        <UiTextButton
          aria-label="Profile Logout Button"
          class="m-1 mt-2"
          :white="true"
          @on-click="logout"
        >
          <Icon
            name="tabler:logout-2"
            class="w-4 h-4 mr-2"
          />
          {{ $t('signOut') }}
        </UiTextButton>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

const userStore = useUserStore()
const isProfileMenuOpen = ref(false)
const profileMenuRef = ref<HTMLElement | null>(null)
const loggedIn = ref(false)

async function logout() {
  await userStore.logout()
  isProfileMenuOpen.value = true
  localStorage.clear()
  navigateTo(localePath('/login'))
}

onMounted(async () => {
  if (await getCurrentUser()) loggedIn.value = true

  document.addEventListener('click', (e) => {
    if (profileMenuRef.value && !profileMenuRef.value.contains(e.target as Node)) {
      isProfileMenuOpen.value = false
    }
  })
})
</script>
