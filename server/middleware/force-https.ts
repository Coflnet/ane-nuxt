import { defineEventHandler, getRequestHeaders, sendRedirect } from 'h3'

export default defineEventHandler((event) => {
  const headers = getRequestHeaders(event) as Record<string, string | undefined>
  const host = (headers.host || '').toLowerCase()

  // Common header added by proxies/load-balancers to indicate original protocol
  const forwardedProto = (headers['x-forwarded-proto'] || headers['x-forwarded-protocol'] || '').toLowerCase()

  const socketEncrypted = !!(event.node.req.socket && (event.node.req.socket as any).encrypted)
  const isSecure = forwardedProto === 'https' || socketEncrypted

  // Only redirect for the production domain
  if (host.includes('ane.deals') && !isSecure) {
    const reqUrl = (event.node.req.url || '')
    const target = `https://${host}${reqUrl}`
    return sendRedirect(event, target, 301)
  }

  return
})
