import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

import { FrostedWorldMap, type MapGuess } from '../components/FrostedWorldMap'
import { ThemeToggle } from '../components/ThemeToggle'
import { buildFillMask, mulberry32 } from '../frost/grid'
import { GradientSurface } from '../shader/GradientSurface'
import { preset } from '../shader/presets'
import { useTheme } from '../theme/themeContext'

type ModuleId = 'deck' | 'quiz' | 'map' | 'notes' | 'focus'

type GridNote = {
  id: number
  x: number
  y: number
  w: number
  h: number
  text: string
}

type GridRect = Pick<GridNote, 'x' | 'y' | 'w' | 'h'>

const NOTE_SIZES = [
  { w: 1, h: 1 },
  { w: 1, h: 2 },
  { w: 2, h: 1 },
  { w: 2, h: 2 },
  { w: 2, h: 3 },
  { w: 3, h: 2 },
] as const

const MODULE_LABELS: Record<ModuleId, string> = {
  deck: 'Memory deck',
  quiz: 'Quick check',
  map: 'Map lab',
  notes: 'Field notes',
  focus: 'Focus room',
}

const PALETTES: Record<
  ModuleId,
  { light: [string, string, string]; dark: [string, string, string] }
> = {
  deck: {
    light: ['#cfc5ff', '#a893f0', '#e3dcff'],
    dark: ['#4c2d96', '#241743', '#7559c4'],
  },
  quiz: {
    light: ['#bcd6ff', '#78abe8', '#dce9ff'],
    dark: ['#183d78', '#0c234a', '#2b5d9e'],
  },
  map: {
    light: ['#b9e2dd', '#70b5ad', '#d9efeb'],
    dark: ['#155d59', '#0b3434', '#25877f'],
  },
  notes: {
    light: ['#cbd2fb', '#929fe1', '#e1e5fb'],
    dark: ['#303f83', '#171f48', '#4d5da6'],
  },
  focus: {
    light: ['#ffd3b0', '#e99d68', '#ffe5cf'],
    dark: ['#8a3f23', '#4a2114', '#b85c32'],
  },
}

const hexToRgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const mixHex = (from: string, to: string, amount: number) => {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  const channels = a.map((value, index) =>
    Math.round(value + (b[index] - value) * amount)
      .toString(16)
      .padStart(2, '0'),
  )
  return `#${channels.join('')}`
}

