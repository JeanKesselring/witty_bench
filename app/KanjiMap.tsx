'use client'

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { GRAPH_KANJI } from './data/japanese-knowledge-graph'
import { KANGXI_RADICALS } from './data/radicals'
import { loadKanjiCanvas } from './kanji-canvas'
import styles from './kanji-map.module.css'

type Mastery = 'known' | 'learning' | 'unknown'
type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
type Camera = { x: number; y: number; zoom: number }

type Radical = {
  number: number
  glyph: string
  label: string
  meaning: string
}

type Kanji = {
  glyph: string
  meaning: string
  on: string
  kun: string
  strokes: number
  radical: Radical
  mastery: Mastery
  level: JlptLevel
  components: readonly string[]
  radicalNumbers: readonly number[]
}

const masteryLabels: Record<Mastery, string> = {
  known: 'Known',
  learning: 'Learning',
  unknown: 'New',
}

const hashGlyph = (glyph: string) => glyph.codePointAt(0) ?? 0
const JLPT_LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

const RADICALS: Radical[] = KANGXI_RADICALS.map(([number, glyph, label, meaning]) => ({
  number,
  glyph,
  label,
  meaning,
}))
const RADICAL_BY_NUMBER = new Map(RADICALS.map((radical) => [radical.number, radical]))

const allKanji: Kanji[] = GRAPH_KANJI.map(
  ([glyph, radicalNumber, strokes, jlpt, meaning, on, kun, components, radicalNumbers]) => {
    const radical = RADICAL_BY_NUMBER.get(radicalNumber)
    if (!radical) throw new Error(`Missing radical ${radicalNumber} for ${glyph}`)
    const bucket = hashGlyph(glyph) % 10
    return {
      glyph,
      meaning,
      on: on || '—',
      kun: kun || '—',
      strokes,
      radical,
      mastery: bucket < 3 ? 'known' : bucket < 7 ? 'learning' : 'unknown',
      level: `N${jlpt}` as JlptLevel,
      components,
      radicalNumbers,
    }
  },
)
const KANJI_BY_GLYPH = new Map(allKanji.map((kanji) => [kanji.glyph, kanji]))
const ATLAS_KANJI_COUNT = allKanji.length

const CELL = 64

type Cell =
  { kind: 'radical'; radical: Radical; key: string } | { kind: 'kanji'; kanji: Kanji; key: string }

type MapProjection = {
  cells: Cell[]
  kanji: Kanji[]
  radicals: Radical[]
  columns: number
  rows: number
  width: number
  height: number
}

function buildProjection(selectedLevels: ReadonlySet<JlptLevel>): MapProjection {
  const visibleKanji = selectedLevels.size
    ? allKanji.filter((kanji) => selectedLevels.has(kanji.level))
    : allKanji
  const visibleRadicals = selectedLevels.size
    ? RADICALS.filter((radical) => visibleKanji.some((kanji) => kanji.radical === radical))
    : RADICALS
  const baseCellCount = visibleKanji.length + visibleRadicals.length
  const columns = Math.max(10, Math.min(50, Math.ceil(Math.sqrt(baseCellCount * 1.14))))
  const rows = Math.ceil(baseCellCount / columns)
  const extraSlots = columns * rows - baseCellCount
  const secondaryPlacements = visibleRadicals.flatMap((radical) =>
    visibleKanji
      .filter((kanji) => kanji.radical !== radical && kanji.radicalNumbers.includes(radical.number))
      .map((kanji) => ({ radical, kanji })),
  )
  const extraByRadical = new Map<number, Kanji[]>()
  for (let index = 0; index < extraSlots; index += 1) {
    const placementIndex = Math.floor((index * secondaryPlacements.length) / extraSlots)
    const placement = secondaryPlacements[placementIndex]
    if (!placement) throw new Error('Not enough component memberships to fill the map')
    const family = extraByRadical.get(placement.radical.number) ?? []
    if (!family.some((kanji) => kanji.glyph === placement.kanji.glyph)) {
      family.push(placement.kanji)
      extraByRadical.set(placement.radical.number, family)
    }
  }

  const orderedCells: Cell[] = []
  for (const radical of visibleRadicals) {
    orderedCells.push({ kind: 'radical', radical, key: `r-${radical.number}` })
    const family = visibleKanji
      .filter((kanji) => kanji.radical === radical)
      .sort(
        (left, right) =>
          Number(right.level.slice(1)) - Number(left.level.slice(1)) ||
          left.strokes - right.strokes ||
          left.glyph.localeCompare(right.glyph, 'ja'),
      )
    for (const secondary of extraByRadical.get(radical.number) ?? []) {
      if (!family.includes(secondary)) family.push(secondary)
    }
    for (const kanji of family) {
      orderedCells.push({
        kind: 'kanji',
        kanji,
        key: `k-${radical.number}-${kanji.glyph}`,
      })
    }
  }

  const placedGlyphs = new Set(
    orderedCells
      .filter((cell): cell is Extract<Cell, { kind: 'kanji' }> => cell.kind === 'kanji')
      .map((cell) => cell.kanji.glyph),
  )
  if (
    orderedCells.length !== columns * rows ||
    !visibleKanji.every((kanji) => placedGlyphs.has(kanji.glyph))
  ) {
    throw new Error(`Atlas grid mismatch: ${orderedCells.length} cells for ${columns * rows} slots`)
  }

  const cells = new Array<Cell>(orderedCells.length)
  orderedCells.forEach((cell, orderIndex) => {
    const row = Math.floor(orderIndex / columns)
    const column = orderIndex % columns
    const serpentineColumn = row % 2 === 0 ? column : columns - 1 - column
    cells[row * columns + serpentineColumn] = cell
  })
  return {
    cells,
    kanji: visibleKanji,
    radicals: visibleRadicals,
    columns,
    rows,
    width: columns * CELL,
    height: rows * CELL,
  }
}

