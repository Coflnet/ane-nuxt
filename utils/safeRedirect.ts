/**
 * Hosts this app is allowed to redirect users to after login/auth flows, in addition to the
 * current origin. Keep in sync with the domains the app is actually served from.
 */
export const ALLOWED_REDIRECT_HOSTS = ['ane.deals', 'www.ane.deals', 'ane.coflnet.com']

/**
 * Restricts a user-controlled redirect target (e.g. a `redirectTo`/`next`/`returnUrl` query
 * param) to a same-origin relative path or an absolute URL on an allowlisted Ane host, falling
 * back to `fallback` for everything else.
 *
 * This closes an open-redirect: without it, a crafted link like
 * `/login?redirectTo=https://evil.example` would send a freshly logged-in user straight to an
 * attacker-controlled site.
 *
 * A relative path must start with exactly one `/` — `//evil.example` (protocol-relative) and
 * `/\evil.example` (browsers normalize a leading backslash to a slash) are rejected, since both
 * are interpreted by the browser as a navigation to a different host.
 */
export function safeRedirect(target: string | null | undefined, fallback = '/'): string {
  if (!target)
    return fallback

  if (/^\/(?!\/|\\)/.test(target))
    return target

  try {
    const url = new URL(target)
    if (ALLOWED_REDIRECT_HOSTS.includes(url.hostname))
      return target
  }
  catch {
    // not a parseable absolute URL either; fall through to the fallback below
  }

  return fallback
}
