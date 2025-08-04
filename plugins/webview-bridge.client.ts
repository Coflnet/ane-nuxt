declare global {
  interface Window {
    greetFromFlutter: () => void
    updateNuxtMessage: (message: string) => void
    getNuxtData: () => string // Return type should match what you JSON.stringify
    sendToFlutter: (message: any) => void
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
      const dataObject = JSON.parse(message)
      const messageData = dataObject['data']
      switch (dataObject['action']) {
        case 'loginSuccess':
          connectLoginFirebase(messageData['user'], messageData['token'])
          break
        case 'anonymousLoginSuccess':
          connectAnonymousLoginFirebase(messageData['token'])
          break
        case 'upgradeAccountSuccess':
          upgradeAccountSuccess(messageData['user'])
          break
        case 'error':
          errorMessage(messageData['message'])
          break
        case 'setNotificationToken':
          setNotificationToken(messageData['token'])
          break
        case 'log':
          logFunction(messageData['message'])
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

    window.sendToFlutter = (message: any) => {
      if (window.FlutterChannel && window.FlutterChannel.postMessage) {
        window.FlutterChannel.postMessage(JSON.stringify(message))
      }
      else {
        console.warn('FlutterChannel not found. Not in a Flutter WebView or channel not set up.')
      }
    }
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

  async function connectLoginFirebase(data: any, token: string) {
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

  async function upgradeAccountSuccess(data: any) {
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
