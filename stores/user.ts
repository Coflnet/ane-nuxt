import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createUserWithEmailAndPassword, type EmailAuthCredential, EmailAuthProvider, GoogleAuthProvider, linkWithCredential, linkWithPopup, signInAnonymously, signInWithEmailAndPassword, signInWithPopup, type Auth, updateProfile, type UserCredential, getAdditionalUserInfo } from 'firebase/auth'
import { navigateTo } from '#app'
import { createLink, getAccess, getStats, listLinks, loginFirebase, useLink } from '~/src/api-client'
import type { PaymentControllerAccessInfo as AccessInfo, PaymentControllerActiveSubscription as ActiveSubscription, ClientModelFilterMatch as FilterMatch } from '~/src/api-client'
import { canCreateReferralLink, isSelfReferral, REFERRAL_LINK_NAME, REFERRAL_LINK_TEXT } from '~/utils/referral'
import { canLoadStats } from '~/utils/stats'

export type AccessTier = 'free' | 'collector' | 'flipper'

const tierRank: Record<AccessTier, number> = { free: 0, collector: 1, flipper: 2 }

function highestTier(a: AccessTier, b: AccessTier): AccessTier {
  return tierRank[a] >= tierRank[b] ? a : b
}

function planTier(plan: ActiveSubscription | null | undefined): AccessTier {
  if (plan?.product === 'flipper') return 'flipper'
  return plan?.product && plan.product !== 'basic' ? 'collector' : 'free'
}

