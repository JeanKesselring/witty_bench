'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { buildEdgeMask, buildFillMask, mulberry32 } from '@/lib/frost/grid'
import {
  clampRect,
  nearestNoteRect,
  rectsOverlap,
  DEFAULT_NOTE_SIZE,
  type GridNote,
  type GridRect,
} from '@/lib/notes/geometry'
import { GradientBackdrop } from '@/components/gradient/GradientBackdrop'
import { NotesLayer } from '@/components/notes/NotesLayer'

/**
 * The frosted lattice and the notes workspace it carries — §2.1, §3.5, §5,
 * §7.1, §11.15. Ported from the prototype's InteractiveField.
 *
 * Three things about this are load-bearing and were each broken once:
 *
 * 1. THE CELL IS SQUARE, and is `--cell`. An earlier version used
 *    `repeat(20, 5vw) / repeat(20, 5vh)`, which is only square on a 1:1
 *    viewport — at 1512×860 it drew 75.6 × 43px rectangles. Cells are
 *    measured, never assumed, and the count follows from the measurement.
 *
 * 2. THE STAGE IS IN DOCUMENT FLOW (§3.4), not pinned to the viewport. It
 *    is `position: absolute; inset: 0` inside a relatively-positioned body,
 *    so it spans the full scroll length and a note stays beside the content
 *    it was written against. Only the gradient inside it is `fixed`.
 *
 * 3. THE LAYER ORDER. Canvas, texture, glass, edge, hits and notes are all
 *    SIBLINGS inside one `isolation: isolate` stage, so the glass's
 *    backdrop-filter samples the canvas and the texture directly. Put
 *    anything between them in a different stacking context and the blur has
 *    nothing to capture.
 *
 * The frost is pure blur: no veil, no tint, no saturation shift, so a tile
 * is the same hue and brightness as its surroundings. That only reads if the
 * surface underneath has texture to lose, which is what the texture layer is
 * for — fine noise gives the blur something to remove, so tiles read as
 * *smooth* patches against a textured surround.
 */

/** Cells that content covers are not placeable — §7.3, a note may not land under a card. */
const CONTENT_SELECTOR = '.k-topbar, .k-foot, .k-main > *'

const makeFrostPattern = (cols: number, rows: number, seed: number) => {
  const random = mulberry32(cols * 17 + rows * 31 + seed)
  return Array.from({ length: cols * rows }, (_, index) => {
    const x = index % cols
    const y = Math.floor(index / cols)
    // A slow diagonal bias, so the frost reads as drift rather than static.
    const diagonal = (x + Math.floor(y / 2)) % 7 < 2
    return random() < (diagonal ? 0.52 : 0.13)
  })
}

/** Which cell an event landed on. Delegated, so no cell carries a closure. */
const cellIndexOf = (target: EventTarget): number | null => {
  const raw = (target as HTMLElement).dataset?.index
  if (raw === undefined) return null
  const index = Number.parseInt(raw, 10)
  return Number.isInteger(index) ? index : null
}

const readCell = (element: HTMLElement) => {
  const raw = getComputedStyle(element).getPropertyValue('--cell')
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 64
}

