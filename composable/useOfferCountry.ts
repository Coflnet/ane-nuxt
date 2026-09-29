import { DEFAULT_COUNTRY, detectCountry, normalizeCountryCode } from '~/utils/countryDetection'

/**
 * Country of the user for the offers filter. Detection order lives in utils/countryDetection.ts;
 * the user's own choice is stored in a cookie.
 *
 * `/product/**` is served from the SSR cache (routeRules swr), so the HTML is shared between
 * all visitors: the server must not render anything that depends on the request. The country
 * therefore starts as DEFAULT_COUNTRY on server and client alike (no hydration mismatch) and is
 * resolved once after mount: cookie, then `/api/offer-country` (CF-IPCountry, never cached),
 * then the browser language.
 */
export const useOfferCountry = () => {
  const cookie = useCookie<string | null>('ane_country', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', path: '/' })
  const country = useState<string>('offer-country', () => DEFAULT_COUNTRY)
  const resolved = useState<boolean>('offer-country-resolved', () => false)

  onMounted(async () => {
    if (resolved.value) return
    resolved.value = true
    const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
    let header: string | null = null
    if (!normalizeCountryCode(cookie.value)) {
      header = await $fetch<{ country: string | null }>('/api/offer-country').then(r => r.country).catch(() => null)
    }
    country.value = detectCountry({ stored: cookie.value, header, languages })
  })

  function setCountry(code: string) {
    const normalized = normalizeCountryCode(code)
    if (!normalized) return
    country.value = normalized
    cookie.value = normalized
  }

  return { country, setCountry }
}
