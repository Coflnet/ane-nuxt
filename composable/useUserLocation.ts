import { LAST_POSITION_KEY, parseStoredPosition, serializePosition, type StoredPosition } from '~/utils/geoPosition'

/**
 * Browser geolocation shared by the search page and the product page offers filter.
 * The last position is remembered in localStorage.
 */
export const useUserLocation = () => {
  function readLastPosition(): StoredPosition | null {
    try {
      return parseStoredPosition(localStorage.getItem(LAST_POSITION_KEY))
    }
    catch {
      return null
    }
  }

  function rememberPosition(position: StoredPosition) {
    try {
      localStorage.setItem(LAST_POSITION_KEY, serializePosition(position))
    }
    catch {
      // storage can be blocked, remembering is a convenience only
    }
  }

  /** Asks the browser for the current position and remembers it. Rejects when unavailable or denied. */
  function requestBrowserPosition(): Promise<StoredPosition> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('geolocation unavailable'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position = { lat: pos.coords.latitude, lon: pos.coords.longitude }
          rememberPosition(position)
          resolve(position)
        },
        err => reject(err),
        { enableHighAccuracy: false, timeout: 10000 },
      )
    })
  }

  return { readLastPosition, rememberPosition, requestBrowserPosition }
}