export function FrostStage() {
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
  const seedRef = useRef(0)

  const [grid, setGrid] = useState({ cols: 1, rows: 1, cell: 64, offset: 0 })
  const [frost, setFrost] = useState<boolean[]>([false])
  const [draft, setDraft] = useState<GridRect | null>(null)
  const [notes, setNotes] = useState<GridNote[]>([])
  const [blockedMoveId, setBlockedMoveId] = useState<number | null>(null)
  const [focusIndex, setFocusIndex] = useState(0)
  const [announce, setAnnounce] = useState('')

  // The grid is measured, never assumed: the server cannot know the
  // viewport, so it renders a 1×1 lattice and the first effect resolves it.
  // That also means no hydration mismatch to suppress.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    seedRef.current = Math.floor(Math.random() * 1e6)
    const measure = () => {
      const cell = readCell(stage)
      // The lattice is anchored to the CONTENT COLUMN, not to the viewport
      // and not to the centre. Those three only coincide when the viewport is
      // a whole number of cells wide, and when they disagree it is the
      // content that has to line up — that is where the reading happens.
      //
      // Centring alone was exact at lg/xl (the shell is narrower than the
      // viewport, so it is centred) but off by 8px at md, where the shell
      // fills the viewport and the content edge IS the viewport edge.
      // Measuring the real column handles both without re-deriving layout.
      const main = document.querySelector('.k-main')
      const stageLeft = stage.getBoundingClientRect().left
      const contentLeft = main
        ? main.getBoundingClientRect().left - stageLeft
        : Math.max(0, (stage.clientWidth - 1152) / 2)
      // Largest cell boundary at or left of the content edge, so the lattice
      // still covers the full width.
      const offset = contentLeft - Math.ceil(contentLeft / cell) * cell
      const cols = Math.max(1, Math.ceil((stage.clientWidth - offset) / cell))
      const rows = Math.max(1, Math.ceil(stage.clientHeight / cell))
      setGrid((old) =>
        old.cols === cols && old.rows === rows && old.cell === cell && old.offset === offset
          ? old
          : { cols, rows, cell, offset },
      )
    }
    measure()
    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    observer?.observe(stage)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  // A resize changes how many cells exist, so the pattern is redrawn and
  // any note now outside the lattice is pulled back inside it.
  useEffect(() => {
    setFrost(makeFrostPattern(grid.cols, grid.rows, seedRef.current))
    setNotes((current) =>
      current.map((note) => ({ ...note, ...clampRect(note, grid.cols, grid.rows) })),
    )
    setFocusIndex((index) => Math.min(index, grid.cols * grid.rows - 1))
  }, [grid])

  const fillMask = useMemo(
    () => buildFillMask(frost.map((cell) => (cell ? 1 : 0)), grid.cols, grid.rows),
    [frost, grid.cols, grid.rows],
  )
  const edgeMask = useMemo(
    () => buildEdgeMask(frost, grid.cols, grid.rows),
    [frost, grid.cols, grid.rows],
  )

  const toggleCell = useCallback((index: number) => {
    setFrost((current) =>
      current.map((cell, position) => (position === index ? !cell : cell)),
    )
  }, [])

  const cellFromPointer = (clientX: number, clientY: number) => {
    const rect = hitsRef.current?.getBoundingClientRect()
    if (!rect) return { col: 0, row: 0 }
    return {
      col: Math.max(0, Math.min(grid.cols - 1, Math.floor((clientX - rect.left) / grid.cell))),
      row: Math.max(0, Math.min(grid.rows - 1, Math.floor((clientY - rect.top) / grid.cell))),
    }
  }

  /**
   * Is this rectangle free? Two tests: no other note, and no content.
   *
   * The content test is geometric rather than structural because the notes
   * workspace has no idea what is rendered above it — it asks the layout
   * where the real boxes are, in viewport coordinates, and refuses to place
   * a note underneath one.
   */
  const isPlacementOpen = (candidate: GridRect, excludeId?: number) => {
    if (notes.some((note) => note.id !== excludeId && rectsOverlap(candidate, note))) {
      return false
    }

    const fieldBounds = hitsRef.current?.getBoundingClientRect()
    if (!fieldBounds) return true
    const box = {
      left: fieldBounds.left + candidate.x * grid.cell,
      right: fieldBounds.left + (candidate.x + candidate.w) * grid.cell,
      top: fieldBounds.top + candidate.y * grid.cell,
      bottom: fieldBounds.top + (candidate.y + candidate.h) * grid.cell,
    }

    return !Array.from(
      document.querySelectorAll<HTMLElement>(CONTENT_SELECTOR),
    ).some((element) => {
      const bounds = element.getBoundingClientRect()
      return (
        box.left < bounds.right &&
        box.right > bounds.left &&
        box.top < bounds.bottom &&
        box.bottom > bounds.top
      )
    })
  }

  const placeNote = (rect: GridRect) => {
    if (!isPlacementOpen(rect)) {
      setAnnounce('No room for a note there.')
      return
    }
    setNotes((current) => [...current, { ...rect, id: nextNoteId.current++, text: '' }])
    setAnnounce(
      `Note placed, ${rect.w} by ${rect.h} cells, column ${rect.x + 1} row ${rect.y + 1}.`,
    )
  }

  // ── Place by pointer: click toggles a tile, drag places a note ──────────
  // One surface handles both, which is why the drag lives here rather than
  // on the notes layer. A gesture that starts on a tile cannot be ambiguous
  // about which of the two it is: it is a note if it crossed a cell boundary.

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
    // Actions fire on pointerup, never pointerdown (SC 2.5.2).
    if (drag.startCol === drag.endCol && drag.startRow === drag.endRow) {
      toggleCell(drag.startRow * grid.cols + drag.startCol)
    } else {
      placeNote(
        nearestNoteRect(
          drag.startCol,
          drag.startRow,
          drag.endCol,
          drag.endRow,
          grid.cols,
          grid.rows,
        ),
      )
    }
    dragRef.current = null
    setDraft(null)
  }

  const cancelDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    // pointercancel reverts to the pre-drag state (§7.3).
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    setDraft(null)
  }

  // ── Move by pointer ────────────────────────────────────────────────────

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
    const candidate = clampRect(
      { ...note, x: col - move.offsetCol, y: row - move.offsetRow },
      grid.cols,
      grid.rows,
    )
    // Blocked is shown, not silently ignored — the note stays where it was
    // and says why, rather than snapping back with no explanation.
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

  /** §8.5 / SC 2.5.7: Move has a keyboard path, one cell per press. */
  const nudgeNote = (note: GridNote, dx: number, dy: number) => {
    const candidate = clampRect(
      { ...note, x: note.x + dx, y: note.y + dy },
      grid.cols,
      grid.rows,
    )
    if (candidate.x === note.x && candidate.y === note.y) return
    if (!isPlacementOpen(candidate, note.id)) {
      setBlockedMoveId(note.id)
      setAnnounce('Blocked.')
      return
    }
    setBlockedMoveId(null)
    setNotes((current) =>
      current.map((item) =>
        item.id === note.id ? { ...item, x: candidate.x, y: candidate.y } : item,
      ),
    )
    setAnnounce(`Column ${candidate.x + 1}, row ${candidate.y + 1}.`)
  }

  /**
   * §8.6: a grid of more than ~10 similar controls is ONE tab stop,
   * navigated by arrows. 400-plus tab stops between the topbar and the
   * first card is not a lattice, it is a trap.
   */
  const onHitsKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const col = focusIndex % grid.cols
    const row = Math.floor(focusIndex / grid.cols)
    const move = (nextCol: number, nextRow: number) => {
      event.preventDefault()
      const clampedCol = Math.max(0, Math.min(grid.cols - 1, nextCol))
      const clampedRow = Math.max(0, Math.min(grid.rows - 1, nextRow))
      const next = clampedRow * grid.cols + clampedCol
      setFocusIndex(next)
      const cells = hitsRef.current?.children
      ;(cells?.[next] as HTMLElement | undefined)?.focus()
    }

    switch (event.key) {
      case 'ArrowLeft':
        return move(col - 1, row)
      case 'ArrowRight':
        return move(col + 1, row)
      case 'ArrowUp':
        return move(col, row - 1)
      case 'ArrowDown':
        return move(col, row + 1)
      case 'Home':
        return move(0, row)
      case 'End':
        return move(grid.cols - 1, row)
      case 'n':
      case 'N':
        // Place, without a drag to measure — §8.5's equivalent for SC 2.5.7.
        event.preventDefault()
        return placeNote(
          clampRect({ x: col, y: row, ...DEFAULT_NOTE_SIZE }, grid.cols, grid.rows),
        )
      default:
    }
  }

  // Positioned from the measured offset above, so column boundaries fall on
  // the content column's edges at every breakpoint.
  const gridLayerStyle: CSSProperties = {
    left: `${grid.offset}px`,
    right: 'auto',
    bottom: 'auto',
    width: `${grid.cols * grid.cell}px`,
    height: `${grid.rows * grid.cell}px`,
  }

  return (
    <div className="frost__stage" ref={stageRef}>
      <GradientBackdrop className="frost__canvas" />
      <div className="frost__texture" aria-hidden="true" />

      <div
        className="frost__glass"
        aria-hidden="true"
        style={{ ...gridLayerStyle, maskImage: fillMask, WebkitMaskImage: fillMask }}
      />

      {/* A sibling, not a child: the rim straddles the cluster boundary, so
          clipping it to the tile mask would shave off its outer half. */}
      <div
        className="frost__edge"
        aria-hidden="true"
        style={{ ...gridLayerStyle, maskImage: edgeMask, WebkitMaskImage: edgeMask }}
      />

      {/* Hit targets only — transparent, carrying no backdrop-filter, so the
          frost stays a single blurred element underneath however many cells
          there are. Cell count scales with page height, since the lattice
          runs the full scroll length (§3.4), so every handler is delegated
          to this container and a cell is an empty button with attributes —
          no closures, nothing retained per cell. */}
      <div
        className="frost__hits"
        ref={hitsRef}
        role="group"
        aria-label="Frosted lattice. Arrow keys to move, Enter to frost a tile, N to place a note."
        style={{
          ...gridLayerStyle,
          gridTemplateColumns: `repeat(${grid.cols}, ${grid.cell}px)`,
          gridTemplateRows: `repeat(${grid.rows}, ${grid.cell}px)`,
        }}
        onKeyDown={onHitsKeyDown}
        onPointerCancel={cancelDrag}
        onPointerDown={beginDrag}
        onPointerMove={updateDrag}
        onPointerUp={finishDrag}
        onFocus={(event) => {
          const index = cellIndexOf(event.target)
          if (index !== null) setFocusIndex(index)
        }}
        onClick={(event) => {
          // Pointer clicks are handled by the drag-aware container, which is
          // the only place that can tell a tap from a note drag. Keyboard and
          // assistive-technology clicks report detail 0 and land here.
          if (event.detail !== 0) return
          const index = cellIndexOf(event.target)
          if (index !== null) toggleCell(index)
        }}
      >
        {Array.from({ length: grid.cols * grid.rows }, (_, index) => (
          <button
            type="button"
            key={index}
            className="frost__hit"
            data-index={index}
            tabIndex={index === focusIndex ? 0 : -1}
            aria-pressed={Boolean(frost[index])}
            aria-label={`Cell ${(index % grid.cols) + 1}, ${Math.floor(index / grid.cols) + 1}`}
          />
        ))}
      </div>

      <NotesLayer
        blockedMoveId={blockedMoveId}
        draft={draft}
        grid={grid}
        layerStyle={gridLayerStyle}
        notes={notes}
        onCancelMove={cancelMove}
        onChangeText={(id, text) =>
          setNotes((current) =>
            current.map((note) => (note.id === id ? { ...note, text } : note)),
          )
        }
        onFinishMove={finishMove}
        onNudge={nudgeNote}
        onRemove={(id) => {
          setNotes((current) => current.filter((note) => note.id !== id))
          setAnnounce('Note removed.')
        }}
        onStartMove={beginMove}
        onUpdateMove={updateMove}
      />

      {/* §9.4: placement and move feedback, politely. */}
      <p className="k-visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