const DRAW_CANVAS_ID = 'kanji-map-drawing'
const DRAW_SIDE = 400
const MAX_DRAW_CANDIDATES = 10

function DrawingSearch({
  onSelect,
  onClose,
}: {
  onSelect: (kanji: Kanji) => void
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const initializedRef = useRef(false)
  const recognizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [results, setResults] = useState<Kanji[]>([])
  const [ready, setReady] = useState(false)
  const [hasInk, setHasInk] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'reading' | 'failed'>('loading')
  const statusId = useId()

  const strokeCount = () => {
    const pattern = window.KanjiCanvas?.[`recordedPattern_${DRAW_CANVAS_ID}`]
    return Array.isArray(pattern) ? pattern.length : 0
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    const renderedSide = Math.round(canvas.getBoundingClientRect().width)
    canvas.width = renderedSide
    canvas.height = renderedSide

    loadKanjiCanvas()
      .then(() => {
        if (cancelled || !window.KanjiCanvas) return
        if (!initializedRef.current) {
          window.KanjiCanvas.init(DRAW_CANVAS_ID)
          initializedRef.current = true
        }
        setReady(true)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('failed')
      })

    return () => {
      cancelled = true
      if (recognizeTimerRef.current) clearTimeout(recognizeTimerRef.current)
    }
  }, [])

  const recognize = () => {
    if (!window.KanjiCanvas || strokeCount() === 0) {
      setResults([])
      setHasInk(false)
      setStatus('ready')
      return
    }
    setHasInk(true)
    setStatus('reading')
    recognizeTimerRef.current = setTimeout(() => {
      if (strokeCount() === 0) {
        setResults([])
        setHasInk(false)
        setStatus('ready')
        return
      }
      const candidates = (window.KanjiCanvas?.recognize(DRAW_CANVAS_ID) ?? '')
        .trim()
        .split(/\s+/)
        .map((glyph) => KANJI_BY_GLYPH.get(glyph))
        .filter((kanji): kanji is Kanji => Boolean(kanji))
        .slice(0, MAX_DRAW_CANDIDATES)
      setResults(candidates)
      setStatus('ready')
    }, 40)
  }

  return (
    <>
      <button
        className={`${styles.modalBackdrop} ${styles.drawBackdrop}`}
        onClick={onClose}
        aria-label="Close drawing search"
      />
      <section
        className={styles.drawPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawing-search-title"
        aria-busy={status === 'loading' || status === 'reading'}
      >
        <div className={styles.drawHead}>
          <div>
            <span className={styles.eyebrow}>Handwriting search</span>
            <h2 id="drawing-search-title">Draw a kanji</h2>
            <p>Use natural stroke order for the strongest matches.</p>
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Close drawing search">
            <CloseIcon />
          </button>
        </div>
        <canvas
          id={DRAW_CANVAS_ID}
          ref={canvasRef}
          width={DRAW_SIDE}
          height={DRAW_SIDE}
          className={styles.drawCanvas}
          data-stroke-numbers="false"
          aria-describedby={statusId}
          aria-label="Draw a kanji to search the map"
          onPointerUp={() => {
            if (recognizeTimerRef.current) clearTimeout(recognizeTimerRef.current)
            recognizeTimerRef.current = setTimeout(recognize, 220)
          }}
          onPointerLeave={() => {
            if (recognizeTimerRef.current) clearTimeout(recognizeTimerRef.current)
            recognizeTimerRef.current = setTimeout(recognize, 220)
          }}
        />
        <div className={styles.drawActions}>
          <button
            type="button"
            disabled={!ready || !hasInk}
            onClick={() => {
              window.KanjiCanvas?.deleteLast(DRAW_CANVAS_ID)
              recognize()
            }}
          >
            Undo stroke
          </button>
          <button
            type="button"
            disabled={!ready || !hasInk}
            onClick={() => {
              if (recognizeTimerRef.current) clearTimeout(recognizeTimerRef.current)
              window.KanjiCanvas?.erase(DRAW_CANVAS_ID)
              setHasInk(false)
              setResults([])
              setStatus('ready')
            }}
          >
            Clear
          </button>
        </div>
        <p id={statusId} className={styles.drawStatus} aria-live="polite">
          {status === 'loading'
            ? 'Loading handwriting engine…'
            : status === 'failed'
              ? 'The handwriting engine could not be loaded.'
              : status === 'reading'
                ? 'Comparing stroke shape and order…'
                : results.length
                  ? `${results.length} closest matches`
                  : hasInk
                    ? 'No map match yet — add the next stroke'
                    : 'Draw one stroke at a time'}
        </p>
        <div className={styles.drawResults}>
          {results.map((kanji) => (
            <button
              key={kanji.glyph}
              onClick={() => {
                onSelect(kanji)
                onClose()
              }}
            >
              <span lang="ja">{kanji.glyph}</span>
              <small>{kanji.meaning.split(' / ')[0]}</small>
              <em>{kanji.level}</em>
            </button>
          ))}
        </div>
        <p className={styles.recognizerCredit}>
          Recognition by{' '}
          <a href="http://github.com/asdfjkl/kanjicanvas" target="_blank" rel="noreferrer">
            KanjiCanvas
          </a>
        </p>
      </section>
    </>
  )
}

function AnimatedStrokeOrder({
  glyph,
  declaredStrokes,
}: {
  glyph: string
  declaredStrokes?: number
}) {
  const [paths, setPaths] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [replay, setReplay] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setPaths([])
    import('./data/kanji-strokes')
      .then(({ KANJI_STROKES }) => {
        if (cancelled) return
        setPaths([...(KANJI_STROKES[glyph] ?? [])])
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [glyph])

  return (
    <div className={styles.strokeAnimation}>
      <svg
        key={`${glyph}-${replay}`}
        viewBox="0 0 109 109"
        role="img"
        aria-label={`Animated stroke order for ${glyph}`}
      >
        <path className={styles.strokeGuide} d="M54.5 5V104M5 54.5H104" />
        {paths.map((path, index) => (
          <path
            key={`${replay}-${index}`}
            className={styles.animatedStroke}
            d={path}
            pathLength={1}
            style={{ animationDelay: `${index * 500}ms` }}
          />
        ))}
        {!loading && !paths.length ? (
          <text x="54.5" y="68" textAnchor="middle" className={styles.strokeFallback}>
            {glyph}
          </text>
        ) : null}
      </svg>
      <div className={styles.strokePlayback}>
        <span>
          {loading
            ? 'Loading stroke paths…'
            : paths.length
              ? `${paths.length} strokes`
              : declaredStrokes
                ? `${declaredStrokes} strokes · static fallback`
                : 'Static fallback'}
          <a href="https://kanjivg.tagaini.net/" target="_blank" rel="noreferrer">
            KanjiVG
          </a>
        </span>
        <button onClick={() => setReplay((value) => value + 1)} disabled={!paths.length}>
          Replay
        </button>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  )
}

function HandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 11V6.5a1.5 1.5 0 0 1 3 0V11 4.5a1.5 1.5 0 0 1 3 0V11 6a1.5 1.5 0 0 1 3 0v6-3.5a1.5 1.5 0 0 1 3 0V15c0 4-2.5 7-7 7h-1.2c-2 0-3.5-.8-4.7-2.3L3.5 15a1.7 1.7 0 0 1 2.6-2.2L8 15.1" />
    </svg>
  )
}

function DrawIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
      <path d="m13.5 7.5 3 3M4 20h6" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h10M20 7h-2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  )
}

const RadicalMapTile = memo(function RadicalMapTile({
  radical,
  active,
  onSelect,
}: {
  radical: Radical
  active: boolean
  onSelect: (radical: Radical) => void
}) {
  return (
    <button
      className={`${styles.tile} ${styles.radicalTile} ${active ? styles.radicalActive : ''}`}
      onClick={() => onSelect(radical)}
      aria-label={`${radical.meaning} radical`}
    >
      <span className={styles.radicalGlyph} lang="ja">
        {radical.glyph}
      </span>
      <small>{radical.meaning}</small>
      <em>RADICAL</em>
    </button>
  )
})

const KanjiMapTile = memo(function KanjiMapTile({
  kanji,
  status,
  dimmed,
  selected,
  onSelect,
}: {
  kanji: Kanji
  status: Mastery
  dimmed: boolean
  selected: boolean
  onSelect: (kanji: Kanji) => void
}) {
  return (
    <button
      className={`${styles.tile} ${styles.kanjiTile} ${styles[status]} ${
        dimmed ? styles.dimmed : ''
      } ${selected ? styles.selected : ''}`}
      onClick={() => onSelect(kanji)}
      aria-label={`${kanji.glyph}, ${kanji.meaning}, ${kanji.level}, ${masteryLabels[status]}`}
    >
      <span lang="ja">{kanji.glyph}</span>
      <small>{kanji.meaning.split(' / ')[0]}</small>
    </button>
  )
})

