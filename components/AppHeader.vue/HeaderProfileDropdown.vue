<template>
  <div class="relative" ref="profileMenuRef" v-if="loggedIn">

    <button @click="toggleProfileMenu"
      class="flex items-center space-x-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
      <img :src="userStore.user?.avatar ?? ''" alt="Profile" class="w-8 h-8 rounded-full" />
      <Icon name="tabler:chevron-down" v-if="!isProfileMenuOpen"/>
      <Icon v-else name="tabler:chevron-up" />
    </button>

    <div v-if="isProfileMenuOpen"
      class="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-10 border border-slate-200 dark:border-slate-700">
      <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
        <p class="text-sm font-medium text-slate-900 dark:text-white">{{ userStore.user?.name }}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ userStore.user?.email }}</p>
      </div>

      <UiTextButton @onClick="logout" class="m-1 mt-2">
        <Icon name="tabler:logout-2" class="w-4 h-4 mr-2" />
        {{$t('signOut')}}
      </UiTextButton>
 
    </div>
  </div>

</template>

<script setup lang="ts">
const userStore = useUserStore()
const isProfileMenuOpen = ref(false)
const profileMenuRef = ref<HTMLElement | null>(null);

const loggedIn = ref(false)

function toggleProfileMenu() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value
}

// why the fuck is this being done like this
function handleClickOutside(event: MouseEvent) {
  if (profileMenuRef.value && !profileMenuRef.value.contains(event.target as Node)) {
    isProfileMenuOpen.value = false;
  }
}

async function logout() {
  await userStore.logout()
  isProfileMenuOpen.value = false
  navigateTo("/register")
}

async function login() {
  if (!await getCurrentUser()) {
    return
  }
  loggedIn.value = true
}

onMounted(() => {
  login()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
}) 
</script>
