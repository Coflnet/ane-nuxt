/**
 * Search/subscription stats belong to a signed-in, non-anonymous account; `/api/stats` (and the
 * subscription lookup that follows it in `loadRemainingSearches`) answers 401 for anonymous
 * visitors, so the request must not be made until the user is actually logged in.
 */
export function canLoadStats(state: { isLoggedIn: boolean, token: string | null | undefined }): boolean {
  return state.isLoggedIn && !!state.token
}
