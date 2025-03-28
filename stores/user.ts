import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { navigateTo } from "#app"

// Types
export interface User {
  id: number
  name: string
  email: string
  avatar?: string
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
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const token = ref<string | null>(null)

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

  // Getters (computed)
  const isLoggedIn = computed(() => isAuthenticated.value)
  const getUser = computed(() => user.value)
  const getNotificationSettings = computed(() => notificationSettings.value)

  // Actions (functions)
  async function loginWithGoogle(token: string) {
    isLoading.value = true
    error.value = null

    try {
      // In a real implementation, this would call the API
      // const { data } = await useFetch('/api/auth/google', {
      //   method: 'POST',
      //   body: { token }
      // })

      // For now, simulate a successful login
      const userData = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        avatar: "/placeholder.svg?height=100&width=100",
      }

      user.value = userData
      isAuthenticated.value = true
      token.value = "mock_token"

      // Load notification settings after login
      await fetchNotificationSettings()

      return { success: true }
    } catch (err) {
      error.value = "Failed to login. Please try again."
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    // In a real implementation, this would call the API
    // await useFetch('/api/auth/logout', { method: 'POST' })

    user.value = null
    isAuthenticated.value = false
    token.value = null
    resetNotificationSettings()

    // Redirect to login page
    navigateTo("/login")
  }

  async function checkAuth() {
    // In a real implementation, this would validate the token with the API
    // For demo purposes, we'll just set a mock user

    // Simulate a valid session for demo
    user.value = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      avatar: "/placeholder.svg?height=100&width=100",
    }
    isAuthenticated.value = true
    token.value = "mock_token"

    // Load notification settings
    await fetchNotificationSettings()

    return true
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

  async function fetchNotificationSettings() {
    isLoadingSettings.value = true

    try {
      // In a real implementation, this would call the API
      // const { data } = await useFetch('/api/user/notification-settings')

      // For now, simulate fetching settings
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Mock data
      notificationSettings.value = {
        discord: {
          enabled: true,
          webhookUrl: "https://discord.com/api/webhooks/example",
          channelName: "#auction-alerts",
          format: "detailed",
        },
        email: {
          enabled: true,
          address: user.value?.email || "user@example.com",
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

      return { success: true }
    } catch (err) {
      console.error("Error fetching notification settings:", err)
      return { success: false, error: "Failed to load notification settings" }
    } finally {
      isLoadingSettings.value = false
    }
  }

  async function updateNotificationSettings(settings: NotificationSettings) {
    isLoadingSettings.value = true

    try {
      // In a real implementation, this would call the API
      // const { data } = await useFetch('/api/user/notification-settings', {
      //   method: 'PUT',
      //   body: settings
      // })

      // For now, simulate updating settings
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update local state
      notificationSettings.value = settings

      return { success: true }
    } catch (err) {
      console.error("Error updating notification settings:", err)
      return { success: false, error: "Failed to update notification settings" }
    } finally {
      isLoadingSettings.value = false
    }
  }

  async function testDiscordWebhook() {
    if (!notificationSettings.value.discord.webhookUrl) {
      return { success: false, error: "Webhook URL is required" }
    }

    try {
      // In a real implementation, this would call the API
      // const { data } = await useFetch('/api/notifications/test-discord', {
      //   method: 'POST',
      //   body: { webhookUrl: notificationSettings.value.discord.webhookUrl }
      // })

      // For now, simulate testing webhook
      await new Promise((resolve) => setTimeout(resolve, 1500))

      return { success: true, message: "Test message sent to Discord successfully!" }
    } catch (err) {
      console.error("Error testing Discord webhook:", err)
      return { success: false, error: "Failed to send test message to Discord" }
    }
  }

  async function testEmailNotification() {
    if (!notificationSettings.value.email.address) {
      return { success: false, error: "Email address is required" }
    }

    try {
      // In a real implementation, this would call the API
      // const { data } = await useFetch('/api/notifications/test-email', {
      //   method: 'POST',
      //   body: { email: notificationSettings.value.email.address }
      // })

      // For now, simulate sending test email
      await new Promise((resolve) => setTimeout(resolve, 1500))

      return {
        success: true,
        message: `Test email sent to ${notificationSettings.value.email.address} successfully!`,
      }
    } catch (err) {
      console.error("Error sending test email:", err)
      return { success: false, error: "Failed to send test email" }
    }
  }

  async function toggleWebPushSubscription() {
    try {
      // In a real implementation, this would handle browser push notification permissions
      // and subscribe/unsubscribe from the push service

      // For now, just toggle the state
      notificationSettings.value.webPush.subscribed = !notificationSettings.value.webPush.subscribed

      return {
        success: true,
        subscribed: notificationSettings.value.webPush.subscribed,
        message: notificationSettings.value.webPush.subscribed
          ? "Successfully subscribed to web push notifications!"
          : "Successfully unsubscribed from web push notifications.",
      }
    } catch (err) {
      console.error("Error toggling web push subscription:", err)
      return { success: false, error: "Failed to update web push subscription" }
    }
  }

  async function updateProfile(profileData: Partial<User>) {
    isLoading.value = true
    error.value = null

    try {
      // In a real implementation, this would call the API
      // const { data } = await useFetch('/api/user/profile', {
      //   method: 'PUT',
      //   body: profileData
      // })

      // For now, simulate updating profile
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update user data
      if (user.value) {
        user.value = { ...user.value, ...profileData }
      }

      // If email was updated, also update it in notification settings
      if (profileData.email && notificationSettings.value.email.enabled) {
        notificationSettings.value.email.address = profileData.email
      }

      return { success: true }
    } catch (err) {
      error.value = "Failed to update profile. Please try again."
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
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
    notificationSettings,
    isLoadingSettings,

    // Getters
    isLoggedIn,
    getUser,
    getNotificationSettings,

    // Actions
    loginWithGoogle,
    logout,
    checkAuth,
    resetNotificationSettings,
    fetchNotificationSettings,
    updateNotificationSettings,
    testDiscordWebhook,
    testEmailNotification,
    toggleWebPushSubscription,
    updateProfile,
  }
})


