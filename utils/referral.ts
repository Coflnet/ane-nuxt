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
