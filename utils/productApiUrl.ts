/**
 * Build an absolute URL for a Product sub-resource (`related`, `matches` or
 * `alternatives`).
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
  /** `alternatives` only: caps the number of suggestions (API default/max is 3). */
  limit?: number
  /** `matches` only: ISO code used to resolve `zip` (API default DE). */
  zipCountry?: string
  /** `matches` only: comma separated marketplace names. */
  platforms?: string
  /** `matches` only: comma separated ISO codes, special value `EU`. */
  countries?: string
  /** `matches` only: only offers that can be shipped. */
  shippingOnly?: boolean
}

function buildQueryString(params: ProductResourceUrlParams): string {
  const search = new URLSearchParams()
  if (params.zip) search.append('zip', params.zip)
  if (params.lat) search.append('lat', params.lat.toString())
  if (params.lon) search.append('lon', params.lon.toString())
  if (params.maxDistance) search.append('maxDistance', params.maxDistance.toString())
  if (params.limit) search.append('limit', params.limit.toString())
  if (params.zipCountry) search.append('zipCountry', params.zipCountry)
  if (params.platforms) search.append('platforms', params.platforms)
  if (params.countries) search.append('countries', params.countries)
  if (params.shippingOnly) search.append('shippingOnly', 'true')
  return search.toString()
}

export function buildProductResourceUrl(
  base: string,
  id: string,
  resource: 'related' | 'matches' | 'alternatives',
  params: ProductResourceUrlParams = {},
): string {
  const url = `${base}/api/Product/${id}/${resource}`
  const queryString = buildQueryString(params)
  return queryString ? `${url}?${queryString}` : url
}
