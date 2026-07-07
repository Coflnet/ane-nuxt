export default defineEventHandler(async (event) => {
  // Server middleware always runs in the cluster — call the backend internally.
  const { apiInternalBaseUrl, public: { apiBaseUrl } } = useRuntimeConfig(event)
  const API_BASE = apiInternalBaseUrl || apiBaseUrl
  const path = getRequestURL(event).pathname
  const match = path.match(/^\/product-sitemap(?:-(de))?(?:-(\d+))?\.xml$/)
  if (!match) return

  const [, locale, index] = match
  let backendPath: string
  if (locale && index != null) {
    backendPath = `/api/sitemap-de-products-${index}.xml`
  }
  else if (locale) {
    backendPath = '/api/sitemap-de-products.xml'
  }
  else if (index != null) {
    backendPath = `/api/sitemap-products-${index}.xml`
  }
  else {
    backendPath = '/api/sitemap-products.xml'
  }

  const data = await $fetch<string>(`${API_BASE}${backendPath}`)
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return data
})
