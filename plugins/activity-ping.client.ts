import { client } from '~/src/api-client/client.gen'
import { pingActivity } from '~/utils/activityPing'

function localStorageOrNull(): Storage | null {
  try {
    return window.localStorage
  }
  catch {
    return null
  }
}

// Reports website activity for the signed-in user (anonymous sessions too, their filters are
// keyed by that id) after every page render, so their notification filters are not paused
export default defineNuxtPlugin((nuxtApp) => {
  // the user store is created only once all plugins ran, so piniaPersist (registered after
  // this plugin) restores and persists the signed-in session
  const ping = () => {
    pingActivity(useUserStore().token, {
      storage: localStorageOrNull(),
      now: Date.now,
      send: token => client.post({
        composable: '$fetch',
        url: '/api/user/activity',
        headers: { Authorization: `Bearer ${token}` },
      }),
    })
  }

  nuxtApp.hook('page:finish', ping)
  nuxtApp.hook('app:mounted', () => {
    // pages sign in anonymously after rendering, report the new session as well
    watch(() => useUserStore().token, ping)
  })
})
