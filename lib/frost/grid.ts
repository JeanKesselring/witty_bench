/**
 * Shared mask building for the two frosted-grid demos.
 *
 * Both express the frost as a CSS mask over a single `backdrop-filter` layer.
 * That is the whole performance story: one blurred element masked to many
 * tiles, rather than one blurred element per tile — the latter measured 8ms per
 * frame slower for ~130 cells, because each backdrop-filtered element forces
 * its own backdrop root.
 */

/** Edge style, shared by both demos so they cannot drift apart. */
export const EDGE = {
  /** Device pixels, held constant by `non-scaling-stroke`. */
  width: 0.75,
  /** Mask alpha of the lit edges. This is the ceiling for the whole rim,
   *  and it stays at or below 0.30 — the rim marks where a tile ends, it is
   *  not itself a line in the composition. */
  lit: 0.2,
  /** The opposing edges, kept well under `lit` so the light keeps a direction. */
  dim: 0.07,
} as const

const svgUrl = (body: string, cols: number, rows: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols} ${rows}" ` +
      `preserveAspectRatio="none">${body}</svg>`,
  )}")`

/**
 * The frosted area, with per-cell coverage.
 *
 * `alpha` is 0..1 per cell. Demo 5 only ever passes 0 or 1; demo 6 passes a
 * continuous value, which is how a tile can be partly frosted — mask alpha
 * decides how much of the blurred layer shows through, so it doubles as a
 * frost amount without needing a separate blur per tile.
 */
export function buildFillMask(alpha: ArrayLike<number>, cols: number, rows: number): string {
  let body = ''
  for (let i = 0; i < cols * rows; i++) {
    // Grid dimensions and their backing array can update on adjacent React
    // renders after a resize. Treat a not-yet-created cell as clear instead of
    // attempting to format `undefined` below.
    const a = Number(alpha[i] ?? 0)
    if (a <= 0.004) continue
    const x = i % cols
    const y = (i / cols) | 0
    // Trailing zeros here would bloat the data URI, which is rebuilt per frame
    // in demo 6; two decimals is well below what is visible.
    body +=
      a >= 0.996
        ? `<rect x="${x}" y="${y}" width="1" height="1" fill="#fff"/>`
        : `<rect x="${x}" y="${y}" width="1" height="1" fill="#fff" fill-opacity="${a.toFixed(2)}"/>`
  }
  return svgUrl(body, cols, rows)
}

/**
 * The outline of the solid area, as a mask for the lit rim.
 *
 * An edge is emitted only where a cell's neighbour is empty, so touching cells
 * merge into one pane instead of showing seams. That neighbour test is why this
 * cannot be a repeating CSS gradient — a gradient draws every cell boundary and
 * knows nothing about what is beside it.
 *
 * `vector-effect="non-scaling-stroke"` keeps the rim a constant device-pixel
 * width. Without it `preserveAspectRatio="none"` would scale the stroke by a
 * different factor in x and y whenever cells are not square.
 */
export function buildEdgeMask(solid: ArrayLike<boolean>, cols: number, rows: number): string {
  const on = (c: number, r: number) =>
    c >= 0 && c < cols && r >= 0 && r < rows && solid[r * cols + c]

  let lit = ''
  let dim = ''
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!on(c, r)) continue
      if (!on(c, r - 1)) lit += `M${c} ${r}H${c + 1}`
      if (!on(c - 1, r)) lit += `M${c} ${r}V${r + 1}`
      if (!on(c, r + 1)) dim += `M${c} ${r + 1}H${c + 1}`
      if (!on(c + 1, r)) dim += `M${c + 1} ${r}V${r + 1}`
    }
  }

  const path = (d: string, opacity: number) =>
    d
      ? `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${opacity}" ` +
        `stroke-width="${EDGE.width}" vector-effect="non-scaling-stroke"/>`
      : ''

  return svgUrl(path(lit, EDGE.lit) + path(dim, EDGE.dim), cols, rows)
}

/** Small deterministic PRNG, so a given seed always yields the same pattern. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
