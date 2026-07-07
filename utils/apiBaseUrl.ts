/**
 * Resolve the API base URL for the current rendering context.
 *
 * - Browser: the public base (`https://ane.coflnet.com`, behind the load balancer).
 * - SSR inside the cluster: the internal Service base (`http://aneapi:8000`) so
 *   server rendering never leaves the cluster. The old behaviour — SSR calling the
 *   public host — meant every render looped pod → Cloudflare → origin and back; when
 *   that external path stalled, SSR hung and the site 504'd.
 *
 * Both values come from runtimeConfig and are overridable via env
 * (NUXT_PUBLIC_API_BASE_URL / NUXT_API_INTERNAL_BASE_URL).
 */
export function useApiBaseUrl(): string {
  const config = useRuntimeConfig()
  if (import.meta.server) {
    return config.apiInternalBaseUrl || config.public.apiBaseUrl
  }
  return config.public.apiBaseUrl
}
