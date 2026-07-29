/* Layout for the `diagram` figure kind — Common Sage's `diagram_schematic`.
 *
 * The source schema carries no coordinates on purpose ("Layout is automatic —
 * the component computes positions from the graph topology"), so this is the
 * half of that module that actually has to be rebuilt rather than restyled.
 *
 * Four declared diagram types collapse to two algorithms. `flowchart` and
 * `tree` are both layered — a flowchart is a tree that happens to be a chain,
 * and running one algorithm over both means a flowchart with a branch does
 * not silently fall over. `cycle` and `network` are both radial: a cycle is
 * the case where the ring is also the edge set.
 *
 * Everything is computed in an abstract viewBox space and scaled by the SVG,
 * so nothing here needs to know about `--cell` or the device.
 */

export type DiagramLayoutKind = 'flowchart' | 'tree' | 'network' | 'cycle'
export type NodeShape = 'box' | 'diamond' | 'circle' | 'oval'
export type EdgeStyle = 'solid' | 'dashed'

export interface DiagramNode {
  id: string
  label: string
  description?: string
  shape?: NodeShape
}

export interface DiagramEdge {
  from: string
  to: string
  label?: string
  style?: EdgeStyle
}

export interface PlacedNode extends DiagramNode {
  x: number
  y: number
  /** Half-width and half-height — every boundary test wants these, not the full size. */
  hw: number
  hh: number
}

export interface PlacedEdge extends DiagramEdge {
  /** Clipped to the node boundaries, so the arrowhead lands on the edge of the
   *  shape rather than under it. */
  x1: number
  y1: number
  x2: number
  y2: number
  /** Midpoint, for the edge label. */
  mx: number
  my: number
}

export interface DiagramGeometry {
  nodes: PlacedNode[]
  edges: PlacedEdge[]
  width: number
  height: number
}

const ROW_GAP = 108
const PAD = 28
const CHAR_W = 7.6
const MIN_W = 104
const NODE_H = 46

/** Diamonds need room for the point; circles have to contain the label on both axes. */
function measure(node: DiagramNode): { hw: number; hh: number } {
  const text = Math.max(MIN_W, node.label.length * CHAR_W + 28)
  switch (node.shape) {
    case 'circle': {
      const d = Math.max(text, NODE_H * 1.6)
      return { hw: d / 2, hh: d / 2 }
    }
    case 'diamond':
      return { hw: (text * 1.35) / 2, hh: (NODE_H * 1.5) / 2 }
    default:
      return { hw: text / 2, hh: NODE_H / 2 }
  }
}

/**
 * Distance from a node's centre to its outline along a direction, so an edge
 * can stop at the shape. Closed form per shape — no marching, no sampling.
 */
function boundary(n: PlacedNode, dx: number, dy: number): { x: number; y: number } {
  if (dx === 0 && dy === 0) return { x: n.x, y: n.y }
  let t: number
  switch (n.shape) {
    case 'circle':
    case 'oval':
      // Ellipse: (dx t / hw)² + (dy t / hh)² = 1
      t = 1 / Math.hypot(dx / n.hw, dy / n.hh)
      break
    case 'diamond':
      // Rhombus: |dx t| / hw + |dy t| / hh = 1
      t = 1 / (Math.abs(dx) / n.hw + Math.abs(dy) / n.hh)
      break
    default:
      // Rectangle: whichever axis the ray leaves through first.
      t = Math.min(
        dx === 0 ? Infinity : n.hw / Math.abs(dx),
        dy === 0 ? Infinity : n.hh / Math.abs(dy),
      )
  }
  return { x: n.x + dx * t, y: n.y + dy * t }
}

/** BFS depth from the roots. Cycles are safe: first visit wins, and a graph
 *  with no root at all (a pure ring drawn as a flowchart) seeds on node 0. */
function depths(nodes: DiagramNode[], edges: DiagramEdge[]): Map<string, number> {
  const incoming = new Set(edges.map((e) => e.to))
  const roots = nodes.filter((n) => !incoming.has(n.id)).map((n) => n.id)
  const seeds = roots.length > 0 ? roots : nodes.length > 0 ? [nodes[0].id] : []

  const depth = new Map<string, number>()
  const queue: string[] = []
  for (const id of seeds) {
    depth.set(id, 0)
    queue.push(id)
  }

  for (let head = 0; head < queue.length; head += 1) {
    const id = queue[head]
    const d = depth.get(id) ?? 0
    for (const e of edges) {
      if (e.from !== id || depth.has(e.to)) continue
      depth.set(e.to, d + 1)
      queue.push(e.to)
    }
  }

  // Anything unreachable (a disjoint component) goes on its own final row
  // rather than being dropped — losing a node silently is worse than an
  // imperfect row.
  const maxDepth = depth.size > 0 ? Math.max(...depth.values()) : 0
  for (const n of nodes) if (!depth.has(n.id)) depth.set(n.id, maxDepth + 1)
  return depth
}