export function KanjiMap() {
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null)
  const [selectedRadical, setSelectedRadical] = useState<Radical | null>(null)
  const [query, setQuery] = useState('')
  const [mastery, setMastery] = useState<Record<string, Mastery>>({})
  const [showDrawSearch, setShowDrawSearch] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedLevels, setSelectedLevels] = useState<JlptLevel[]>([])
  const viewportRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const coordinateRef = useRef<HTMLElement>(null)
  const zoomLabelRef = useRef<HTMLSpanElement>(null)
  const cameraRef = useRef<Camera>({ x: 0, y: 0, zoom: 1 })
  const targetCameraRef = useRef<Camera>({ x: 0, y: 0, zoom: 1 })
  const writeFrameRef = useRef<number | null>(null)
  const motionFrameRef = useRef<number | null>(null)
  const motionTimeRef = useRef(0)
  const velocityRef = useRef({ x: 0, y: 0, time: 0 })
  const pendingFocusGlyphRef = useRef<string | null>(null)
  const gesturePointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{
    distance: number
    zoom: number
    mapX: number
    mapY: number
  } | null>(null)
  const pointerRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    moved: false,
    active: false,
  })
  const selectedLevelSet = useMemo(() => new Set(selectedLevels), [selectedLevels])
  const projection = useMemo(() => buildProjection(selectedLevelSet), [selectedLevelSet])

  useEffect(() => {
    const closePanels = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setShowDrawSearch(false)
      setShowSettings(false)
      setSelectedKanji(null)
      setSelectedRadical(null)
    }
    window.addEventListener('keydown', closePanels)
    return () => window.removeEventListener('keydown', closePanels)
  }, [])

  const toggleLevel = (level: JlptLevel) => {
    setSelectedLevels((current) => {
      const next = current.includes(level)
        ? current.filter((item) => item !== level)
        : [...current, level]
      return next.length === JLPT_LEVELS.length ? [] : next
    })
  }

  const hideHint = useCallback(() => {
    hintRef.current?.setAttribute('hidden', '')
  }, [])

  const clampCamera = useCallback(
    (next: Camera): Camera => {
      const width = window.innerWidth
      const height = window.innerHeight
      const margin = 120
      return {
        x: Math.min(margin, Math.max(width - projection.width * next.zoom - margin, next.x)),
        y: Math.min(margin, Math.max(height - projection.height * next.zoom - margin, next.y)),
        zoom: next.zoom,
      }
    },
    [projection.height, projection.width],
  )

  const writeCamera = useCallback(() => {
    const camera = cameraRef.current
    if (mapRef.current) {
      mapRef.current.style.transform = `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`
    }
    if (zoomLabelRef.current) {
      zoomLabelRef.current.textContent = `${Math.round(camera.zoom * 100)}%`
    }
    if (coordinateRef.current) {
      coordinateRef.current.textContent = `${Math.round(-camera.x / (CELL * camera.zoom))}.${Math.round(-camera.y / (CELL * camera.zoom))}`
    }
  }, [])

  const stopMotion = useCallback(() => {
    if (motionFrameRef.current !== null) {
      window.cancelAnimationFrame(motionFrameRef.current)
      motionFrameRef.current = null
    }
  }, [])

  const scheduleCameraWrite = useCallback(() => {
    if (writeFrameRef.current !== null) return
    writeFrameRef.current = window.requestAnimationFrame(() => {
      writeFrameRef.current = null
      writeCamera()
    })
  }, [writeCamera])

  const setCameraDirect = useCallback(
    (next: Camera) => {
      stopMotion()
      const clamped = clampCamera(next)
      cameraRef.current = clamped
      targetCameraRef.current = clamped
      scheduleCameraWrite()
    },
    [clampCamera, scheduleCameraWrite, stopMotion],
  )

  const animateCameraTo = useCallback(
    (next: Camera) => {
      targetCameraRef.current = clampCamera(next)
      if (motionFrameRef.current !== null) return
      motionTimeRef.current = performance.now()

      const tick = (time: number) => {
        const elapsed = Math.min(40, time - motionTimeRef.current)
        motionTimeRef.current = time
        const ease = 1 - Math.exp(-elapsed * 0.018)
        const current = cameraRef.current
        const target = targetCameraRef.current
        const updated = {
          x: current.x + (target.x - current.x) * ease,
          y: current.y + (target.y - current.y) * ease,
          zoom: current.zoom + (target.zoom - current.zoom) * ease,
        }
        const settled =
          Math.abs(target.x - updated.x) < 0.15 &&
          Math.abs(target.y - updated.y) < 0.15 &&
          Math.abs(target.zoom - updated.zoom) < 0.0005
        cameraRef.current = settled ? target : updated
        writeCamera()
        if (settled) {
          motionFrameRef.current = null
        } else {
          motionFrameRef.current = window.requestAnimationFrame(tick)
        }
      }

      motionFrameRef.current = window.requestAnimationFrame(tick)
    },
    [clampCamera, writeCamera],
  )

  const resetView = useCallback(
    (requestedZoom?: number) => {
      const availableWidth = Math.max(320, window.innerWidth - 144)
      const availableHeight = Math.max(320, window.innerHeight - 144)
      const fittedZoom = Math.max(
        0.5,
        Math.min(1.15, availableWidth / projection.width, availableHeight / projection.height),
      )
      const nextZoom = requestedZoom ?? fittedZoom
      setCameraDirect({
        x: (window.innerWidth - projection.width * nextZoom) / 2,
        y: (window.innerHeight - projection.height * nextZoom) / 2 + 32,
        zoom: nextZoom,
      })
    },
    [projection.height, projection.width, setCameraDirect],
  )

  useEffect(() => {
    resetView()
    return () => {
      stopMotion()
      if (writeFrameRef.current !== null) window.cancelAnimationFrame(writeFrameRef.current)
    }
  }, [resetView, stopMotion])

  useEffect(() => {
    const onResize = () => setCameraDirect(clampCamera(cameraRef.current))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clampCamera, setCameraDirect])

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedKanji(null)
        setSelectedRadical(null)
        setShowDrawSearch(false)
        setShowSettings(false)
        setQuery('')
      }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      hideHint()
      if (event.ctrlKey || event.metaKey) {
        const base = targetCameraRef.current
        const nextZoom = Math.max(0.5, Math.min(2, base.zoom - event.deltaY * 0.002))
        const ratio = nextZoom / base.zoom
        animateCameraTo({
          x: event.clientX - (event.clientX - base.x) * ratio,
          y: event.clientY - (event.clientY - base.y) * ratio,
          zoom: nextZoom,
        })
        return
      }
      const base = targetCameraRef.current
      animateCameraTo({
        x: base.x - event.deltaX,
        y: base.y - event.deltaY,
        zoom: base.zoom,
      })
    }
    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [animateCameraTo, hideHint])

  const setZoomAroundPoint = (next: number, centerX: number, centerY: number) => {
    const clamped = Math.max(0.5, Math.min(2, Number(next.toFixed(2))))
    const base = targetCameraRef.current
    const ratio = clamped / base.zoom
    animateCameraTo({
      x: centerX - (centerX - base.x) * ratio,
      y: centerY - (centerY - base.y) * ratio,
      zoom: clamped,
    })
  }

  const setZoomAroundCenter = (next: number) =>
    setZoomAroundPoint(next, window.innerWidth / 2, window.innerHeight / 2)

  const searchResult = useMemo(() => {
    const clean = query.trim().toLowerCase()
    if (!clean) return null
    return allKanji.find(
      (kanji) =>
        kanji.glyph === clean ||
        kanji.meaning.toLowerCase().includes(clean) ||
        kanji.on.toLowerCase().includes(clean) ||
        kanji.kun.toLowerCase().includes(clean),
    )
  }, [query])

  const focusGlyph = useCallback(
    (glyph: string) => {
      const index = projection.cells.findIndex(
        (cell) => cell.kind === 'kanji' && cell.kanji.glyph === glyph,
      )
      if (index < 0) return false
      const x = (index % projection.columns) * CELL + CELL / 2
      const y = Math.floor(index / projection.columns) * CELL + CELL / 2
      const currentZoom = cameraRef.current.zoom
      animateCameraTo({
        x: window.innerWidth / 2 - x * currentZoom,
        y: window.innerHeight / 2 - y * currentZoom,
        zoom: currentZoom,
      })
      return true
    },
    [animateCameraTo, projection.cells, projection.columns],
  )

  useEffect(() => {
    const pending = pendingFocusGlyphRef.current
    if (!pending) return
    const frame = window.requestAnimationFrame(() => {
      if (focusGlyph(pending)) pendingFocusGlyphRef.current = null
    })
    return () => window.cancelAnimationFrame(frame)
  }, [focusGlyph])

  useEffect(() => {
    if (selectedKanji && selectedLevelSet.size && !selectedLevelSet.has(selectedKanji.level)) {
      setSelectedKanji(null)
    }
    if (
      selectedRadical &&
      !projection.kanji.some((kanji) => kanji.radicalNumbers.includes(selectedRadical.number))
    ) {
      setSelectedRadical(null)
    }
  }, [projection.kanji, selectedKanji, selectedLevelSet, selectedRadical])

  const revealKanji = useCallback(
    (kanji: Kanji) => {
      setSelectedRadical(null)
      setSelectedKanji(kanji)
      if (selectedLevelSet.size && !selectedLevelSet.has(kanji.level)) {
        pendingFocusGlyphRef.current = kanji.glyph
        setSelectedLevels((current) =>
          current.includes(kanji.level) ? current : [...current, kanji.level],
        )
        return
      }
      focusGlyph(kanji.glyph)
    },
    [focusGlyph, selectedLevelSet],
  )

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    if (!searchResult) return
    revealKanji(searchResult)
  }

  const selectKanji = useCallback((kanji: Kanji) => {
    if (pointerRef.current.moved) return
    setSelectedRadical(null)
    setSelectedKanji(kanji)
  }, [])

  const selectRadical = useCallback((radical: Radical) => {
    if (pointerRef.current.moved) return
    setSelectedKanji(null)
    setSelectedRadical((current) => (current === radical ? null : radical))
  }, [])

  const setKanjiMastery = (next: Mastery) => {
    if (!selectedKanji) return
    setMastery((state) => ({ ...state, [selectedKanji.glyph]: next }))
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    gesturePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (gesturePointers.current.size === 2) {
      const [first, second] = [...gesturePointers.current.values()]
      const midpointX = (first.x + second.x) / 2
      const midpointY = (first.y + second.y) / 2
      pinchRef.current = {
        distance: Math.hypot(second.x - first.x, second.y - first.y),
        zoom: cameraRef.current.zoom,
        mapX: (midpointX - cameraRef.current.x) / cameraRef.current.zoom,
        mapY: (midpointY - cameraRef.current.y) / cameraRef.current.zoom,
      }
      pointerRef.current.moved = true
      viewportRef.current?.classList.add(styles.dragging)
      hideHint()
      for (const pointerId of gesturePointers.current.keys()) {
        if (!viewportRef.current?.hasPointerCapture(pointerId)) {
          viewportRef.current?.setPointerCapture(pointerId)
        }
      }
      return
    }

    pointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      active: true,
    }
    velocityRef.current = { x: 0, y: 0, time: performance.now() }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (gesturePointers.current.has(event.pointerId)) {
      gesturePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    }

    if (gesturePointers.current.size === 2 && pinchRef.current) {
      const [first, second] = [...gesturePointers.current.values()]
      const distance = Math.hypot(second.x - first.x, second.y - first.y)
      const midpointX = (first.x + second.x) / 2
      const midpointY = (first.y + second.y) / 2
      const nextZoom = Math.max(
        0.5,
        Math.min(2, pinchRef.current.zoom * (distance / pinchRef.current.distance)),
      )
      setCameraDirect({
        x: midpointX - pinchRef.current.mapX * nextZoom,
        y: midpointY - pinchRef.current.mapY * nextZoom,
        zoom: nextZoom,
      })
      return
    }

    if (!pointerRef.current.active || pointerRef.current.pointerId !== event.pointerId) return

    const distance =
      Math.abs(event.clientX - pointerRef.current.startX) +
      Math.abs(event.clientY - pointerRef.current.startY)

    if (!pointerRef.current.moved && distance < 6) return

    if (!pointerRef.current.moved) {
      pointerRef.current.moved = true
      viewportRef.current?.setPointerCapture(event.pointerId)
      viewportRef.current?.classList.add(styles.dragging)
      hideHint()
    }

    const dx = event.clientX - pointerRef.current.x
    const dy = event.clientY - pointerRef.current.y
    pointerRef.current.x = event.clientX
    pointerRef.current.y = event.clientY
    const now = performance.now()
    const elapsed = Math.max(1, now - velocityRef.current.time)
    velocityRef.current = {
      x: velocityRef.current.x * 0.65 + (dx / elapsed) * 0.35,
      y: velocityRef.current.y * 0.65 + (dy / elapsed) * 0.35,
      time: now,
    }
    setCameraDirect({
      x: cameraRef.current.x + dx,
      y: cameraRef.current.y + dy,
      zoom: cameraRef.current.zoom,
    })
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    gesturePointers.current.delete(event.pointerId)
    if (gesturePointers.current.size < 2) pinchRef.current = null
    if (viewportRef.current?.hasPointerCapture(event.pointerId)) {
      viewportRef.current.releasePointerCapture(event.pointerId)
    }
    if (gesturePointers.current.size === 1) {
      const [pointerId, point] = [...gesturePointers.current.entries()][0]
      pointerRef.current = {
        pointerId,
        startX: point.x,
        startY: point.y,
        x: point.x,
        y: point.y,
        moved: true,
        active: true,
      }
      return
    }
    pointerRef.current.active = false
    viewportRef.current?.classList.remove(styles.dragging)
    const velocity = velocityRef.current
    if (pointerRef.current.moved && Math.hypot(velocity.x, velocity.y) > 0.04) {
      animateCameraTo({
        x: cameraRef.current.x + velocity.x * 180,
        y: cameraRef.current.y + velocity.y * 180,
        zoom: cameraRef.current.zoom,
      })
    }
    window.setTimeout(() => {
      pointerRef.current.moved = false
    }, 0)
  }

  const activeMastery = selectedKanji
    ? (mastery[selectedKanji.glyph] ?? selectedKanji.mastery)
    : null
  const selectedFamily = useMemo(
    () =>
      selectedRadical
        ? projection.kanji
            .filter((kanji) => kanji.radicalNumbers.includes(selectedRadical.number))
            .sort(
              (left, right) =>
                Number(right.level.slice(1)) - Number(left.level.slice(1)) ||
                left.strokes - right.strokes ||
                left.glyph.localeCompare(right.glyph, 'ja'),
            )
        : [],
    [projection.kanji, selectedRadical],
  )
  const selectedMeanings = selectedKanji?.meaning.split(' / ') ?? []

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.seal}>漢</div>
          <div>
            <strong>Kanji Map</strong>
            <span>漢字図 · Radical atlas</span>
          </div>
        </div>

        <div className={styles.searchCluster}>
          <form className={styles.search} onSubmit={submitSearch}>
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search kanji, reading, or meaning"
              aria-label="Search the kanji map"
            />
            <kbd>↵</kbd>
            {query && (
              <div className={styles.searchPreview}>
                {searchResult ? (
                  <>
                    <span>{searchResult.glyph}</span>
                    <div>
                      <strong>{searchResult.meaning}</strong>
                      <small>
                        {searchResult.level}
                        {selectedLevelSet.size && !selectedLevelSet.has(searchResult.level)
                          ? ' · adds this level to the map'
                          : ` · ${searchResult.radicalNumbers.length} component ${
                              searchResult.radicalNumbers.length === 1 ? 'family' : 'families'
                            }`}
                      </small>
                    </div>
                  </>
                ) : (
                  <p>No kanji found in this map.</p>
                )}
              </div>
            )}
          </form>
          <button
            className={styles.drawTrigger}
            onClick={() => setShowDrawSearch((visible) => !visible)}
            aria-pressed={showDrawSearch}
            aria-label="Search by drawing"
          >
            <DrawIcon />
            <span>Draw</span>
          </button>
        </div>

        <div className={styles.legend} aria-label="Mastery legend">
          {(['known', 'learning', 'unknown'] as Mastery[]).map((item) => (
            <span key={item}>
              <i className={styles[item]} />
              {masteryLabels[item]}
            </span>
          ))}
          <button
            className={styles.settingsTrigger}
            onClick={() => setShowSettings((visible) => !visible)}
            aria-pressed={showSettings}
            aria-label={`Map scope: ${
              selectedLevels.length ? selectedLevels.join(', ') : 'all levels'
            }`}
          >
            <SettingsIcon />
            <span className={styles.scopeBadge}>
              {selectedLevels.length === 1 ? selectedLevels[0] : selectedLevels.length || 'All'}
            </span>
          </button>
        </div>
      </header>

      {showDrawSearch ? (
        <DrawingSearch onClose={() => setShowDrawSearch(false)} onSelect={revealKanji} />
      ) : null}

      {showSettings ? (
        <section className={styles.settingsPanel} aria-label="Map settings">
          <div className={styles.settingsHead}>
            <div>
              <span className={styles.eyebrow}>Map scope</span>
              <h2>Build a study map</h2>
            </div>
            <button
              className={styles.close}
              onClick={() => setShowSettings(false)}
              aria-label="Close settings"
            >
              <CloseIcon />
            </button>
          </div>
          <p>
            Select one or more study bands. The atlas rebuilds using only those kanji and their
            relevant radical anchors.
          </p>
          <div className={styles.levelOptions}>
            <button
              aria-pressed={selectedLevels.length === 0}
              onClick={() => setSelectedLevels([])}
            >
              <span>All graph</span>
              <small>{ATLAS_KANJI_COUNT}</small>
            </button>
            {JLPT_LEVELS.map((level) => (
              <button
                key={level}
                aria-pressed={selectedLevelSet.has(level)}
                onClick={() => toggleLevel(level)}
              >
                <span>{level}</span>
                <small>{allKanji.filter((kanji) => kanji.level === level).length}</small>
              </button>
            ))}
          </div>
          <div className={styles.datasetNote}>
            <span className={styles.eyebrow}>Current projection</span>
            <strong>
              {projection.kanji.length.toLocaleString('en-US')} kanji · {projection.radicals.length}{' '}
              anchors
            </strong>
            <p>
              {projection.columns} × {projection.rows} cells. Every selected kanji appears at least
              once; secondary component placements close the grid.
            </p>
          </div>
        </section>
      ) : null}

      <div
        ref={viewportRef}
        className={styles.viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={mapRef}
          className={styles.map}
          style={{
            width: projection.width,
            height: projection.height,
            gridTemplateColumns: `repeat(${projection.columns}, ${CELL}px)`,
          }}
        >
          {projection.cells.map((cell) => {
            if (cell.kind === 'radical') {
              return (
                <RadicalMapTile
                  key={cell.key}
                  radical={cell.radical}
                  active={selectedRadical === cell.radical}
                  onSelect={selectRadical}
                />
              )
            }

            const status = mastery[cell.kanji.glyph] ?? cell.kanji.mastery
            const isRadicalMatch =
              !selectedRadical || cell.kanji.radicalNumbers.includes(selectedRadical.number)
            const isSelected = selectedKanji?.glyph === cell.kanji.glyph
            return (
              <KanjiMapTile
                key={cell.key}
                kanji={cell.kanji}
                status={status}
                dimmed={!isRadicalMatch}
                selected={isSelected}
                onSelect={selectKanji}
              />
            )
          })}
        </div>
      </div>

      <div ref={hintRef} className={styles.dragHint}>
        <HandIcon />
        <span>
          <strong>Drag to explore</strong>
          The map extends beyond the screen
        </span>
      </div>

      <div className={styles.coordinates}>
        <span>
          {projection.kanji.length.toLocaleString('en-US')} KANJI · {projection.radicals.length}{' '}
          RADICAL ANCHORS
        </span>
        <strong ref={coordinateRef}>0.0</strong>
      </div>

      <div className={styles.zoomControls}>
        <button
          onClick={() => setZoomAroundCenter(targetCameraRef.current.zoom + 0.1)}
          aria-label="Zoom in"
        >
          +
        </button>
        <span ref={zoomLabelRef}>100%</span>
        <button
          onClick={() => setZoomAroundCenter(targetCameraRef.current.zoom - 0.1)}
          aria-label="Zoom out"
        >
          −
        </button>
        <button onClick={() => resetView()} aria-label="Fit the current map">
          <LocateIcon />
        </button>
      </div>

      {selectedRadical && (
        <>
          <button
            className={styles.modalBackdrop}
            onClick={() => setSelectedRadical(null)}
            aria-label="Close radical details"
          />
          <aside
            className={`${styles.callout} ${styles.radicalCallout}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="radical-callout-title"
          >
            <button
              className={styles.close}
              onClick={() => setSelectedRadical(null)}
              aria-label="Close radical details"
            >
              <CloseIcon />
            </button>
            <header className={styles.detailHeader}>
              <span className={styles.eyebrow}>
                {selectedRadical.glyph} · Component cluster · radical {selectedRadical.number} of
                214
              </span>
              <h2 id="radical-callout-title">{selectedRadical.meaning}</h2>
              <p lang="ja">{selectedRadical.label}</p>
            </header>

            <section className={`${styles.strokeSection} ${styles.featuredStroke}`}>
              <div className={styles.sectionTitle}>
                <span>Stroke order</span>
                <em>{selectedRadical.glyph}</em>
              </div>
              <AnimatedStrokeOrder glyph={selectedRadical.glyph} />
            </section>

            <p className={styles.calloutCopy}>
              Every bright tile contains the <strong>{selectedRadical.meaning}</strong> component.
              Membership comes from the graph, so a kanji can belong to several clusters.
            </p>
            <section className={styles.familySection}>
              <div className={styles.sectionTitle}>
                <span>Kanji in this projection</span>
                <em>{selectedFamily.length} highlighted</em>
              </div>
              <div className={styles.familyGrid}>
                {selectedFamily.map((kanji) => (
                  <button key={kanji.glyph} onClick={() => selectKanji(kanji)}>
                    <span lang="ja">{kanji.glyph}</span>
                    <small>{kanji.meaning.split(' / ')[0]}</small>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </>
      )}

      {selectedKanji && (
        <>
          <button
            className={styles.modalBackdrop}
            onClick={() => setSelectedKanji(null)}
            aria-label="Close kanji details"
          />
          <aside
            className={styles.callout}
            role="dialog"
            aria-modal="true"
            aria-labelledby="kanji-callout-title"
          >
            <button
              className={styles.close}
              onClick={() => setSelectedKanji(null)}
              aria-label="Close kanji details"
            >
              <CloseIcon />
            </button>
            <header className={styles.detailHeader}>
              <span className={styles.eyebrow}>
                {selectedKanji.glyph} · Kanji · {selectedKanji.level} · {selectedKanji.strokes}{' '}
                strokes
              </span>
              <h2 id="kanji-callout-title">{selectedMeanings[0] || 'No English gloss'}</h2>
              {selectedMeanings.length > 1 ? (
                <p className={styles.secondaryMeanings}>
                  {selectedMeanings.slice(1, 4).join(' · ')}
                </p>
              ) : null}
            </header>

            <section className={`${styles.strokeSection} ${styles.featuredStroke}`}>
              <div className={styles.sectionTitle}>
                <span>Stroke order</span>
                <em>{selectedKanji.strokes} strokes</em>
              </div>
              <AnimatedStrokeOrder
                glyph={selectedKanji.glyph}
                declaredStrokes={selectedKanji.strokes}
              />
            </section>

            <div className={styles.readings}>
              <div>
                <span>On’yomi</span>
                <strong>{selectedKanji.on}</strong>
              </div>
              <div>
                <span>Kun’yomi</span>
                <strong>{selectedKanji.kun}</strong>
              </div>
            </div>

            <section className={styles.componentSection}>
              <div className={styles.sectionTitle}>
                <span>Visual components</span>
                <em>{selectedKanji.components.length} graph edges</em>
              </div>
              <div className={styles.componentGlyphs} lang="ja">
                {selectedKanji.components.map((component) => (
                  <span key={component}>{component}</span>
                ))}
              </div>
              <div className={styles.radicalPills}>
                {selectedKanji.radicalNumbers.map((number) => {
                  const radical = RADICAL_BY_NUMBER.get(number)
                  if (!radical) return null
                  return (
                    <button
                      key={number}
                      className={styles.radicalPill}
                      onClick={() => selectRadical(radical)}
                    >
                      <b lang="ja">{radical.glyph}</b>
                      {radical.meaning}
                    </button>
                  )
                })}
              </div>
            </section>

            <div className={styles.masteryControl}>
              <span className={styles.eyebrow}>Learning status</span>
              <div role="group" aria-label={`Learning status for ${selectedKanji.glyph}`}>
                {(['unknown', 'learning', 'known'] as Mastery[]).map((status) => (
                  <button
                    key={status}
                    className={styles[status]}
                    aria-pressed={activeMastery === status}
                    onClick={() => setKanjiMastery(status)}
                  >
                    <i />
                    {masteryLabels[status]}
                  </button>
                ))}
              </div>
            </div>

            <p className={styles.sourceLine}>
              Japanese Knowledge Graph · KANJIDIC2 · KRADFILE · KanjiVG
            </p>
          </aside>
        </>
      )}
    </main>
  )
}
