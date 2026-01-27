declare global {
  interface Window {
    greetFromFlutter: () => void
    updateNuxtMessage: (message: string) => void
    getNuxtData: () => string // Return type should match what you JSON.stringify
    sendToFlutter: (message: unknown) => void
    FlutterChannel?: {
      postMessage: (message: string) => void
    }
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const { $i18n } = nuxtApp

  if (import.meta.client) {
    window.updateNuxtMessage = async (message: string) => {
      console.log('Nuxt.js received updateNuxtMessage:', message)
      console.log(typeof message)
      const dataObject = JSON.parse(message) as { action: string, data: Record<string, unknown> }
      const messageData = dataObject['data']
      switch (dataObject['action']) {
        case 'loginSuccess':
          connectLoginFirebase(messageData['user'] as FlutterUserData, messageData['token'] as string)
          break
        case 'anonymousLoginSuccess':
          connectAnonymousLoginFirebase(messageData['token'] as string)
          break
        case 'upgradeAccountSuccess':
          upgradeAccountSuccess(messageData['user'] as FlutterUserData)
          break
        case 'error':
          errorMessage(messageData['message'] as string)
          break
        case 'setNotificationToken':
          setNotificationToken(messageData['token'] as string)
          break
        case 'log':
          logFunction(messageData['message'] as string)
      }
    }

    // Function to return data to Flutter
    window.getNuxtData = () => {
      console.log('Nuxt.js received getNuxtData call!')
      return JSON.stringify({
        status: 'success',
        data: 'This is data from Nuxt.js!',
        timestamp: new Date().toISOString(),
      })
    }

    window.sendToFlutter = (message: unknown) => {
      if (window.FlutterChannel && window.FlutterChannel.postMessage) {
        window.FlutterChannel.postMessage(JSON.stringify(message))
      }
      else {
        console.warn('FlutterChannel not found. Not in a Flutter WebView or channel not set up.')
      }
    }
  }

  interface FlutterUserData {
    uid: string
    displayName?: string
    email?: string
    photoURL?: string
  }

  async function connectAnonymousLoginFirebase(token: string) {
    const response = await loginFirebase({
      composable: '$fetch',
      body: { authToken: token },
    })

    useUserStore().token = response.authToken ?? ''

    useUserStore().isAuthenticated = true
    useUserStore().isAnonymous = true
  }

  async function connectLoginFirebase(data: FlutterUserData, token: string) {
    const localePath = useLocalePath()
    useUserStore().user = {
      id: data.uid,
      name: data.displayName ?? '',
      email: data.email ?? '',
      avatar: data.photoURL ?? '',
    }

    const response = await loginFirebase({
      composable: '$fetch',
      body: { authToken: token },
    })
    useUserStore().isAuthenticated = true
    useUserStore().isAnonymous = false
    useUserStore().token = response.authToken ?? ''
    navigateTo(localePath('/overview'))
  }

  async function upgradeAccountSuccess(data: FlutterUserData) {
    const localePath = useLocalePath()
    useUserStore().user = {
      id: data.uid,
      name: data.displayName ?? '',
      email: data.email ?? '',
      avatar: data.photoURL ?? '',
    }

    useUserStore().isAuthenticated = true
    useUserStore().isAnonymous = false
    navigateTo(localePath('/overview'))
  }

  function errorMessage(message: string) {
    push.error($i18n?.t(message))
  }

  function setNotificationToken(token: string) {
    useUserStore().notificationToken = token
  }

  function logFunction(message: string) {
    console.log('got log')
    push.info(`DEBUG: \n ${message}`)
  }
})
