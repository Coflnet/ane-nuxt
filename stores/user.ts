import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createUserWithEmailAndPassword, type EmailAuthCredential, EmailAuthProvider, GoogleAuthProvider, linkWithCredential, linkWithPopup, signInAnonymously, signInWithEmailAndPassword, signInWithPopup, type Auth, updateProfile, type UserCredential, getAdditionalUserInfo } from 'firebase/auth'
import { navigateTo } from '#app'
import { getStats, loginFirebase, useLink } from '~/src/api-client'
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
  const subscriptionStartDate = ref('')
  const noPremium = ref<boolean | null>(null)
  const remainingFilters = ref<number>(3)
  const acceptingReferralCode = ref<string>('')
  const userReferralCode = ref<string>('')
  const accountId = ref('')
  const remainingPremiumSearches = ref<number>(100)

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

  const createdAccount = computed(() => isAnonymous.value || isAuthenticated.value)

  const localePath = useLocalePath()

  async function generateReferralCode(): Promise<string> {
    const apiToken = `Bearer ${token.value}`
    const refCode = await createLink({
      composable: '$fetch',
      query: { name: 'i', text: 'i' },
      headers: { Authorization: apiToken },
    })

    return refCode.id ?? ''
  }

  async function useRefferalCode(): Promise<boolean> {
    console.log(acceptingReferralCode.value)

    const apiToken = `Bearer ${token.value}`
    try {
      await useLink({
        composable: '$fetch',
        query: { inviter: acceptingReferralCode.value },
        headers: { Authorization: apiToken },
      })
      return true
    }
    catch (error) {
      console.error(error)
      return false
    }
  }

  async function loginWithGoogle(clientAuth: Auth, login: boolean): Promise<{ success: boolean, error?: string | null, newUser?: boolean }> {
    isLoading.value = true
    error.value = null

    if (isAnonymous.value && !login) {
      const upgrade = await upgradeUserAccount(clientAuth, new GoogleAuthProvider())
      if (upgrade) {
        isAuthenticated.value = true
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

      return { success: true, newUser: getAdditionalUserInfo(result)?.isNewUser }
    }
    catch (err) {
      console.error('Error during Google login:', err)
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
        const upgradeResult = await upgradeUserAccount(clientAuth, credential)

        if (upgradeResult == false) {
          return { success: false }
        }

        isAnonymous.value = false
        return { success: true }
      }
      const result = isLogin ? await signInWithEmailAndPassword(clientAuth, email, password) : await createUserWithEmailAndPassword(clientAuth, email, password)
      const loggedInUser = result.user

      const response = await loginFirebase({
        composable: '$fetch',
        body: { authToken: await result.user.getIdToken() },
      })

      if (response.authToken === null) {
        console.error('Invalid auth token received from server')
        return
      }

      token.value = response.authToken ?? ''

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

  async function loadRemainingSearches(): Promise<{ used: number, total: number, refreshData: number }> {
    const apiToken = `Bearer ${token.value}`
    try {
      const response = await getStats({
        composable: '$fetch',
        headers: { Authorization: apiToken },
      })

      if (subscriptionStartDate.value == '' && noPremium.value == null)
        await getSubscriptionEndDate()

      remainingFilters.value = (response.listenerLimit ?? 3) - (response.listenerCount ?? 0)

      remainingPremiumSearches.value = response.activeSearchesLeft ?? 100

      return {
        used: response.searchesUsedMonthly ?? 0,
        total: response.activeSearchesLeft ?? 0,
        refreshData: getTimeTillSubscriptionRenewal(subscriptionStartDate.value),
      }
    }
    catch (error) {
      console.error(error)
      push.error(useI18n().t('loadRemainingError'))
    }
    return { used: 0, total: 0, refreshData: 0 }
  }

  async function getSubscriptionEndDate() {
    const apiToken = `Bearer ${token.value}`
    const result = await getSubscription({ composable: '$fetch', headers: { Authorization: apiToken } })
    if (result.length == 0) {
      noPremium.value = true
      return
    }

    subscriptionStartDate.value = result[0]?.createdAt ?? ''
  }

  function getTimeTillSubscriptionRenewal(startDateString: string) {
    if (subscriptionStartDate.value == '') return 0
    const startDate = new Date(startDateString)
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) // Add 30 days
    const today = new Date()

    const timeLeft = endDate.getTime() - today.getTime()
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24))

    return daysLeft > 0 ? daysLeft : 0
  }

  async function getUserData(): Promise<{ email: string, id: string }> {
    const apiToken = `Bearer ${token.value}`
    const result = await getMe({ composable: '$fetch', headers: { Authorization: apiToken } })

    accountId.value = result.id ?? ''
    return { email: user.value?.email ?? '', id: result.id ?? '' }
  }

  // Return all state, getters, and actions
  return {
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
    subscriptionStartDate,
    noPremium,
    remainingFilters,
    acceptingReferralCode,
    userReferralCode,
    createdAccount,
    accountId,
    remainingPremiumSearches,

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
    loadRemainingSearches,
    generateReferralCode,
    useRefferalCode,
    getUserData,
  }
}, {
  persist: true,
})
