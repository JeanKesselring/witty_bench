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
 *   · There is a NON-MAP path that scores identically. The candidate list
 *     below the map writes the same value, so a keyboard or screen-reader
 *     user answers the same question and gets the same grade — not a
 *     consolation route.
 *   · Attribution is present and clickable, because OSM's licence requires
 *     it and because the catalogue lists it as an interaction.
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

export function MapResponse({ item, value, onChange, judged, onCommit }: ResponseProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const pickRef = useRef<L.CircleMarker | null>(null)
  const [ready, setReady] = useState(false)
  const howToId = useId()

  // Kept in a ref so the one-time map effect never closes over a stale
  // handler, without making the map itself depend on every render.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const targets = item.mapTargets ?? []
  const answer = targets.find((t) => t.label === item.answer) ?? targets[0]
  const picked = typeof value === 'string' ? parsePick(value) : null
  const pickedLat = picked?.lat
  const pickedLng = picked?.lng
  const pickedLabel =
    typeof value === 'string' && !picked
      ? value
      : picked
        ? targets.find((t) => distanceKm(t, picked) < 1)?.label
        : undefined

  /* Map construction runs once. Everything after that mutates layers, which
   * is what Leaflet wants — tearing the map down on a value change would
   * throw away the learner's pan and zoom mid-answer. */
  useEffect(() => {
    const host = hostRef.current
    if (!host || mapRef.current) return

    const map = L.map(host, {
      center: [20, 10],
      zoom: 1,
      worldCopyJump: true,
      zoomControl: true,
      // The wheel belongs to the page until the map is deliberately entered:
      // a card that swallows scroll traps the learner on it (SC 2.1.2 in
      // spirit — this is a pointer trap rather than a keyboard one).
      scrollWheelZoom: false,
      attributionControl: true,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 12,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    // Click-to-zoom-in is Leaflet's default double-click; the single click
    // is ours and places the answer.
    map.on('click', (e: L.LeafletMouseEvent) => {
      map.getContainer().dataset.picked = 'true'
      onChangeRef.current(`${e.latlng.lat.toFixed(4)},${e.latlng.lng.toFixed(4)}`)
    })
    map.on('focus', () => map.scrollWheelZoom.enable())
    map.on('blur', () => map.scrollWheelZoom.disable())

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
      color: '#f6f2ef',
      fillOpacity: 0.2,
      className: 'k-maprsp__dot',
    }).addTo(map)
  }, [pickedLat, pickedLng, ready])

  /* After judgement the correct location appears with its label, and the
   * map fits both points so the error is visible rather than described. */
  useEffect(() => {
    const map = mapRef.current
    if (!map || judged === null || !answer) return
    const target = L.circleMarker([answer.lat, answer.lng], {
      radius: 9,
      weight: 2,
      color: '#5a9e59',
      fillOpacity: 0.15,
      className: 'k-maprsp__target',
    })
      .addTo(map)
      .bindTooltip(answer.label, { permanent: true, direction: 'top' })

    if (pickedLat !== undefined && pickedLng !== undefined) {
      L.polyline(
        [
          [pickedLat, pickedLng],
          [answer.lat, answer.lng],
        ],
        { color: '#e66b6b', weight: 1, dashArray: '4 4' },
      ).addTo(map)
      map.fitBounds(L.latLngBounds([pickedLat, pickedLng], [answer.lat, answer.lng]).pad(0.4))
    } else {
      map.setView([answer.lat, answer.lng], 3)
    }
    return () => void target.remove()
  }, [judged, answer, pickedLat, pickedLng])

  const errorKm = judged !== null && picked && answer ? distanceKm(picked, answer) : null

  return (
    <div className="k-maprsp">
      <p className="k-sr" id={howToId}>
        Click the map to place your answer, or choose from the list below — both are marked the same
        way. Press Escape to leave the map.
      </p>

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
        }}
      />

      {/* The equivalent path. Not a fallback: it writes the same value and
          is graded by the same rule (§9.3B). */}
      <div className="k-maprsp__list">
        <fieldset disabled={judged !== null}>
          <legend className="k-field__label">Places</legend>
          {targets.map((t) => {
            const isPick = pickedLabel === t.label
            const isAnswer = judged !== null && t.label === item.answer
            return (
              <button
                key={t.label}
                type="button"
                className={[
                  'k-option',
                  'k-press',
                  isAnswer ? 'k-option--ok' : '',
                  judged !== null && isPick && !isAnswer ? 'k-option--err' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={isPick}
                onClick={() => {
                  if (isPick) onCommit()
                  else onChange(`${t.lat},${t.lng}`)
                }}
              >
                {t.label}
              </button>
            )
          })}
        </fieldset>
      </div>

      {errorKm !== null ? (
        <p className="k-meta" aria-live="polite">
          {`You were ${Math.round(errorKm)} km from ${answer?.label}.`}
          {errorKm <= NEAR_KM
            ? ' Close enough — counted right.'
            : errorKm <= PART_KM
              ? ' Near enough for partial credit.'
              : ''}
        </p>
      ) : null}
    </div>
  )
}
