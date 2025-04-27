import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { navigateTo } from "#app"
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, GoogleAuthProvider, signInAnonymously, signInWithEmailAndPassword, signInWithPopup, type Auth } from "firebase/auth"
import { loginFirebase, type Platform, type TokenContainer } from "~/src/api-client"

// Types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface MatchItem {
  title: string | null | undefined;
  marketplace: Platform | undefined;
  price: number | undefined;
  matchedAt: string;
  filter: number | undefined;
  url: string | null | undefined;
  image: string | null | undefined
}

export interface CachedAuctions {
  auctions: MatchItem[];
  timeStamp: string;
}

export interface NotificationSettings {
  discord: {
    enabled: boolean
    webhookUrl: string
    channelName: string
    format: "detailed" | "compact"
  }
  email: {
    enabled: boolean
    address: string
    frequency: "instant" | "hourly" | "daily"
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
export const useUserStore = defineStore("user", () => {
  // State
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isAnonymous = ref(false);
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const token = ref<string | null>(null)
  const cachedAuctions = ref<CachedAuctions | null>(null)
  const cachedFilters = ref<{ [id: number]: string }>()


  const notificationSettings = ref<NotificationSettings>({
    discord: {
      enabled: false,
      webhookUrl: "",
      channelName: "",
      format: "detailed",
    },
    email: {
      enabled: true,
      address: "",
      frequency: "instant",
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

  const isLoggedIn = computed(() => isAuthenticated.value)
  const getUser = computed(() => user.value)
  const getNotificationSettings = computed(() => notificationSettings.value)
  const isUserAnonymous = computed(() => isAnonymous.value)

  async function loadUser() {
    try {
      isLoading.value = true;
      error.value = null;

      const googleUser = useCurrentUser();
      if (!googleUser) {
        const provider = new GoogleAuthProvider();
        const auth = useFirebaseAuth();

        if (!auth)
          return;

        const result = await signInWithPopup(auth, provider);
        const loggedInUser = result.user;

        if (loggedInUser) {
          user.value = {
            id: loggedInUser.uid,
            name: loggedInUser.displayName ?? "",
            email: loggedInUser.email ?? "",
            avatar: loggedInUser.photoURL ?? "",
          };
          isAuthenticated.value = true;
        } else {
          throw new Error("User not found");
        }

        const credential = GoogleAuthProvider.credentialFromResult(result);
        const response = await loginFirebase({
          composable: "useAsyncData",
          body: { authToken: credential?.accessToken }
        })
        token.value = response.data.value?.authToken ?? ""
      }
    } catch (e) {
      console.error("Error loading user:", e);
      error.value = "Failed to load user data. Please try again.";
    } finally {
      isLoading.value = false;
    }
  }

  async function loginWithGoogle(clientAuth: Auth) {
    isLoading.value = true
    error.value = null

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(clientAuth, provider);
      const loggedInUser = result.user;

      if (loggedInUser) {
        user.value = {
          id: loggedInUser.uid,
          name: loggedInUser.displayName ?? "",
          email: loggedInUser.email ?? "",
          avatar: loggedInUser.photoURL ?? "",
        };
        isAuthenticated.value = true;

      }

      const credential = GoogleAuthProvider.credentialFromResult(result);

      const response = await loginFirebase({
        composable: "$fetch",
        body: { authToken: credential?.accessToken }
      })
      console.log(response)
      token.value = response.authToken ?? ""

      isAuthenticated.value = true

      return { success: true };
    } catch (err) {
      error.value = "Failed to login. Please try again.";
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }

  async function signInWithEmailPassword(clientAuth: Auth, email: string, password: string, isLogin: boolean) {
    isLoading.value = true
    error.value = null

    try {
      const result = isLogin ? await createUserWithEmailAndPassword(clientAuth, email, password) : await signInWithEmailAndPassword(clientAuth, email, password)
      const loggedInUser = result.user;

      if (loggedInUser) {
        user.value = {
          id: loggedInUser.uid,
          name: loggedInUser.displayName ?? "",
          email: loggedInUser.email ?? "",
          avatar: loggedInUser.photoURL ?? "",
        };
        isAuthenticated.value = true;
      }
      return { success: true };
    } catch (err) {
      error.value = `${err}`;
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }

  function saveAuctionCache(actions: MatchItem[]) {
    cachedAuctions.value = { auctions: actions, timeStamp: new Date().toISOString() }
  }

  function loadAuctionCache(): [boolean, MatchItem[]] {
    if (Date.now() - Date.parse(cachedAuctions.value?.timeStamp ?? "") > 60 * 1000) {
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
    resetNotificationSettings()

    navigateTo("/login")
  }

  async function checkAuth(clientAuth: Auth) {
    if (isAuthenticated.value)
      return;

    try {
      const signInResult = await signInAnonymously(clientAuth)
      const accessToken = await signInResult.user.getIdTokenResult();

      const response = await loginFirebase({
        composable: "$fetch",
        body: { authToken: accessToken.token }
      })
      token.value = response.authToken ?? ""

      isAuthenticated.value = true
      isAnonymous.value = true
    } catch (error) {
      console.error("Error checking authentication:", error)
    }
  }

  // Notification settings methods
  function resetNotificationSettings() {
    notificationSettings.value = {
      discord: {
        enabled: false,
        webhookUrl: "",
        channelName: "",
        format: "detailed",
      },
      email: {
        enabled: true,
        address: user.value?.email || "",
        frequency: "instant",
      },
      webPush: {
        enabled: false,
        subscribed: false,
        notifyNewMatches: true,
        notifyPriceChanges: true,
        notifyEndingSoon: true,
      },
    }
  }


  // Return all state, getters, and actions
  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    token,
    isLoadingSettings,
    cachedFilters,
    cachedAuctions,


    // Getters
    isLoggedIn,
    getUser,
    getNotificationSettings,
    isUserAnonymous,

    // Actions
    loadUser,
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

