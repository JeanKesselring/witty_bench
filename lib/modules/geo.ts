/* Map geometry and its grading thresholds.
 *
 * Deliberately its own module with no Leaflet import. The frame needs
 * `distanceKm` to mark a map answer, and the map component needs it to draw
 * the error line — so if it lived beside the map, importing it would pull
 * Leaflet into the server render, where `window` does not exist and the whole
 * page 500s. It did exactly that once.
 */

export interface LatLng {
  lat: number
  lng: number
}

/** Right if within this; partial out to PART_KM. The Module Factory's
 *  default point tolerance, kept so a grade means the same thing in both. */
export const NEAR_KM = 150
export const PART_KM = 600

export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** The value the map control writes: `"lat,lng"`. Anything else is a label
 *  from the list path and is resolved against the target set instead. */
export function parsePick(value: string): LatLng | null {
  const [lat, lng] = value.split(',').map(Number)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}
