'use client'

import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { GridNote, GridRect } from '@/lib/notes/geometry'

/* §11.15 The notes workspace, on the frosted lattice.
 *
 * A note's text and its topic anchor persist; where the learner arranged it
 * on the lattice does not — the arrangement is discarded on leaving the
 * surface. Spatial thinking is useful *while* thinking; it is not what you
 * come back for, and a coordinate is meaningless at a different viewport or
 * after an educator edits the material underneath it. /me/notes is the
 * durable index, anchored to topics rather than to cells.
 *
 * This layer renders and edits; it does not own geometry. Placement, the
 * grid and the drag all belong to FrostStage, because a gesture that begins
 * on a tile has to resolve to EITHER frosting that tile OR placing a note,
 * and only one component can arbitrate that. When these were two components
 * each measuring its own grid, notes could not land on tiles at all.
 *
 * §7.1 Place and Move; §8.5 gives both a keyboard path, because SC 2.5.7
 * does not care that the result is a scratch workspace.
 */

interface NotesLayerProps {
  grid: { cols: number; rows: number; cell: number }
  /** Geometry of the lattice layers, so the notes sit on exactly the same cells. */
  layerStyle: CSSProperties
  notes: GridNote[]
  draft: GridRect | null
  blockedMoveId: number | null
  /** When absent, notes are scratch only and the interface says so. */
  topicTitle?: string
  onChangeText: (id: number, text: string) => void
  onRemove: (id: number) => void
  onNudge: (note: GridNote, dx: number, dy: number) => void
  onStartMove: (event: ReactPointerEvent<HTMLButtonElement>, note: GridNote) => void
  onUpdateMove: (event: ReactPointerEvent<HTMLButtonElement>, note: GridNote) => void
  onFinishMove: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onCancelMove: (event: ReactPointerEvent<HTMLButtonElement>) => void
  /** Wired when the notes API lands (§12); until then a note is session-only. */
  onPersist?: (text: string) => void
}

export function NotesLayer({
  grid,
  layerStyle,
  notes,
  draft,
  blockedMoveId,
  topicTitle,
  onChangeText,
  onRemove,
  onNudge,
  onStartMove,
  onUpdateMove,
  onFinishMove,
  onCancelMove,
  onPersist,
}: NotesLayerProps) {
  return (
    <div
      className="k-notes"
      aria-label="Notes placed on the lattice"
      style={{
        ...layerStyle,
        gridTemplateColumns: `repeat(${grid.cols}, ${grid.cell}px)`,
        gridTemplateRows: `repeat(${grid.rows}, ${grid.cell}px)`,
      }}
    >
      {/* The snap preview jumps hard from cell to cell, so the commitment
          stays unambiguous while the pointer moves smoothly (§7.3). */}
      {draft ? (
        <div
          className="k-note k-note--draft"
          aria-hidden="true"
          style={{
            gridColumn: `${draft.x + 1} / span ${draft.w}`,
            gridRow: `${draft.y + 1} / span ${draft.h}`,
          }}
        >
          <span>
            {draft.w}×{draft.h}
          </span>
        </div>
      ) : null}

      {notes.map((note) => (
        <div
          key={note.id}
          className="k-note"
          data-move-blocked={blockedMoveId === note.id}
          style={{
            gridColumn: `${note.x + 1} / span ${note.w}`,
            gridRow: `${note.y + 1} / span ${note.h}`,
          }}
        >
          <textarea
            className="k-note__text"
            aria-label={`Note at column ${note.x + 1}, row ${note.y + 1}`}
            placeholder={
              note.w === 1 && note.h === 1
                ? 'Note'
                : topicTitle
                  ? `Note on ${topicTitle}`
                  : 'Write a note…'
            }
            value={note.text}
            onChange={(event) => onChangeText(note.id, event.target.value)}
            onBlur={(event) => {
              const text = event.target.value.trim()
              if (text && onPersist) onPersist(text)
            }}
          />
          <button
            type="button"
            className="k-note__move"
            aria-label={`Move note ${note.id}. Arrow keys move it one cell.`}
            title="Drag to move, or arrow keys"
            onKeyDown={(event) => {
              const step: Record<string, [number, number]> = {
                ArrowLeft: [-1, 0],
                ArrowRight: [1, 0],
                ArrowUp: [0, -1],
                ArrowDown: [0, 1],
              }
              const delta = step[event.key]
              if (!delta) return
              event.preventDefault()
              onNudge(note, delta[0], delta[1])
            }}
            onPointerCancel={onCancelMove}
            onPointerDown={(event) => onStartMove(event, note)}
            onPointerMove={(event) => onUpdateMove(event, note)}
            onPointerUp={onFinishMove}
          >
            ···
          </button>
          <button
            type="button"
            className="k-note__close"
            aria-label={`Remove note ${note.id}`}
            onClick={() => onRemove(note.id)}
          >
            ×
          </button>
          <span className="k-note__size" aria-hidden="true">
            {note.w}×{note.h}
          </span>
        </div>
      ))}

      {notes.length > 0 && !topicTitle ? (
        <p className="k-note__caveat">
          Scratch notes. The arrangement clears when you leave; nothing is kept.
        </p>
      ) : null}
    </div>
  )
}
