const API_BASE = 'https://ane.coflnet.com'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name') ?? ''
  // name is e.g. "product-sitemap" or "product-sitemap-de" or "product-sitemap-0" or "product-sitemap-de-0"
  const match = name.match(/^product-sitemap(?:-(de))?(?:-(\d+))?$/)
  if (!match) {
    setResponseStatus(event, 404)
    return 'Not found'
  }

  const [, locale, index] = match
  let backendPath: string
  if (locale && index != null) {
    backendPath = `/api/sitemap-de-products-${index}.xml`
  } else if (locale) {
    backendPath = '/api/sitemap-de-products.xml'
  } else if (index != null) {
    backendPath = `/api/sitemap-products-${index}.xml`
  } else {
    backendPath = '/api/sitemap-products.xml'
  }

  const data = await $fetch<string>(`${API_BASE}${backendPath}`)
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return data
})