function layered(nodes: DiagramNode[], edges: DiagramEdge[]): PlacedNode[] {
  const depth = depths(nodes, edges)
  const rows = new Map<number, DiagramNode[]>()
  for (const n of nodes) {
    const d = depth.get(n.id) ?? 0
    const row = rows.get(d)
    if (row) row.push(n)
    else rows.set(d, [n])
  }

  const placed: PlacedNode[] = []
  const widest = Math.max(
    1,
    ...[...rows.values()].map((row) =>
      row.reduce((sum, n) => sum + measure(n).hw * 2 + 40, -40),
    ),
  )

  for (const [d, row] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    const total = row.reduce((sum, n) => sum + measure(n).hw * 2 + 40, -40)
    let cursor = PAD + (widest - total) / 2
    for (const n of row) {
      const { hw, hh } = measure(n)
      placed.push({ ...n, hw, hh, x: cursor + hw, y: PAD + hh + d * ROW_GAP })
      cursor += hw * 2 + 40
    }
  }
  return placed
}

function radial(nodes: DiagramNode[]): PlacedNode[] {
  const sized = nodes.map((n) => ({ node: n, ...measure(n) }))
  // Radius from the circumference the nodes actually need, so an eight-node
  // cycle and a three-node one are both legible instead of one fixed ring
  // that is too tight for one and absurd for the other.
  const needed = sized.reduce((sum, s) => sum + s.hw * 2 + 44, 0)
  const radius = Math.max(150, needed / (2 * Math.PI))
  const maxHw = Math.max(...sized.map((s) => s.hw))
  const maxHh = Math.max(...sized.map((s) => s.hh))

  return sized.map((s, i) => {
    // Start at the top and go clockwise, which is how a cycle is read.
    const angle = -Math.PI / 2 + (i / sized.length) * Math.PI * 2
    return {
      ...s.node,
      hw: s.hw,
      hh: s.hh,
      x: PAD + maxHw + radius + Math.cos(angle) * radius,
      y: PAD + maxHh + radius + Math.sin(angle) * radius,
    }
  })
}

export function layoutDiagram(
  layout: DiagramLayoutKind,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramGeometry {
  if (nodes.length === 0) return { nodes: [], edges: [], width: 0, height: 0 }

  const placed =
    layout === 'cycle' || layout === 'network' ? radial(nodes) : layered(nodes, edges)
  const byId = new Map(placed.map((n) => [n.id, n]))

  const routed: PlacedEdge[] = []
  for (const e of edges) {
    const a = byId.get(e.from)
    const b = byId.get(e.to)
    // An edge naming a node that does not exist is dropped rather than thrown:
    // generated content should not be able to blank a module (§13.5).
    if (!a || !b) continue
    const dx = b.x - a.x
    const dy = b.y - a.y
    const start = boundary(a, dx, dy)
    const end = boundary(b, -dx, -dy)
    routed.push({
      ...e,
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      mx: (start.x + end.x) / 2,
      my: (start.y + end.y) / 2,
    })
  }

  return {
    nodes: placed,
    edges: routed,
    width: Math.max(...placed.map((n) => n.x + n.hw)) + PAD,
    height: Math.max(...placed.map((n) => n.y + n.hh)) + PAD,
  }
}

/** The reading order used for the text equivalent (§9.3: the graph is SVG and
 *  fully accessible — keep it that way, which means the edges are readable as
 *  sentences and not only as lines). */
export function describeEdges(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): Array<{ key: string; from: string; to: string; label?: string }> {
  const name = new Map(nodes.map((n) => [n.id, n.label]))
  return edges
    .filter((e) => name.has(e.from) && name.has(e.to))
    .map((e, i) => ({
      key: `${e.from}-${e.to}-${i}`,
      from: name.get(e.from) as string,
      to: name.get(e.to) as string,
      label: e.label,
    }))
}
