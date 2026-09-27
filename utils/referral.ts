/** Name/description of the invite link shared via "Copy Referral Code" (the API requires a name). */
export const REFERRAL_LINK_NAME = 'profile-invite'
export const REFERRAL_LINK_TEXT = 'Invite link shared from the profile menu'

/**
 * Referral links belong to a signed-in, non-anonymous account; `/api/referral/link` answers 401
 * otherwise, so anonymous visitors must not trigger the request.
 */
export function canCreateReferralLink(state: { isLoggedIn: boolean, token: string | null | undefined }): boolean {
  return state.isLoggedIn && !!state.token
}

/** Matches a canonical UUID (any version/variant), case-insensitively. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Invite link ids are UUIDs. The `?ref=` query param is attacker-controlled (shared in links
 * anyone can craft), so it must be validated before being stored/sent anywhere — anything that
 * isn't a canonical UUID is silently ignored rather than stored as-is.
 */
export function isValidReferralCode(code: string | null | undefined): code is string {
  return !!code && UUID_PATTERN.test(code)
}

/**
 * A referral code that resolves to the user's own invite link is a self-invite: the API
 * rejects redeeming it with 400, so it must never be sent in the first place when the user's
 * own link id is already known locally.
 */
export function isSelfReferral(code: string, ownReferralCode: string): boolean {
  return !!ownReferralCode && code === ownReferralCode
}
