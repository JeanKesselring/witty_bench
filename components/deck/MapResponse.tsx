'use client'

/* map_click_quiz — the response control, complete_modules.md Part 3 §8.
 *
 * This is a real slippy map: drag to pan, scroll or pinch to zoom, hover to
 * highlight, click to place or change a point. Kite's earlier ruling made it
 * a static SVG locator; the catalogue is the authority on interaction, so the
 * pan/zoom renderer is back and §9.3B's raster-map carve-out applies as
 * written — which is a real obligation, not a footnote:
 *
 *   · The map is `role="application"` and says so, with an instruction line
 *     that is read before it.
 *   · Keyboard users can pan/zoom and press Enter to place the point at the
 *     map centre. There is no duplicate labelled answer list.
 *   · Attribution stays present and clickable.
 *
 * Grading is distance-based with partial credit, mirroring the Module
 * Factory default: inside `NEAR_KM` is right, inside `PART_KM` is partial,
 * beyond it is wrong. The component reports the picked point; lib/grading
 * decides what it is worth.
 */

import { useEffect, useId, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ResponseProps } from './Responses'
import { distanceKm, NEAR_KM, PART_KM, parsePick } from '@/lib/modules/geo'

export function MapResponse({ item, value, onChange, judged }: ResponseProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const pickRef = useRef<L.CircleMarker | null>(null)
  const [ready, setReady] = useState(false)
  const howToId = useId()

  // Kept in a ref so the one-time map effect never closes over a stale
  // handler, without making the map itself depend on every render.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const judgedRef = useRef(judged)
  judgedRef.current = judged

  const targets = item.mapTargets ?? []
  const answer = targets.find((t) => t.label === item.answer) ?? targets[0]
  const picked = typeof value === 'string' ? parsePick(value) : null
  const pickedLat = picked?.lat
  const pickedLng = picked?.lng
  /* Map construction runs once. Everything after that mutates layers, which
   * is what Leaflet wants — tearing the map down on a value change would
   * throw away the learner's pan and zoom mid-answer. */
  useEffect(() => {
    const host = hostRef.current
    if (!host || mapRef.current) return

    const map = L.map(host, {
      center: [20, 10],
      zoom: host.clientWidth >= 768 ? 2 : 1,
      minZoom: 1,
      worldCopyJump: true,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    })

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.jpg',
      {
        attribution:
          'Tiles &copy; Esri — Sources: Esri, Garmin, GEBCO, NOAA NGDC, and other contributors',
        crossOrigin: true,
        maxNativeZoom: 10,
        maxZoom: 12,
      },
    ).addTo(map)

    // Click-to-zoom-in is Leaflet's default double-click; the single click
    // is ours and places the answer.
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (judgedRef.current !== null) return
      map.getContainer().dataset.picked = 'true'
      onChangeRef.current(`${e.latlng.lat.toFixed(4)},${e.latlng.lng.toFixed(4)}`)
    })

    mapRef.current = map
    setReady(true)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  /* The learner's pick. A square marker, because nothing in Kite is round
   * and because a square reads as "placed by you" against the circular
   * target rings. */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    pickRef.current?.remove()
    pickRef.current = null
    if (pickedLat === undefined || pickedLng === undefined) return
    pickRef.current = L.circleMarker([pickedLat, pickedLng], {
      radius: 7,
      weight: 2,
      color:
        judged?.outcome === 'correct' ? 'var(--ok-hover)' : judged ? 'var(--err-hover)' : '#f6f2ef',
      fillOpacity: 0.2,
      className: `k-maprsp__dot${
        judged?.outcome === 'correct' ? ' k-maprsp__dot--ok' : judged ? ' k-maprsp__dot--err' : ''
      }`,
    }).addTo(map)
  }, [pickedLat, pickedLng, ready, judged])

  /* After judgement the correct location appears without a label, and the
   * map fits both points so the error is visible rather than changing the
   * surrounding card geometry. */
  useEffect(() => {
    const map = mapRef.current
    if (!map || judged === null || !answer) return
    const target = L.circleMarker([answer.lat, answer.lng], {
      radius: 9,
      weight: 2,
      color: 'var(--ok-hover)',
      fillColor: 'var(--ok)',
      fillOpacity: 0.15,
      className: 'k-maprsp__target',
    }).addTo(map)
    const resultLayers: L.Layer[] = [target]

    if (pickedLat !== undefined && pickedLng !== undefined) {
      const line = L.polyline(
        [
          [pickedLat, pickedLng],
          [answer.lat, answer.lng],
        ],
        {
          color: 'var(--err-hover)',
          weight: 1,
          dashArray: '4 4',
          className: 'k-maprsp__miss',
        },
      ).addTo(map)
      resultLayers.push(line)
      map.fitBounds(L.latLngBounds([pickedLat, pickedLng], [answer.lat, answer.lng]).pad(0.4))
    } else {
      map.setView([answer.lat, answer.lng], 3)
    }
    return () => resultLayers.forEach((layer) => layer.remove())
  }, [judged, answer, pickedLat, pickedLng])

  const errorKm = judged !== null && picked && answer ? distanceKm(picked, answer) : null

  return (
    <div className="k-maprsp">
      <p className="k-sr" id={howToId}>
        Click the map to place your answer. With the keyboard, pan and zoom the map, then press
        Enter to place an answer at its centre. Press Escape to leave the map.
      </p>

      <div className="k-maprsp__stage">
        <div
          ref={hostRef}
          className="k-maprsp__map"
          role="application"
          aria-describedby={howToId}
          aria-label={`Map for ${item.prompt}`}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              hostRef.current?.blur()
            }
            if (event.key === 'Enter' && judged === null) {
              event.preventDefault()
              const centre = mapRef.current?.getCenter()
              if (centre) onChange(`${centre.lat.toFixed(4)},${centre.lng.toFixed(4)}`)
            }
          }}
        />

        {errorKm !== null && errorKm > NEAR_KM ? (
          <p
            className={`k-maprsp__toast${
              errorKm <= PART_KM ? ' k-maprsp__toast--near' : ' k-maprsp__toast--err'
            }`}
            aria-live="polite"
          >
            {`${Math.round(errorKm)} km from target${
              errorKm <= PART_KM ? ' · partial credit' : ''
            }`}
          </p>
        ) : null}
      </div>
    </div>
  )
}
