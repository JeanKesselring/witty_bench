'use client'

/* globe_pin — the geographic explorer.
 *
 * The catalogue's rich renderer, not the degraded one: drag to pan, scroll or
 * pinch to zoom, click a pin to open its label and description, Escape or an
 * outside click to close, and OSM attribution present and clickable.
 *
 * §9.3B's carve-out therefore applies, and its price is the pin list beside
 * the map. That list is not a courtesy — it holds every pin's label and
 * description, selecting in it selects on the map and vice versa, so the
 * content is fully available without ever touching the map. The map is the
 * orientation aid; the list is where the information lives.
 */

import { useEffect, useId, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Figure } from '@/lib/api/types'

export function Globe({ figure }: { figure: Extract<Figure, { kind: 'globe' }> }) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map())
  const [selected, setSelected] = useState<string | null>(null)
  const howToId = useId()

  const selectRef = useRef(setSelected)
  selectRef.current = setSelected

  useEffect(() => {
    const host = hostRef.current
    if (!host || mapRef.current) return
    const markers = markersRef.current

    const map = L.map(host, {
      center: [20, 0],
      zoom: 1,
      scrollWheelZoom: false,
      worldCopyJump: true,
    })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 12,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    // The wheel is the page's until the map is entered deliberately — a card
    // in a scrolling feed that eats the wheel is a trap.
    map.on('focus', () => map.scrollWheelZoom.enable())
    map.on('blur', () => map.scrollWheelZoom.disable())
    map.on('click', () => selectRef.current(null))

    for (const pin of figure.pins) {
      const marker = L.circleMarker([pin.lat, pin.lng], {
        radius: 7,
        weight: 2,
        color: '#f6f2ef',
        fillColor: '#5ba7ff',
        fillOpacity: 0.6,
        className: 'k-globe__pin',
      })
        .addTo(map)
        .bindTooltip(pin.label)
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        selectRef.current(pin.label)
      })
      markers.set(pin.label, marker)
    }

    for (const route of figure.routes ?? []) {
      L.polyline(
        route.points.map((p) => [p.lat, p.lng] as [number, number]),
        { color: '#8fa0b4', weight: 2, dashArray: '5 5' },
      )
        .addTo(map)
        .bindTooltip(route.label)
    }

    if (figure.pins.length > 0) {
      map.fitBounds(
        L.latLngBounds(figure.pins.map((p) => [p.lat, p.lng] as [number, number])).pad(0.5),
      )
    }

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markers.clear()
    }
  }, [figure])

  /* Selecting from either side does the same thing to the other: the list
   * pans the map, the map fills the list's detail. Two peers, one state. */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    for (const [label, marker] of markersRef.current) {
      marker.setStyle({
        fillOpacity: selected === null || selected === label ? 0.85 : 0.25,
        weight: selected === label ? 3 : 2,
      })
    }
    if (selected) {
      const pin = figure.pins.find((p) => p.label === selected)
      if (pin) map.panTo([pin.lat, pin.lng])
    }
  }, [selected, figure.pins])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const current = figure.pins.find((p) => p.label === selected)

  return (
    <div className="k-fig k-fig--globe">
      <p className="k-sr" id={howToId}>
        Drag to pan and use the zoom controls. Press Escape to leave the map, or use the complete
        place list below.
      </p>
      <div
        ref={hostRef}
        className="k-globe"
        role="application"
        aria-label="Map of the places in this module"
        aria-describedby={howToId}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            hostRef.current?.blur()
            setSelected(null)
          }
        }}
      />

      <ul className="k-globe__list">
        {figure.pins.map((pin) => (
          <li key={pin.label}>
            <button
              type="button"
              className="k-btn k-btn--quiet k-press"
              aria-pressed={selected === pin.label}
              data-current={selected === pin.label ? 'true' : undefined}
              onClick={() => setSelected((s) => (s === pin.label ? null : pin.label))}
            >
              <span>{pin.label}</span>
              <small className="k-meta">
                {pin.lat.toFixed(1)}°, {pin.lng.toFixed(1)}°
              </small>
            </button>
          </li>
        ))}
      </ul>

      {current?.description || figure.note ? (
        <p className="k-fig__note" aria-live="polite">
          {current?.description ?? figure.note}
        </p>
      ) : null}
    </div>
  )
}
