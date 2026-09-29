/**
 * Country detection for the offers filter ("My country" quick action).
 *
 * Order: a stored choice of the user, then the `CF-IPCountry` request header (SSR only),
 * then the region of the browser language (`de-AT` gives AT), then DE.
 */

export const DEFAULT_COUNTRY = 'DE'

/** Cloudflare uses XX (unknown) and T1 (Tor) as pseudo country codes. */
const PSEUDO_COUNTRIES = new Set(['XX', 'T1'])

/** Returns the upper-cased ISO 3166-1 alpha-2 code, or null when the input is not one. */
export function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const code = value.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code) || PSEUDO_COUNTRIES.has(code)) return null
  return code
}

/** `de-AT` -> `AT`, `en_gb` -> `GB`, `de` -> null. */
export function regionFromLanguage(language: string | null | undefined): string | null {
  if (!language) return null
  const parts = language.trim().split(/[-_]/)
  // a region subtag is the first 2 letter part after the language (script subtags have 4)
  for (const part of parts.slice(1)) {
    const code = normalizeCountryCode(part)
    if (code && part.length === 2) return code
  }
  return null
}

/** Splits an `Accept-Language` header (`de-AT,de;q=0.9,en;q=0.8`) into tags ordered by q. */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return []
  return header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const qParam = params.map(p => p.trim()).find(p => p.startsWith('q='))
      const q = qParam ? Number(qParam.slice(2)) : 1
      return { tag: (tag ?? '').trim(), q: Number.isFinite(q) ? q : 0, index }
    })
    .filter(entry => entry.tag && entry.tag !== '*' && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map(entry => entry.tag)
}

export interface CountryDetectionInput {
  /** Country the user picked before (cookie). */
  stored?: string | null
  /** Value of the `CF-IPCountry` request header, available during SSR. */
  header?: string | null
  /** Browser languages, most preferred first. */
  languages?: readonly string[] | null
}

export function detectCountry(input: CountryDetectionInput): string {
  const stored = normalizeCountryCode(input.stored)
  if (stored) return stored
  const header = normalizeCountryCode(input.header)
  if (header) return header
  for (const language of input.languages ?? []) {
    const region = regionFromLanguage(language)
    if (region) return region
  }
  return DEFAULT_COUNTRY
}

/** Regional indicator flag emoji for a country code. */
export function countryFlag(code: string): string {
  const normalized = normalizeCountryCode(code)
  if (!normalized) return ''
  return String.fromCodePoint(...[...normalized].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
}

/** Localized country name, falls back to the code. */
export function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code
  }
  catch {
    return code
  }
}
