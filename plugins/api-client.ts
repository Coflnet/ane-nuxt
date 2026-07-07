import { client } from '~/src/api-client/client.gen'

// Point the generated API client at the right base URL for the current context:
// the in-cluster backend Service during SSR, the public load balancer in the
// browser. Runs on both server and client (see `useApiBaseUrl()`). Every SDK call
// (searchProducts, getFilters, getMatches, …) goes through this singleton client.
export default defineNuxtPlugin(() => {
  client.setConfig({ baseURL: useApiBaseUrl() })
})
