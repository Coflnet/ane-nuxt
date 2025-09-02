import { ofetch } from 'ofetch'

export default defineNuxtPlugin(() => {
  const customFetch = ofetch.create({
    async onRequest({ request, options }) {
      console.log('[Hey API Interceptor] Intercepting request:', request)
    },

    onRequestError({ request, options, error }) {
      console.error('[Hey API Interceptor] Request failed:', request, error)
    },

    onResponse({ request, response, options }) {
      console.log('[Hey API Interceptor] Response received:', request, response)
    },

    onResponseError({ request, response, options }) {
      if (import.meta.server) {
        console.log('returning')
        return
      }

      console.log(response.status)
      console.log(options.retry)
      if (response.status === 401 && (options.retry == 0 || !options.retry)) {
        options.retry = 1
        console.log('retrying')
        // genreate new token than retry request
        return useUserStore().generateNewToken().then(() => {
          return ofetch(request, options).then((newResponse) => {
            console.log('Successfull token updating')
            return newResponse
          }).catch((retryError) => {
            console.log('Error refreshing token ' + String(retryError))
          })
        })
      }
      console.error('[Hey API Interceptor] Response error:', request, response)
    },
  })

  // ignore the ts error
  globalThis.$fetch = customFetch
})
