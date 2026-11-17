/**
 * What the search radius applies to (mirrors the backend RadiusFilter):
 * 'all'    - every offer must be within the radius, shipped ones too;
 * 'pickup' - only pickup offers must be near, offers with shipping come from anywhere (legacy behaviour).
 */
export type RadiusScope = 'all' | 'pickup'

export const DEFAULT_RADIUS_SCOPE: RadiusScope = 'all'

const normalize = (value: string) => value.trim().toLowerCase()

function allows(deliveryMethod: string | null | undefined, method: string): boolean {
  if (!deliveryMethod) return true
  const methods = deliveryMethod.split(',').map(normalize)
  return methods.includes('all') || methods.includes(method)
}

/** Shipping is allowed when the delivery method is any ('' / 'all') or lists 'shipping'. */
export function shippingAllowed(deliveryMethod: string | null | undefined): boolean {
  return allows(deliveryMethod, 'shipping')
}

/** The radius is user-facing unless the delivery is shipping-only (the zip is disabled there; the wire still sends it as scope pickup). */
export function radiusApplicable(deliveryMethod: string | null | undefined): boolean {
  return allows(deliveryMethod, 'pickup')
}

/** True when the user has to choose a scope: shipped offers exist alongside pickup ones. */
export function needsRadiusScopeChoice(deliveryMethod: string | null | undefined): boolean {
  return radiusApplicable(deliveryMethod) && shippingAllowed(deliveryMethod)
}

/** Decodes a saved RadiusScope; absent or unknown values keep the legacy "pickup" behaviour. */
export function decodeRadiusScope(value: string | null | undefined): RadiusScope {
  return value != null && normalize(value) === 'all' ? 'all' : 'pickup'
}

/** How the radius reads in the summary: not at all, as a pickup limit, for everything, or pickup-only with shipping from anywhere. */
export type RadiusSummary = 'none' | 'pickupOnly' | 'everything' | 'pickupShippingAnywhere'

/** The one decision summary, form and wire agree on. */
export function radiusSummary(deliveryMethod: string | null | undefined, zipcode: string, scope: RadiusScope): RadiusSummary {
  if (!zipcode || !radiusApplicable(deliveryMethod)) return 'none'
  if (!shippingAllowed(deliveryMethod)) return 'pickupOnly'
  return scope === 'all' ? 'everything' : 'pickupShippingAnywhere'
}

/** The scope to send: shipping-only filters keep the legacy-equivalent 'pickup' (no choice is offered there). */
export function effectiveRadiusScope(deliveryMethod: string | null | undefined, chosen: RadiusScope): RadiusScope {
  return radiusApplicable(deliveryMethod) ? chosen : 'pickup'
}
