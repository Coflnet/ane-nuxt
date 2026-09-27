/**
 * Build an absolute URL for a Product sub-resource (`related` or `matches`).
 *
 * These were previously built as bare `/api/Product/${id}/...` paths, which the browser
 * resolves against the Nuxt origin (ane.deals) instead of the API (ane.coflnet.com) — the
 * request 404s and related products / matches never load. `base` must come from
 * `useApiBaseUrl()` so the URL is absolute in the browser and hits the internal Service
 * during SSR.
 */

export interface ProductResourceUrlParams {
  zip?: string
  lat?: number
  lon?: number
  maxDistance?: number
}

function buildQueryString(params: ProductResourceUrlParams): string {
  const search = new URLSearchParams()
  if (params.zip) search.append('zip', params.zip)
  if (params.lat) search.append('lat', params.lat.toString())
  if (params.lon) search.append('lon', params.lon.toString())
  if (params.maxDistance) search.append('maxDistance', params.maxDistance.toString())
  return search.toString()
}

export function buildProductResourceUrl(
  base: string,
  id: string,
  resource: 'related' | 'matches',
  params: ProductResourceUrlParams = {},
): string {
  const url = `${base}/api/Product/${id}/${resource}`
  const queryString = buildQueryString(params)
  return queryString ? `${url}?${queryString}` : url
}
