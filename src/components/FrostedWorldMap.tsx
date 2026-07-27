import { useEffect, useRef } from 'react'
import * as L from 'leaflet'

export type MapGuess = {
  correct: boolean
  latitude: number
  longitude: number
  gridSizeKm: MapGridSizeKm
}

export type MapGridSizeKm = 10 | 50 | 100 | 300

type FrostedWorldMapProps = {
  gridSizeKm: MapGridSizeKm
  onGuess: (guess: MapGuess) => void
}

// A simplified spine of the Andes, used as an answer corridor rather than a
// visible hint. Leaflet supplies the map, projection, tiles, and interaction.
const ANDES: L.LatLngTuple[] = [
  [10.4, -72.8],
  [4.3, -75.7],
  [-1.2, -78.5],
  [-8.4, -77.2],
  [-15.8, -72.3],
  [-23.4, -68.3],
  [-31.4, -70.3],
  [-39.2, -71.7],
  [-47.1, -72.5],
  [-53.1, -71.5],
]

function distanceToSegment(
  latitude: number,
  longitude: number,
  start: L.LatLngTuple,
  end: L.LatLngTuple,
) {
  const x = longitude
  const y = latitude
  const x1 = start[1]
  const y1 = start[0]
  const x2 = end[1]
  const y2 = end[0]
  const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2
  const amount =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared),
        )
  const projectedX = x1 + amount * (x2 - x1)
  const projectedY = y1 + amount * (y2 - y1)
  return Math.hypot(x - projectedX, y - projectedY)
}

function isAndesGuess(latitude: number, longitude: number) {
  if (latitude < -57 || latitude > 14 || longitude < -84 || longitude > -60) return false

  return ANDES.slice(1).some(
    (point, index) =>
      distanceToSegment(latitude, longitude, ANDES[index], point) <= 7.5,
  )
}

function gridCellAt(latlng: L.LatLng, gridSizeKm: MapGridSizeKm) {
  const cellMeters = gridSizeKm * 1000
  const projected = L.CRS.EPSG3857.project(latlng)
  const west = Math.floor(projected.x / cellMeters) * cellMeters
  const south = Math.floor(projected.y / cellMeters) * cellMeters
  const southWest = L.CRS.EPSG3857.unproject(L.point(west, south))
  const northEast = L.CRS.EPSG3857.unproject(
    L.point(west + cellMeters, south + cellMeters),
  )
  const bounds = L.latLngBounds(southWest, northEast)

  return {
    bounds,
    center: bounds.getCenter(),
  }
}

export function FrostedWorldMap({ gridSizeKm, onGuess }: FrostedWorldMapProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const onGuessRef = useRef(onGuess)

  useEffect(() => {
    onGuessRef.current = onGuess
  }, [onGuess])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const map = L.map(host, {
      attributionControl: true,
      center: [-17, -68],
      maxBounds: [
        [-85, -190],
        [85, 190],
      ],
      maxBoundsViscosity: 0.65,
      minZoom: 2,
      maxZoom: 9,
      scrollWheelZoom: true,
      worldCopyJump: true,
      zoom: 3,
      zoomControl: false,
      zoomSnap: 0.5,
    })

    map.attributionControl.setPrefix(false)

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
      {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      crossOrigin: true,
      maxZoom: 19,
      subdomains: 'abcd',
      },
    ).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const answerLine = L.polyline(ANDES, {
      className: 'map-andes-reveal',
      color: 'currentColor',
      interactive: false,
      opacity: 0,
      weight: 4,
    }).addTo(map)

    let guessCell: L.Rectangle | null = null
    let previewCell: L.Rectangle | null = null
    let previewKey = ''

    const previewGuess = ({ latlng }: L.LeafletMouseEvent) => {
      const cell = gridCellAt(latlng, gridSizeKm)
      const key = [
        cell.bounds.getWest(),
        cell.bounds.getSouth(),
        cell.bounds.getEast(),
        cell.bounds.getNorth(),
      ].join(':')
      if (key === previewKey) return

      previewKey = key
      if (previewCell) {
        previewCell.setBounds(cell.bounds)
        return
      }

      previewCell = L.rectangle(cell.bounds, {
        className: 'map-cell-preview',
        color: 'currentColor',
        fillColor: 'currentColor',
        fillOpacity: 0.2,
        interactive: false,
        weight: 2,
      }).addTo(map)
    }

    const clearPreview = () => {
      previewCell?.remove()
      previewCell = null
      previewKey = ''
    }

    const makeGuess = ({ latlng }: L.LeafletMouseEvent) => {
      const cell = gridCellAt(latlng, gridSizeKm)
      const correct = isAndesGuess(cell.center.lat, cell.center.lng)
      guessCell?.remove()
      answerLine.setStyle({ opacity: correct ? 0.92 : 0 })

      guessCell = L.rectangle(cell.bounds, {
        className: `map-guess-cell map-guess-cell--${correct ? 'right' : 'wrong'}`,
        color: 'currentColor',
        fillColor: 'currentColor',
        fillOpacity: 0.86,
        interactive: false,
        weight: 3,
      }).addTo(map)

      if (correct) map.flyToBounds(answerLine.getBounds().pad(0.24), { duration: 0.85 })

      onGuessRef.current({
        correct,
        gridSizeKm,
        latitude: cell.center.lat,
        longitude: cell.center.lng,
      })
    }

    map.on('click', makeGuess)
    map.on('mousemove', previewGuess)
    host.addEventListener('mouseleave', clearPreview)
    const frame = requestAnimationFrame(() => map.invalidateSize())

    return () => {
      cancelAnimationFrame(frame)
      map.off('click', makeGuess)
      map.off('mousemove', previewGuess)
      host.removeEventListener('mouseleave', clearPreview)
      map.remove()
    }
  }, [gridSizeKm])

  return (
    <div
      ref={hostRef}
      className="frosted-world-map"
      role="application"
      aria-label={`Interactive label-free world map with ${gridSizeKm} kilometer cells. Zoom or move the map, then choose a square to find the Andes.`}
    />
  )
}