function useAnimatedPalette(target: [string, string, string]) {
  const [current, setCurrent] = useState<[string, string, string]>(target)
  const currentRef = useRef(current)

  useEffect(() => {
    currentRef.current = current
  }, [current])

  useEffect(() => {
    const from = currentRef.current
    const startedAt = performance.now()
    let frame = 0

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 1000)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = target.map((color, index) =>
        mixHex(from[index], color, eased),
      ) as [string, string, string]
      currentRef.current = next
      setCurrent(next)
      if (progress < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return current
}

function Glyph({ id, size = 36 }: { id: ModuleId; size?: number }) {
  const paths: Record<ModuleId, ReactNode> = {
    deck: (
      <>
        <rect x="6" y="3" width="13" height="18" rx="2" />
        <path d="M10 8h5M10 12h5M10 16h3M3 7v12a2 2 0 0 0 2 2" />
      </>
    ),
    quiz: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.7 9a2.4 2.4 0 1 1 3.6 2.1c-.8.5-1.3 1-1.3 2M12 17h.01" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    notes: (
      <>
        <path d="M5 3h11l3 3v15H5Z" />
        <path d="M8 10h8M8 14h8M8 18h5M15 3v4h4" />
      </>
    ),
    focus: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l3 2M9 2h6M12 2v3" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[id]}
    </svg>
  )
}

function Brand() {
  return (
    <a className="grid-brand" href="#top" aria-label="Kite home">
      <span className="grid-brand__mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <strong>kite</strong>
      <span>learning field / 02</span>
    </a>
  )
}

function makeFrostPattern(cols: number, rows: number) {
  const random = mulberry32(cols * 17 + rows * 31)
  return Array.from({ length: cols * rows }, (_, index) => {
    const x = index % cols
    const y = Math.floor(index / cols)
    const diagonal = (x + Math.floor(y / 2)) % 7 < 2
    return random() < (diagonal ? 0.52 : 0.13)
  })
}

function nearestNoteRect(
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
  cols: number,
  rows: number,
): GridRect {
  const rawWidth = Math.abs(endCol - startCol) + 1
  const rawHeight = Math.abs(endRow - startRow) + 1
  const size = NOTE_SIZES.reduce((best, candidate) => {
    const bestDistance = Math.abs(best.w - rawWidth) + Math.abs(best.h - rawHeight)
    const candidateDistance =
      Math.abs(candidate.w - rawWidth) + Math.abs(candidate.h - rawHeight)
    return candidateDistance < bestDistance ? candidate : best
  })
  const projectedX = endCol >= startCol ? startCol : startCol - size.w + 1
  const projectedY = endRow >= startRow ? startRow : startRow - size.h + 1

  return {
    x: Math.max(0, Math.min(projectedX, cols - size.w)),
    y: Math.max(0, Math.min(projectedY, rows - size.h)),
    w: size.w,
    h: size.h,
  }
}

function InteractiveField({ palette }: { palette: [string, string, string] }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const hitsRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    startCol: number
    startRow: number
    endCol: number
    endRow: number
  } | null>(null)
  const moveRef = useRef<{
    id: number
    offsetCol: number
    offsetRow: number
    originX: number
    originY: number
  } | null>(null)
  const nextNoteId = useRef(1)
  const [grid, setGrid] = useState({ cols: 1, rows: 1, cell: 64 })
  const [frost, setFrost] = useState<boolean[]>([true])
  const [draft, setDraft] = useState<GridRect | null>(null)
  const [notes, setNotes] = useState<GridNote[]>([])
  const [blockedMoveId, setBlockedMoveId] = useState<number | null>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => {
      const cell = window.matchMedia('(max-width: 820px)').matches ? 56 : 64
      const cols = Math.max(1, Math.ceil(stage.clientWidth / cell))
      const rows = Math.max(1, Math.ceil(stage.clientHeight / cell))
      setGrid((old) =>
        old.cols === cols && old.rows === rows && old.cell === cell ? old : { cols, rows, cell },
      )
    }
    measure()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    observer?.observe(stage)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    setFrost(makeFrostPattern(grid.cols, grid.rows))
    setNotes((current) =>
      current.map((note) => ({
        ...note,
        x: Math.max(0, Math.min(note.x, grid.cols - note.w)),
        y: Math.max(0, Math.min(note.y, grid.rows - note.h)),
      })),
    )
  }, [grid])

  const fillMask = useMemo(
    () => buildFillMask(frost.map((cell) => (cell ? 1 : 0)), grid.cols, grid.rows),
    [frost, grid.cols, grid.rows],
  )
  const toggleCell = (index: number) => {
    setFrost((current) =>
      Array.from({ length: grid.cols * grid.rows }, (_, cell) =>
        cell === index ? !current[cell] : Boolean(current[cell]),
      ),
    )
  }

  const cellFromPointer = (clientX: number, clientY: number) => {
    const rect = hitsRef.current?.getBoundingClientRect()
    if (!rect) return { col: 0, row: 0 }
    return {
      col: Math.max(0, Math.min(grid.cols - 1, Math.floor((clientX - rect.left) / grid.cell))),
      row: Math.max(0, Math.min(grid.rows - 1, Math.floor((clientY - rect.top) / grid.cell))),
    }
  }

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const { col, row } = cellFromPointer(event.clientX, event.clientY)
    dragRef.current = { startCol: col, startRow: row, endCol: col, endRow: row }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const updateDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const { col, row } = cellFromPointer(event.clientX, event.clientY)
    drag.endCol = col
    drag.endRow = row
    if (col === drag.startCol && row === drag.startRow) {
      setDraft(null)
      return
    }
    setDraft(nearestNoteRect(drag.startCol, drag.startRow, col, row, grid.cols, grid.rows))
  }

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (drag.startCol === drag.endCol && drag.startRow === drag.endRow) {
      toggleCell(drag.startRow * grid.cols + drag.startCol)
    } else {
      const rect = nearestNoteRect(
        drag.startCol,
        drag.startRow,
        drag.endCol,
        drag.endRow,
        grid.cols,
        grid.rows,
      )
      if (isPlacementOpen(rect)) {
        setNotes((current) => [
          ...current,
          { ...rect, id: nextNoteId.current++, text: '' },
        ])
      }
    }
    dragRef.current = null
    setDraft(null)
  }

  const cancelDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    setDraft(null)
  }

  const isPlacementOpen = (candidate: GridRect, excludeId?: number) => {
    const overlapsNote = notes.some(
      (note) =>
        note.id !== excludeId &&
        candidate.x < note.x + note.w &&
        candidate.x + candidate.w > note.x &&
        candidate.y < note.y + note.h &&
        candidate.y + candidate.h > note.y,
    )
    if (overlapsNote) return false

    const fieldBounds = hitsRef.current?.getBoundingClientRect()
    if (!fieldBounds) return true
    const candidateBounds = {
      left: fieldBounds.left + candidate.x * grid.cell,
      right: fieldBounds.left + (candidate.x + candidate.w) * grid.cell,
      top: fieldBounds.top + candidate.y * grid.cell,
      bottom: fieldBounds.top + (candidate.y + candidate.h) * grid.cell,
    }

    return !Array.from(document.querySelectorAll<HTMLElement>('.learning-module')).some(
      (module) => {
        const bounds = module.getBoundingClientRect()
        return (
          candidateBounds.left < bounds.right &&
          candidateBounds.right > bounds.left &&
          candidateBounds.top < bounds.bottom &&
          candidateBounds.bottom > bounds.top
        )
      },
    )
  }

  const beginMove = (event: ReactPointerEvent<HTMLButtonElement>, note: GridNote) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    const { col, row } = cellFromPointer(event.clientX, event.clientY)
    moveRef.current = {
      id: note.id,
      offsetCol: col - note.x,
      offsetRow: row - note.y,
      originX: note.x,
      originY: note.y,
    }
    setBlockedMoveId(null)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const updateMove = (event: ReactPointerEvent<HTMLButtonElement>, note: GridNote) => {
    const move = moveRef.current
    if (!move || move.id !== note.id) return
    const { col, row } = cellFromPointer(event.clientX, event.clientY)
    const candidate = {
      x: Math.max(0, Math.min(col - move.offsetCol, grid.cols - note.w)),
      y: Math.max(0, Math.min(row - move.offsetRow, grid.rows - note.h)),
      w: note.w,
      h: note.h,
    }
    if (!isPlacementOpen(candidate, note.id)) {
      setBlockedMoveId(note.id)
      return
    }
    setBlockedMoveId(null)
    setNotes((current) =>
      current.map((item) =>
        item.id === note.id ? { ...item, x: candidate.x, y: candidate.y } : item,
      ),
    )
  }

  const finishMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    moveRef.current = null
    setBlockedMoveId(null)
  }

  const cancelMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const move = moveRef.current
    if (move) {
      setNotes((current) =>
        current.map((note) =>
          note.id === move.id ? { ...note, x: move.originX, y: move.originY } : note,
        ),
      )
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    moveRef.current = null
    setBlockedMoveId(null)
  }

  const gridLayerStyle = {
    left: `calc(50% - ${Math.floor(grid.cols / 2) * grid.cell}px)`,
    right: 'auto',
    bottom: 'auto',
    width: `${grid.cols * grid.cell}px`,
    height: `${grid.rows * grid.cell}px`,
  }

  return (
    <div
      className="field-material"
      ref={stageRef}
      style={{ '--stage-cell': `${grid.cell}px` } as CSSProperties}
    >
      <GradientSurface
        className="field-material__gradient"
        config={preset({
          color1: palette[0],
          color2: palette[1],
          color3: palette[2],
          uSpeed: 0.035,
          uStrength: 1.65,
          uDensity: 1.1,
          uFrequency: 5.5,
          cDistance: 3.9,
          cPolarAngle: 115,
          cAzimuthAngle: 180,
          positionX: -0.5,
          positionY: 0.1,
          rotationZ: 180,
          brightness: 1.1,
          reflection: 0.1,
        })}
        portrait={{ cDistance: 5.3, positionY: -0.4 }}
        compact={{ cPolarAngle: 100, cAzimuthAngle: 180 }}
        phone={{ cDistance: 6.1, cameraZoom: 0.85 }}
        maxScale={1.1}
      />
      <div className="field-material__grain" aria-hidden="true" />
      <div
        className="field-material__frost"
        aria-hidden="true"
        style={{
          ...gridLayerStyle,
          maskImage: fillMask,
          WebkitMaskImage: fillMask,
        }}
      />
      <div
        className="field-material__hits"
        ref={hitsRef}
        role="group"
        aria-label="Clickable background frost grid"
        style={{
          ...gridLayerStyle,
          gridTemplateColumns: `repeat(${grid.cols}, ${grid.cell}px)`,
          gridTemplateRows: `repeat(${grid.rows}, ${grid.cell}px)`,
        }}
        onPointerCancel={cancelDrag}
        onPointerDown={beginDrag}
        onPointerMove={updateDrag}
        onPointerUp={finishDrag}
      >
        {Array.from({ length: grid.cols * grid.rows }, (_, index) => (
          <button
            type="button"
            key={index}
            aria-label={`${frost[index] ? 'Clear' : 'Frost'} background tile ${index + 1}`}
            aria-pressed={Boolean(frost[index])}
            onClick={(event) => {
              // Pointer clicks are handled by the drag-aware grid container.
              // Keyboard and assistive-technology clicks report detail 0.
              if (event.detail === 0) toggleCell(index)
            }}
          />
        ))}
      </div>
      <div
        className="field-material__notes"
        aria-label="Notes placed on the learning grid"
        style={{
          ...gridLayerStyle,
          gridTemplateColumns: `repeat(${grid.cols}, ${grid.cell}px)`,
          gridTemplateRows: `repeat(${grid.rows}, ${grid.cell}px)`,
        }}
      >
        {draft && (
          <div
            className="grid-note grid-note--draft"
            style={{
              gridColumn: `${draft.x + 1} / span ${draft.w}`,
              gridRow: `${draft.y + 1} / span ${draft.h}`,
            }}
            aria-hidden="true"
          >
            <span>{draft.w}×{draft.h}</span>
          </div>
        )}
        {notes.map((note) => (
          <div
            className="grid-note"
            data-move-blocked={blockedMoveId === note.id}
            key={note.id}
            style={{
              gridColumn: `${note.x + 1} / span ${note.w}`,
              gridRow: `${note.y + 1} / span ${note.h}`,
            }}
          >
            <textarea
              aria-label={`Grid note ${note.id}`}
              placeholder={note.w === 1 && note.h === 1 ? 'Note' : 'Write a note…'}
              value={note.text}
              onChange={(event) => {
                const text = event.target.value
                setNotes((current) =>
                  current.map((item) => (item.id === note.id ? { ...item, text } : item)),
                )
              }}
            />
            <button
              className="grid-note__move"
              type="button"
              aria-label={`Move grid note ${note.id}`}
              title="Drag to move"
              onPointerCancel={cancelMove}
              onPointerDown={(event) => beginMove(event, note)}
              onPointerMove={(event) => updateMove(event, note)}
              onPointerUp={finishMove}
            >
              ···
            </button>
            <button
              className="grid-note__remove"
              type="button"
              aria-label={`Remove grid note ${note.id}`}
              onClick={() =>
                setNotes((current) => current.filter((item) => item.id !== note.id))
              }
            >
              ×
            </button>
            <span className="grid-note__size">{note.w}×{note.h}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FlashcardModule() {
  const cards = [
    {
      topic: 'Cell biology',
      prompt: 'What is the mitochondrion’s main role?',
      answer: 'It converts energy from food into ATP the cell can use.',
    },
    {
      topic: 'Cell biology',
      prompt: 'Where is genetic information stored?',
      answer: 'Mostly in the nucleus, arranged into chromosomes.',
    },
    {
      topic: 'Cell biology',
      prompt: 'What controls movement into a cell?',
      answer: 'The selectively permeable cell membrane.',
    },
  ]
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const card = cards[index]

  const next = (confidence: string) => {
    setIndex((current) => (current + 1) % cards.length)
    setRevealed(false)
    void confidence
  }

  return (
    <div className="module-body deck-body">
      <div className="deck-meta">
        <span>Active deck</span>
        <strong>{String(index + 4).padStart(2, '0')} / 12</strong>
        <i><b style={{ width: `${((index + 4) / 12) * 100}%` }} /></i>
      </div>
      <button
        className="study-card"
        data-revealed={revealed}
        type="button"
        onClick={() => setRevealed((value) => !value)}
      >
        <span>{card.topic}</span>
        <strong>{revealed ? card.answer : card.prompt}</strong>
        <small>{revealed ? 'Answer · tap to return' : 'Tap to reveal'}</small>
      </button>
      <div className="deck-actions">
        <span>How well did you know it?</span>
        <div>
          {['Again', 'Good', 'Easy'].map((label) => (
            <button disabled={!revealed} key={label} onClick={() => next(label)} type="button">
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function QuizModule() {
  const [answer, setAnswer] = useState<string | null>(null)
  const choices = ['Inner core', 'Mantle', 'Crust', 'Atmosphere']

  return (
    <div className="module-body quiz-body">
      <div className="question-copy">
        <span>Earth science · 20 pts</span>
        <strong>Which layer carries the tectonic plates?</strong>
        <p>
          {answer === null
            ? 'Select one answer.'
            : answer === 'Crust'
              ? 'Correct. Plates are pieces of the lithosphere, Earth’s rigid outer shell.'
              : 'Not quite. Think about the thin, rigid shell under our feet.'}
        </p>
      </div>
      <div className="answer-grid">
        {choices.map((choice, index) => (
          <button
            type="button"
            key={choice}
            data-state={
              answer === choice ? (choice === 'Crust' ? 'right' : 'wrong') : 'idle'
            }
            onClick={() => setAnswer(choice)}
          >
            <span>{String.fromCharCode(65 + index)}</span>
            {choice}
          </button>
        ))}
      </div>
    </div>
  )
}

function MapModule() {
  const [guess, setGuess] = useState<MapGuess | null>(null)

  const coordinate =
    guess === null
      ? 'World / 01'
      : `${Math.abs(guess.latitude).toFixed(1)}°${guess.latitude >= 0 ? 'N' : 'S'} · ${Math.abs(guess.longitude).toFixed(1)}°${guess.longitude >= 0 ? 'E' : 'W'}`

  return (
    <div className="module-body map-body">
      <div className="map-prompt">
        <span>World geography · Map pulse 02</span>
        <strong>Find the Andes.</strong>
        <p>
          {guess === null
            ? 'Explore the real map, then place your answer.'
            : guess.correct
              ? 'Found it. The range follows South America’s western edge.'
              : 'Not there. Look along the Pacific side of South America.'}
        </p>
        <b>{guess?.correct ? '+30 pts' : coordinate}</b>
      </div>
      <div className="world-map-frame">
        <FrostedWorldMap onGuess={setGuess} />
        <div className="world-map-key" aria-hidden="true">
          <i />
          <span>Click to place answer</span>
        </div>
      </div>
    </div>
  )
}

function NotesModule() {
  const [note, setNote] = useState('Mountains remember where continents collided.')
  const [saved, setSaved] = useState(true)

  return (
    <div className="module-body notes-body">
      <label>
        <span>Field note · Earth science</span>
        <textarea
          value={note}
          onChange={(event) => {
            setNote(event.target.value)
            setSaved(false)
          }}
          aria-label="Study note"
        />
      </label>
      <div>
        <span>{note.length} characters</span>
        <button type="button" onClick={() => setSaved(true)}>
          {saved ? 'Saved' : 'Save note'}
        </button>
      </div>
    </div>
  )
}

function FocusModule() {
  const [seconds, setSeconds] = useState(12 * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || seconds <= 0) return
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [running, seconds])

  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60

  return (
    <div className="module-body focus-body">
      <div>
        <span>Quiet recall session</span>
        <strong>{String(minutes).padStart(2, '0')}:{String(remainder).padStart(2, '0')}</strong>
      </div>
      <div className="focus-actions">
        <button type="button" onClick={() => setRunning((value) => !value)}>
          {running ? 'Pause' : 'Start focus'}
        </button>
        <button type="button" onClick={() => { setRunning(false); setSeconds(12 * 60) }}>
          Reset
        </button>
      </div>
    </div>
  )
}

function ModulePanel({
  id,
  index,
  active,
  onActivate,
  children,
}: {
  id: ModuleId
  index: number
  active: boolean
  onActivate: (id: ModuleId) => void
  children: ReactNode
}) {
  return (
    <article className={`learning-module learning-module--${id}`} data-active={active}>
      <header className="learning-module__head">
        <button type="button" onClick={() => onActivate(id)} aria-expanded={active}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <Glyph id={id} size={22} />
          <strong>{MODULE_LABELS[id]}</strong>
          <small>{active ? 'Active · close' : 'Open module'}</small>
          <b aria-hidden="true">{active ? '×' : '↘'}</b>
        </button>
      </header>
      {active ? (
        children
      ) : (
        <button
          className="module-idle"
          type="button"
          aria-label={`Open ${MODULE_LABELS[id]}`}
          onClick={() => onActivate(id)}
        >
          <Glyph id={id} size={54} />
          <span aria-hidden="true" />
        </button>
      )}
    </article>
  )
}

export function LearningDemo() {
  const { theme } = useTheme()
  const [active, setActive] = useState<ModuleId | null>('deck')
  const [paletteId, setPaletteId] = useState<ModuleId>('deck')
  const palette = PALETTES[paletteId][theme]
  const animatedPalette = useAnimatedPalette(palette)

  const activate = (id: ModuleId) => {
    if (active === id) {
      setActive(null)
      return
    }
    setPaletteId(id)
    setActive(id)
  }

  return (
    <div className="field-app" id="top">
      <a className="skip-link" href="#modules">Skip to learning modules</a>
      <InteractiveField palette={animatedPalette} />

      <header className="field-topbar">
        <Brand />
        <div className="field-topbar__center" aria-live="polite">
          <span className="live-dot" />
          <span>{active ? MODULE_LABELS[active] : 'Field resting'}</span>
        </div>
        <div className="field-topbar__tools">
          <span className="field-index">Friday · 5 modules</span>
          <ThemeToggle />
          <button className="field-avatar" type="button" aria-label="Open Alex's profile">AM</button>
        </div>
      </header>

      <main className="field-main">
        <section className="field-intro">
          <span>Kite / active recall instrument</span>
          <h1>Build knowledge,<br />one square at a time.</h1>
          <p>
            Open a module to bring it into focus. Click a background cell to frost it, or drag
            across empty cells to create a note.
          </p>
          <a href="#modules">Begin today’s path <span aria-hidden="true">↓</span></a>
        </section>

        <section className="module-stack" id="modules" aria-label="Today's learning modules">
          <ModulePanel id="deck" index={0} active={active === 'deck'} onActivate={activate}>
            <FlashcardModule />
          </ModulePanel>
          <ModulePanel id="quiz" index={1} active={active === 'quiz'} onActivate={activate}>
            <QuizModule />
          </ModulePanel>
          <ModulePanel id="map" index={2} active={active === 'map'} onActivate={activate}>
            <MapModule />
          </ModulePanel>
          <ModulePanel id="notes" index={3} active={active === 'notes'} onActivate={activate}>
            <NotesModule />
          </ModulePanel>
          <ModulePanel id="focus" index={4} active={active === 'focus'} onActivate={activate}>
            <FocusModule />
          </ModulePanel>
        </section>

        <footer className="field-footer">
          <Brand />
          <p>Five modules. One continuous field.</p>
          <span>Background tiles are interactive</span>
        </footer>
      </main>
    </div>
  )
}
