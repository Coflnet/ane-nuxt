// Country of the request as seen by Cloudflare. Product pages come from the SSR cache and cannot
// use the header themselves, so the browser asks here after load. Never cache this response.
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return { country: getRequestHeader(event, 'cf-ipcountry') ?? null }
})