function accessTier(info: AccessInfo | null | undefined): AccessTier {
  return info?.tier === 'flipper' || info?.tier === 'collector' ? info.tier : 'free'
}

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
  // effective access from /api/payment/access; also covers manual ownership grants that have no subscription
  const access = ref<AccessInfo | null>(null)
  const noPremium = ref<boolean | null>(null)
  const effectiveTier = computed<AccessTier>(() => highestTier(planTier(currentPlan.value), accessTier(access.value)))
  const remainingFilters = ref<number>(3)
  const acceptingReferralCode = ref<string>('')
  const userReferralCode = ref<string>('')
  const accountId = ref('')
  const isWebView = ref(false)
  const notificationToken = ref('')

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

  /**
   * Returns the id of the signed-in user's invite link, reusing an existing one before creating it.
   * Anonymous visitors have no referral link (the endpoint requires an account), so no request is made.
   */
  async function generateReferralCode(): Promise<string> {
    if (!canCreateReferralLink({ isLoggedIn: isLoggedIn.value, token: token.value }))
      return ''

    const headers = { Authorization: `Bearer ${token.value}` }
    const existing = await listLinks({ composable: '$fetch', headers })
    const reusable = existing.find(link => link.name === REFERRAL_LINK_NAME && link.id)
    if (reusable?.id)
      return reusable.id

    const refCode = await createLink({
      composable: '$fetch',
      query: { name: REFERRAL_LINK_NAME, text: REFERRAL_LINK_TEXT },
      headers,
    })

    return refCode.id ?? ''
  }

  /**
   * Redeems the stored referral code for the signed-in user.
   *
   * Returns 'self' (no error toast should be shown) when the code turns out to be the user's
   * own invite link: skipped locally when the user's link id is already cached, otherwise the
   * API rejects the self-invite with 400, which is treated the same way. Either way the stored
   * code is cleared so it isn't retried on a later login.
   */
  async function useRefferalCode(): Promise<'used' | 'self' | 'error'> {
    const code = acceptingReferralCode.value

    if (isSelfReferral(code, userReferralCode.value)) {
      acceptingReferralCode.value = ''
      return 'self'
    }

    const apiToken = `Bearer ${token.value}`
    try {
      await useLink({
        composable: '$fetch',
        query: { inviter: code },
        headers: { Authorization: apiToken },
      })
      acceptingReferralCode.value = ''
      return 'used'
    }
    catch (error) {
      const apiError = error as { response?: { status?: number }, statusCode?: number }
      const status = apiError?.response?.status ?? apiError?.statusCode ?? 0
      if (status === 400) {
        // Self-invite: the API rejects a referral code that resolves to the user's own link.
        acceptingReferralCode.value = ''
        return 'self'
      }
      console.error(error)
      return 'error'
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
    currentPlan.value = null
    access.value = null
    subscriptionStartDate.value = ''
    noPremium.value = null
    resetEntitlementLoad()
    // the cached invite link belongs to the signed-out account
    userReferralCode.value = ''

    navigateTo(localePath('/login'))
  }

  async function checkAuth(clientAuth: Auth) {
    if (isAuthenticated.value)
      return

    try {
      if (isWebView.value) {
        window.sendToFlutter({ action: 'createAnonymousAccount' })
      }
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

  /**
   * Search/subscription stats belong to a signed-in, non-anonymous account; `/api/stats`
   * answers 401 for anonymous visitors (e.g. the invite-link landing page), so no request is
   * made until the user is logged in.
   */
  async function loadRemainingSearches(): Promise<{ used: number, total: number, refreshData: number }> {
    if (!canLoadStats({ isLoggedIn: isLoggedIn.value, token: token.value }))
      return { used: 0, total: 0, refreshData: 0 }

    const apiToken = `Bearer ${token.value}`
    try {
      const response = await getStats({
        composable: '$fetch',
        headers: { Authorization: apiToken },
      })

      if (subscriptionStartDate.value == '' && noPremium.value == null)
        await getSubscriptionEndDate()

      remainingFilters.value = (response.listenerLimit ?? 3) - (response.listenerCount ?? 0)

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

  // Intentional reset: forgets cached entitlements and refetches them (a refresh already in flight is abandoned).
  async function getSubscriptionEndDate() {
    currentPlan.value = null
    access.value = null
    subscriptionStartDate.value = ''
    noPremium.value = null
    resetEntitlementLoad()
    await refreshEntitlements()
  }

  // Entitlement load bookkeeping. Plain variables on purpose: they must not be persisted or hydrated.
  let loadedEntitlementsToken: string | null = null
  let inflightRefresh: { token: string, promise: Promise<void> } | null = null

  function resetEntitlementLoad() {
    loadedEntitlementsToken = null
    inflightRefresh = null
  }

  // Resolves immediately once entitlements for the current token are loaded, otherwise shares the in-flight refresh.
  async function ensureEntitlements() {
    if (!token.value || loadedEntitlementsToken === token.value) return
    await refreshEntitlements()
  }

  // Reloads subscription plan and effective access without clearing the cached values first,
  // so a refresh never flickers the tier down to free. Concurrent callers share one request pair per token.
  function refreshEntitlements(): Promise<void> {
    const requestToken = token.value
    if (!requestToken) {
      currentPlan.value = null
      access.value = null
      resetEntitlementLoad()
      return Promise.resolve()
    }
    if (inflightRefresh?.token === requestToken) return inflightRefresh.promise

    const promise = loadEntitlements(requestToken)
    const entry = { token: requestToken, promise }
    inflightRefresh = entry
    const release = () => {
      if (inflightRefresh === entry) inflightRefresh = null
    }
    promise.then(release, release)
    return promise
  }

  async function loadEntitlements(requestToken: string) {
    const headers = { Authorization: `Bearer ${requestToken}` }
    const [subscriptions, effectiveAccess] = await Promise.allSettled([
      getSubscription({ composable: '$fetch', headers, signal: AbortSignal.timeout(8000) }),
      fetchAccess(headers),
    ])
    if (token.value !== requestToken) return

    // access is authoritative for the tier (it merges subscription and ownership grants server side)
    access.value = effectiveAccess.status === 'fulfilled' ? effectiveAccess.value : null
    if (subscriptions.status === 'fulfilled') applySubscriptions(subscriptions.value)
    else noPremium.value = null

    // the tier is only unknown when both lookups failed
    if (subscriptions.status === 'rejected' && effectiveAccess.status === 'rejected')
      throw subscriptions.reason
    if (subscriptions.status === 'rejected')
      console.error('Failed to load subscription:', subscriptions.reason)
    loadedEntitlementsToken = requestToken
  }

  function applySubscriptions(result: ActiveSubscription[]) {
    const active = result.filter(subscription => !subscription.endsAt || Date.parse(subscription.endsAt) > Date.now())
    currentPlan.value = active.find(subscription => subscription.product === 'flipper')
      ?? active.find(subscription => subscription.product === 'collector') ?? active[0] ?? null
    subscriptionStartDate.value = currentPlan.value?.createdAt ?? ''
    noPremium.value = currentPlan.value === null && accessTier(access.value) === 'free'
  }

  function fetchAccess(headers: { Authorization: string }): Promise<AccessInfo> {
    return getAccess({ composable: '$fetch', headers, signal: AbortSignal.timeout(8000) })
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

  async function deleteAccount(): Promise<boolean> {
    const apiToken = `Bearer ${token.value}`
    try {
      // TODO: switch to the generated SDK method (e.g. `deleteMe`) once AneApi's
      // DELETE /api/user/me endpoint is deployed and the OpenAPI client is regenerated.
      await $fetch(`${useApiBaseUrl()}/api/user/me`, {
        method: 'DELETE',
        headers: { Authorization: apiToken },
      })
      return true
    }
    catch (error) {
      console.error('Error deleting account:', error)
      return false
    }
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
    access,
    effectiveTier,
    subscriptionStartDate,
    noPremium,
    remainingFilters,
    acceptingReferralCode,
    userReferralCode,
    createdAccount,
    accountId,
    isWebView,
    notificationToken,

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
    getSubscriptionEndDate,
    refreshEntitlements,
    ensureEntitlements,
    generateReferralCode,
    useRefferalCode,
    getUserData,
    deleteAccount,
  }
}, {
  persist: true,
})
