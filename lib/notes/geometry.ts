/**
 * Note geometry on the lattice — design_system.md §7.1, §11.15.
 *
 * This lives outside both components on purpose. The regression it exists
 * to prevent was two grids: the frosted lattice measured itself in `5vw`
 * while the notes layer measured itself in `window.innerWidth / 64`, so a
 * note could never land on a tile. Cell size and cell count now have one
 * definition (`--cell`, measured once by the stage) and every rectangle in
 * the workspace is expressed in cells, never pixels.
 */

/** A rectangle in lattice cells. Never in pixels — see above. */
export interface GridRect {
  x: number
  y: number
  w: number
  h: number
}

export interface GridNote extends GridRect {
  id: number
  text: string
}

/**
 * §2.5 quantised growth: a note is one of six sizes, not any size.
 * Content decides how many cells; the lattice decides it is a whole number.
 */
export const NOTE_SIZES: readonly { w: number; h: number }[] = [
  { w: 1, h: 1 },
  { w: 1, h: 2 },
  { w: 2, h: 1 },
  { w: 2, h: 2 },
  { w: 2, h: 3 },
  { w: 3, h: 2 },
]

/** The size a keyboard Place produces, since there is no drag to measure. */
export const DEFAULT_NOTE_SIZE = { w: 2, h: 2 }

/**
 * Snap a dragged rectangle to the nearest legal note size.
 *
 * The preview jumps hard from size to size rather than following the
 * pointer continuously (§7.3), so what will be committed is never in doubt.
 */
export function nearestNoteRect(
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
  cols: number,
  rows: number,
): GridRect {
  const rawWidth = Math.abs(endCol - startCol) + 1
  const rawHeight = Math.abs(endRow - startRow) + 1
  const size = NOTE_SIZES.reduce((best, candidate) =>
    Math.abs(candidate.w - rawWidth) + Math.abs(candidate.h - rawHeight) <
    Math.abs(best.w - rawWidth) + Math.abs(best.h - rawHeight)
      ? candidate
      : best,
  )
  // Dragging up or left anchors the far corner, so the rectangle grows
  // towards the pointer rather than away from it.
  const projectedX = endCol >= startCol ? startCol : startCol - size.w + 1
  const projectedY = endRow >= startRow ? startRow : startRow - size.h + 1

  return {
    x: Math.max(0, Math.min(projectedX, cols - size.w)),
    y: Math.max(0, Math.min(projectedY, rows - size.h)),
    w: size.w,
    h: size.h,
  }
}

/** Cell-space overlap test between two note rectangles. */
export function rectsOverlap(a: GridRect, b: GridRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/** Clamp a rectangle so it stays wholly inside the lattice. */
export function clampRect(rect: GridRect, cols: number, rows: number): GridRect {
  return {
    ...rect,
    x: Math.max(0, Math.min(rect.x, cols - rect.w)),
    y: Math.max(0, Math.min(rect.y, rows - rect.h)),
  }
}
