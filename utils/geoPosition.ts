/** Storage of the last known position ("Nearby" quick action remembers it). */

export const LAST_POSITION_KEY = 'ane_last_position'

export interface StoredPosition {
  lat: number
  lon: number
}

export function parseStoredPosition(raw: string | null | undefined): StoredPosition | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<StoredPosition>
    const { lat, lon } = value
    if (typeof lat !== 'number' || typeof lon !== 'number') return null
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
    return { lat, lon }
  }
  catch {
    return null
  }
}

export function serializePosition(position: StoredPosition): string {
  return JSON.stringify({ lat: position.lat, lon: position.lon })
}
