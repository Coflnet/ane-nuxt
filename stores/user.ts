import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createUserWithEmailAndPassword, type EmailAuthCredential, EmailAuthProvider, GoogleAuthProvider, linkWithCredential, linkWithPopup, signInAnonymously, signInWithEmailAndPassword, signInWithPopup, type Auth, updateProfile, type UserCredential } from 'firebase/auth'
import { navigateTo } from '#app'
import { loginFirebase } from '~/src/api-client'
import type { ActiveSubscription } from '#hey-api'

// Types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface CachedAuctions {
  auctions: FilterMatch[]
  timeStamp: string
}

export interface NotificationSettings {
  discord: {
    enabled: boolean
    webhookUrl: string
    channelName: string
    format: 'detailed' | 'compact'
  }
  email: {
    enabled: boolean
    address: string
    frequency: 'instant' | 'hourly' | 'daily'
  }
  webPush: {
    enabled: boolean
    subscribed: boolean
    notifyNewMatches: boolean
    notifyPriceChanges: boolean
    notifyEndingSoon: boolean
  }
}

// Define the store using the setup style
export const useUserStore = defineStore('user', () => {
  // State
  //
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isAnonymous = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const token = ref<string | null>(null)
  const cachedAuctions = ref<CachedAuctions | null>(null)
  const cachedFilters = ref<{ [id: number]: string }>()
  const currentPlan = ref<ActiveSubscription | null>()

  const notificationSettings = ref<NotificationSettings>({
    discord: {
      enabled: false,
      webhookUrl: '',
      channelName: '',
      format: 'detailed',
    },
    email: {
      enabled: true,
      address: '',
      frequency: 'instant',
    },
    webPush: {
      enabled: false,
      subscribed: false,
      notifyNewMatches: true,
      notifyPriceChanges: true,
      notifyEndingSoon: true,
    },
  })

  const isLoadingSettings = ref(false)

  const isLoggedIn = computed(() => isAuthenticated.value && !isAnonymous.value)
  const getUser = computed(() => user.value)
  const getNotificationSettings = computed(() => notificationSettings.value)
  const isUserAnonymous = computed(() => isAnonymous.value)

  const localePath = useLocalePath()

  async function loginWithGoogle(clientAuth: Auth, login: boolean): Promise<{ success: boolean, error?: string | null }> {
    isLoading.value = true
    error.value = null

    if (isAnonymous.value && !login) {
      const upgrade = await upgradeUserAccount(clientAuth, new GoogleAuthProvider())
      if (upgrade) {
        isAnonymous.value = false
        return { success: true }
      }
      return { success: false, error: useI18n().t('thatEmnailInUse') }
    }

    try {
      const provider = new GoogleAuthProvider()

      const result = await signInWithPopup(clientAuth, provider)
      const loggedInUser = result.user

      if (loggedInUser) {
        user.value = {
          id: loggedInUser.uid,
          name: loggedInUser.displayName ?? '',
          email: loggedInUser.email ?? '',
          avatar: loggedInUser.photoURL ?? '',
        }
        isAuthenticated.value = true
      }

      const credential = GoogleAuthProvider.credentialFromResult(result)

      const response = await loginFirebase({
        composable: '$fetch',
        body: { authToken: credential?.accessToken },
      })

      token.value = response.authToken ?? ''

      isAuthenticated.value = true

      return { success: true }
    }
    catch (err) {
      return { success: false, error: 'Failed to login. Please try again.' }
    }
  }

  async function upgradeUserAccount(clientAuth: Auth, loginData: GoogleAuthProvider | EmailAuthCredential): Promise<boolean> {
    try {
      let result: UserCredential
      if (loginData instanceof GoogleAuthProvider) {
        result = await linkWithPopup(clientAuth.currentUser!, loginData)
      }
      else {
        result = await linkWithCredential(clientAuth.currentUser!, loginData)
      }
      const loggedInUser = result.user
      const providerData = loggedInUser.providerData[0]
      if (providerData) {
        await updateProfile(loggedInUser, {
          displayName: providerData.displayName,
          photoURL: providerData.photoURL,
        })
      }
      await loggedInUser.reload()

      user.value = {
        id: loggedInUser.uid,
        name: loggedInUser.displayName ?? '',
        email: loggedInUser.email ?? '',
        avatar: loggedInUser.photoURL ?? '',
      }
      isAuthenticated.value = true
      isAnonymous.value = false
      return true
    }
    catch (error) {
      console.error('Error upgrading user account:', error)
      return false
    }
  }

  async function signInWithEmailPassword(clientAuth: Auth, email: string, password: string, isLogin: boolean) {
    isLoading.value = true
    error.value = null

    try {
      if (isAnonymous && !isLogin) {
        const credential = EmailAuthProvider.credential(email, password)
        upgradeUserAccount(clientAuth, credential)
        isAnonymous.value = false
        return { success: true }
      }
      const result = isLogin ? await createUserWithEmailAndPassword(clientAuth, email, password) : await signInWithEmailAndPassword(clientAuth, email, password)
      const loggedInUser = result.user

      if (loggedInUser) {
        user.value = {
          id: loggedInUser.uid,
          name: loggedInUser.displayName ?? '',
          email: loggedInUser.email ?? '',
          avatar: loggedInUser.photoURL ?? '',
        }
        isAuthenticated.value = true
      }
      return { success: true }
    }
    catch (err) {
      error.value = `${err}`
      return { success: false, error: error.value }
    }
  }

  function saveAuctionCache(actions: FilterMatch[]) {
    cachedAuctions.value = { auctions: actions, timeStamp: new Date().toISOString() }
  }

  function loadAuctionCache(): [boolean, FilterMatch[]] {
    if (Date.now() - Date.parse(cachedAuctions.value?.timeStamp ?? '') > 60 * 1000) {
      return [true, cachedAuctions.value?.auctions ?? []]
    }
    return [false, cachedAuctions.value?.auctions ?? []]
  }

  function saveFilterCache(actions: { [id: number]: string }) {
    cachedFilters.value = actions
  }

  function loadFilterCache(): { [id: number]: string } {
    return cachedFilters.value ?? {}
  }

  async function logout() {
    // In a real implementation, this would call the API
    // await useFetch('/api/auth/logout', { method: 'POST' })

    user.value = null
    isAuthenticated.value = false
    token.value = null

    navigateTo(localePath('/login'))
  }

  async function checkAuth(clientAuth: Auth) {
    if (isAuthenticated.value)
      return

    try {
      const signInResult = await signInAnonymously(clientAuth)
      const accessToken = await signInResult.user.getIdTokenResult()

      const response = await loginFirebase({
        composable: '$fetch',
        body: { authToken: accessToken.token },
      })
      token.value = response.authToken ?? ''

      isAuthenticated.value = true
      isAnonymous.value = true
    }
    catch (error) {
      console.error('Error checking authentication:', error)
    }
  }

  // Return all state, getters, and actions
  return {
    // State
    user,
    isAuthenticated,
    isAnonymous,
    isLoading,
    error,
    token,
    isLoadingSettings,
    cachedFilters,
    notificationSettings,
    cachedAuctions,
    currentPlan,

    // Getters
    isLoggedIn,
    getUser,
    getNotificationSettings,
    isUserAnonymous,

    // Actions
    loginWithGoogle,
    logout,
    checkAuth,
    saveAuctionCache,
    loadAuctionCache,
    saveFilterCache,
    loadFilterCache,
    signInWithEmailPassword,
  }
}, {
  persist: true,
})
