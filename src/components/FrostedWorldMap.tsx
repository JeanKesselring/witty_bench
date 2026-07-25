import { useEffect, useRef } from 'react'
import * as L from 'leaflet'

export type MapGuess = {
  correct: boolean
  latitude: number
  longitude: number
}

type FrostedWorldMapProps = {
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

export function FrostedWorldMap({ onGuess }: FrostedWorldMapProps) {
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
      center: [8, 0],
      maxBounds: [
        [-85, -190],
        [85, 190],
      ],
      maxBoundsViscosity: 0.65,
      minZoom: 1,
      maxZoom: 7,
      scrollWheelZoom: true,
      worldCopyJump: true,
      zoom: 1,
      zoomControl: false,
      zoomSnap: 0.5,
    })

    map.attributionControl.setPrefix(false)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      crossOrigin: true,
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const answerLine = L.polyline(ANDES, {
      className: 'map-andes-reveal',
      color: 'currentColor',
      interactive: false,
      opacity: 0,
      weight: 4,
    }).addTo(map)

    let guessMarker: L.CircleMarker | null = null

    const makeGuess = ({ latlng }: L.LeafletMouseEvent) => {
      const correct = isAndesGuess(latlng.lat, latlng.lng)
      guessMarker?.remove()
      answerLine.setStyle({ opacity: correct ? 0.92 : 0 })

      guessMarker = L.circleMarker(latlng, {
        className: `map-guess-pin map-guess-pin--${correct ? 'right' : 'wrong'}`,
        color: 'currentColor',
        fillColor: correct ? '#b3e18b' : '#f19a7e',
        fillOpacity: 1,
        radius: 8,
        weight: 1,
      })
        .addTo(map)
        .bindTooltip(correct ? 'Andes · found' : 'Try west', {
          className: 'map-guess-label',
          direction: 'top',
          offset: [0, -9],
          permanent: true,
        })
        .openTooltip()

      if (correct) map.flyToBounds(answerLine.getBounds().pad(0.24), { duration: 0.85 })

      onGuessRef.current({
        correct,
        latitude: latlng.lat,
        longitude: latlng.lng,
      })
    }

    map.on('click', makeGuess)
    const frame = requestAnimationFrame(() => map.invalidateSize())

    return () => {
      cancelAnimationFrame(frame)
      map.off('click', makeGuess)
      map.remove()
    }
  }, [])

  return (
    <>
      <svg className="map-filter-definitions" aria-hidden="true">
        <defs>
          <filter
            id="map-water-transparent"
            colorInterpolationFilters="sRGB"
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            <feColorMatrix
              in="SourceGraphic"
              result="redValue"
              values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0"
            />
            <feComponentTransfer in="redValue" result="redDifference">
              <feFuncR type="table" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1" />
            </feComponentTransfer>
            <feColorMatrix
              in="redDifference"
              result="redMask"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0"
            />

            <feColorMatrix
              in="SourceGraphic"
              result="greenValue"
              values="0 1 0 0 0  0 1 0 0 0  0 1 0 0 0  0 0 0 1 0"
            />
            <feComponentTransfer in="greenValue" result="greenDifference">
              <feFuncR type="table" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1" />
            </feComponentTransfer>
            <feColorMatrix
              in="greenDifference"
              result="greenMask"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0"
            />

            <feColorMatrix
              in="SourceGraphic"
              result="blueValue"
              values="0 0 1 0 0  0 0 1 0 0  0 0 1 0 0  0 0 0 1 0"
            />
            <feComponentTransfer in="blueValue" result="blueDifference">
              <feFuncR type="table" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1" />
            </feComponentTransfer>
            <feColorMatrix
              in="blueDifference"
              result="blueMask"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0"
            />

            <feBlend in="redMask" in2="greenMask" mode="screen" result="redGreenMask" />
            <feBlend in="redGreenMask" in2="blueMask" mode="screen" result="landMask" />
            <feComposite in="SourceGraphic" in2="landMask" operator="in" />
          </filter>
        </defs>
      </svg>
      <div
        ref={hostRef}
        className="frosted-world-map"
        role="application"
        aria-label="Interactive world map. Zoom or move the map, then click a location to find the Andes."
      />
    </>
  )
}
