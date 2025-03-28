<template>
<header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
  <div class="container mx-auto px-4 py-4">
    <div class="flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center space-x-2">
        <div class="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
          A
        </div>
        <span class="text-xl font-bold text-slate-900 dark:text-white">ANE</span>
      </NuxtLink>
      
      <div class="flex items-center space-x-4">

          <!-- use userStore.isLoggedIn when user auth is setup -->
        <template v-if="true">
          <NuxtLink to="/" class="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">Home</NuxtLink>
          <NuxtLink to="/filters" class="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">Filters</NuxtLink>
          <NuxtLink to="/auctions" class="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">Auctions</NuxtLink>
          <NuxtLink to="/notifications" class="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">Notifications</NuxtLink>
          
          <div class="relative" ref="profileMenuRef">
            <button 
              @click="toggleProfileMenu"
              class="flex items-center space-x-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <img 
                :src="userStore.user?.avatar || '/placeholder.svg?height=32&width=32'" 
                alt="Profile" 
                class="w-8 h-8 rounded-full"
              />
              <ChevronDownIcon v-if="!isProfileMenuOpen" class="w-4 h-4" />
              <ChevronUpIcon v-else class="w-4 h-4" />
            </button>
            
            <div 
              v-if="isProfileMenuOpen"
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-10 border border-slate-200 dark:border-slate-700"
            >
              <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                <p class="text-sm font-medium text-slate-900 dark:text-white">{{ userStore.user?.name }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ userStore.user?.email }}</p>
              </div>
              <NuxtLink to="/settings" class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Settings</NuxtLink>
              <NuxtLink to="/notifications" class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Notification Settings</NuxtLink>
              <button 
                @click="logout"
                class="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </template>
        
          <!-- use v-else when user auth is setup -->
        <template v-if="true">
          <NuxtLink to="/login" class="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">Log in</NuxtLink>
          <NuxtLink to="/register" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Sign up</NuxtLink>
        </template>
      </div>
    </div>
  </div>
</header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-vue-next'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const isProfileMenuOpen = ref(false)
const profileMenuRef = ref(null)

function toggleProfileMenu() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value
}

function handleClickOutside(event) {
  if (profileMenuRef.value && !profileMenuRef.value.contains(event.target)) {
    isProfileMenuOpen.value = false
  }
}

async function logout() {
  await userStore.logout()
  isProfileMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>


