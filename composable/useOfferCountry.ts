import { detectCountry, normalizeCountryCode, parseAcceptLanguage } from '~/utils/countryDetection'

/**
 * Country of the user for the offers filter. Detection order lives in utils/countryDetection.ts;
 * the user's own choice is stored in a cookie so SSR renders the same value. The detected value
 * is kept in useState so the client hydrates with what the server rendered (CF-IPCountry is not
 * available in the browser).
 */
export const useOfferCountry = () => {
  const cookie = useCookie<string | null>('ane_country', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', path: '/' })
  const country = useState<string>('offer-country', () => {
    if (import.meta.server) {
      const headers = useRequestHeaders(['cf-ipcountry', 'accept-language'])
      return detectCountry({
        stored: cookie.value,
        header: headers['cf-ipcountry'],
        languages: parseAcceptLanguage(headers['accept-language']),
      })
    }
    return detectCountry({ stored: cookie.value, languages: navigator.languages?.length ? navigator.languages : [navigator.language] })
  })

  function setCountry(code: string) {
    const normalized = normalizeCountryCode(code)
    if (!normalized) return
    country.value = normalized
    cookie.value = normalized
  }

  return { country, setCountry }
}
