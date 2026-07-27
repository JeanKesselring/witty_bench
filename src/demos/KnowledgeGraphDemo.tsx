import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import { ThemeToggle } from '../components/ThemeToggle'
import { buildFillMask, mulberry32 } from '../frost/grid'
import { GradientSurface } from '../shader/GradientSurface'
import { preset } from '../shader/presets'
import { useTheme } from '../theme/themeContext'

type Topic = {
  id: string
  title: string
  short: string
  kind: string
  description: string
  span: 1 | 2 | 3 | 4
  children?: Topic[]
}

type TileRect = {
  x: number
  y: number
  w: number
  h: number
}

const GRAPH: Topic = {
  id: 'knowledge',
  title: 'Knowledge',
  short: 'K',
  kind: 'Root field',
  description: 'A living map of ideas, arranged by containment rather than connection lines.',
  span: 4,
  children: [
    {
      id: 'life-sciences',
      title: 'Life sciences',
      short: 'LS',
      kind: 'Super topic',
      description: 'How living systems are built, inherited, adapted, and connected.',
      span: 4,
      children: [
        {
          id: 'cell-biology',
          title: 'Cell biology',
          short: 'CB',
          kind: 'Topic',
          description: 'The structures and processes that make a cell work.',
          span: 3,
          children: [
            { id: 'nucleus', title: 'Nucleus', short: 'NU', kind: 'Atomic topic', description: 'Stores and protects most cellular DNA.', span: 1 },
            { id: 'membrane', title: 'Cell membrane', short: 'ME', kind: 'Atomic topic', description: 'Controls exchange between the cell and its environment.', span: 1 },
            { id: 'mitochondria', title: 'Mitochondria', short: 'MI', kind: 'Atomic topic', description: 'Converts chemical energy into usable ATP.', span: 1 },
            { id: 'ribosomes', title: 'Ribosomes', short: 'RI', kind: 'Atomic topic', description: 'Build proteins from RNA instructions.', span: 1 },
            { id: 'cytoplasm', title: 'Cytoplasm', short: 'CY', kind: 'Atomic topic', description: 'The fluid environment where cellular work happens.', span: 1 },
          ],
        },
        {
          id: 'genetics',
          title: 'Genetics',
          short: 'GE',
          kind: 'Topic',
          description: 'How biological information is stored, expressed, and inherited.',
          span: 2,
          children: [
            { id: 'dna', title: 'DNA', short: 'DN', kind: 'Atomic topic', description: 'The molecule carrying hereditary instructions.', span: 1 },
            { id: 'genes', title: 'Genes', short: 'GN', kind: 'Atomic topic', description: 'Functional regions of inherited information.', span: 1 },
            { id: 'expression', title: 'Gene expression', short: 'EX', kind: 'Atomic topic', description: 'Turning genetic information into cell function.', span: 1 },
          ],
        },
        {
          id: 'ecology',
          title: 'Ecology',
          short: 'EC',
          kind: 'Topic',
          description: 'Relationships between organisms and their environments.',
          span: 2,
          children: [
            { id: 'ecosystems', title: 'Ecosystems', short: 'ES', kind: 'Atomic topic', description: 'Communities interacting with their physical world.', span: 1 },
            { id: 'food-webs', title: 'Food webs', short: 'FW', kind: 'Atomic topic', description: 'Networks of energy transfer between organisms.', span: 1 },
          ],
        },
        { id: 'evolution', title: 'Evolution', short: 'EV', kind: 'Atomic topic', description: 'Change in inherited traits across generations.', span: 1 },
      ],
    },
    {
      id: 'earth-systems',
      title: 'Earth systems',
      short: 'ES',
      kind: 'Super topic',
      description: 'The interacting processes that shape the planet.',
      span: 3,
      children: [
        {
          id: 'geology',
          title: 'Geology',
          short: 'GL',
          kind: 'Topic',
          description: 'Earth materials, structures, and deep history.',
          span: 2,
          children: [
            { id: 'tectonics', title: 'Plate tectonics', short: 'PT', kind: 'Atomic topic', description: 'Movement of Earth’s rigid outer plates.', span: 1 },
            { id: 'rock-cycle', title: 'Rock cycle', short: 'RC', kind: 'Atomic topic', description: 'How rocks transform between major forms.', span: 1 },
          ],
        },
        { id: 'climate', title: 'Climate', short: 'CL', kind: 'Atomic topic', description: 'Long-term patterns in atmosphere and oceans.', span: 1 },
        { id: 'oceans', title: 'Oceans', short: 'OC', kind: 'Atomic topic', description: 'The connected body of salt water shaping life and weather.', span: 1 },
      ],
    },
    {
      id: 'computing',
      title: 'Computing',
      short: 'CO',
      kind: 'Super topic',
      description: 'Systems for representing, transforming, and communicating information.',
      span: 4,
      children: [
        {
          id: 'intelligence',
          title: 'Machine intelligence',
          short: 'AI',
          kind: 'Topic',
          description: 'Systems that learn patterns and act on them.',
          span: 3,
          children: [
            { id: 'models', title: 'Models', short: 'MO', kind: 'Atomic topic', description: 'Learned representations used to make predictions.', span: 1 },
            { id: 'training', title: 'Training', short: 'TR', kind: 'Atomic topic', description: 'The process of adapting model parameters from examples.', span: 1 },
            { id: 'inference', title: 'Inference', short: 'IN', kind: 'Atomic topic', description: 'Using a trained model to produce an output.', span: 1 },
            { id: 'evaluation', title: 'Evaluation', short: 'EV', kind: 'Atomic topic', description: 'Measuring model behavior against meaningful criteria.', span: 1 },
          ],
        },
        {
          id: 'programming',
          title: 'Programming',
          short: 'PR',
          kind: 'Topic',
          description: 'Expressing procedures in forms computers can execute.',
          span: 2,
          children: [
            { id: 'algorithms', title: 'Algorithms', short: 'AL', kind: 'Atomic topic', description: 'Finite procedures for solving classes of problems.', span: 1 },
            { id: 'data-structures', title: 'Data structures', short: 'DS', kind: 'Atomic topic', description: 'Ways of organizing information for use.', span: 1 },
          ],
        },
        { id: 'networks', title: 'Networks', short: 'NW', kind: 'Atomic topic', description: 'Systems that exchange information across links.', span: 1 },
        { id: 'interfaces', title: 'Interfaces', short: 'UI', kind: 'Atomic topic', description: 'Boundaries where people and systems meet.', span: 1 },
      ],
    },
    {
      id: 'society',
      title: 'Society & culture',
      short: 'SC',
      kind: 'Super topic',
      description: 'How people create meaning, institutions, and shared worlds.',
      span: 3,
      children: [
        { id: 'history', title: 'History', short: 'HI', kind: 'Atomic topic', description: 'Interpretations of human change through time.', span: 1 },
        { id: 'language', title: 'Language', short: 'LA', kind: 'Atomic topic', description: 'Structured systems for making and sharing meaning.', span: 1 },
        { id: 'economics', title: 'Economics', short: 'EC', kind: 'Atomic topic', description: 'How people allocate resources and coordinate exchange.', span: 1 },
        { id: 'design', title: 'Design', short: 'DE', kind: 'Atomic topic', description: 'Intentional shaping of objects, systems, and experiences.', span: 1 },
      ],
    },
  ],
}

const TOPIC_SKILL: Record<string, number> = {
  knowledge: 56,
  'life-sciences': 72,
  'cell-biology': 81,
  nucleus: 86,
  membrane: 64,
  mitochondria: 92,
  ribosomes: 61,
  cytoplasm: 48,
  genetics: 58,
  dna: 76,
  genes: 68,
  expression: 40,
  ecology: 45,
  ecosystems: 51,
  'food-webs': 36,
  evolution: 67,
  'earth-systems': 61,
  geology: 54,
  tectonics: 73,
  'rock-cycle': 43,
  climate: 57,
  oceans: 69,
  computing: 78,
  intelligence: 66,
  models: 71,
  training: 52,
  inference: 88,
  evaluation: 47,
  programming: 82,
  algorithms: 74,
  'data-structures': 69,
  networks: 57,
  interfaces: 91,
  society: 49,
  history: 63,
  language: 77,
  economics: 38,
  design: 84,
}

function findPath(root: Topic, id: string, path: Topic[] = []): Topic[] | null {
  const nextPath = [...path, root]
  if (root.id === id) return nextPath
  for (const child of root.children ?? []) {
    const match = findPath(child, id, nextPath)
    if (match) return match
  }
  return null
}

function countDescendants(topic: Topic): number {
  return (topic.children ?? []).reduce((total, child) => total + 1 + countDescendants(child), 0)
}

function mixColor(from: string, to: string, amount: number) {
  const parse = (hex: string) => {
    const value = Number.parseInt(hex.slice(1), 16)
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  }
  const start = parse(from)
  const end = parse(to)
  return `#${start
    .map((channel, index) =>
      Math.round(channel + (end[index] - channel) * amount)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

function skillColor(value: number) {
  const clamped = Math.max(0, Math.min(100, value))
  return clamped <= 50
    ? mixColor('#f13f38', '#f1d36a', clamped / 50)
    : mixColor('#f1d36a', '#84d292', (clamped - 50) / 50)
}

function skillFor(topic: Topic) {
  return TOPIC_SKILL[topic.id] ?? 50
}

function GraphBrand() {
  return (
    <a className="grid-brand" href="#/" aria-label="Kite learning field">
      <span className="grid-brand__mark" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      <strong>kite</strong>
      <span>knowledge graph / 03</span>
    </a>
  )
}

/**
 * Recursively partitions the available cells and scores candidates by their
 * worst aspect ratio plus a small area-consistency penalty. This makes sparse
 * levels fill the field while avoiding strips and tiny one-cell siblings.
 */
function buildBalancedLayout(count: number, cols: number, minimumRows: number): TileRect[] {
  if (count <= 0) return []
  const rows = Math.max(minimumRows, Math.ceil(count / Math.max(1, cols)) * 3)
  const memo = new Map<string, TileRect[]>()

  const score = (rects: TileRect[], width: number, height: number) => {
    const averageArea = (width * height) / rects.length
    const worstAspect = Math.max(
      ...rects.map((rect) => Math.max(rect.w / rect.h, rect.h / rect.w)),
    )
    const areaSpread = Math.max(
      ...rects.map((rect) => Math.abs(rect.w * rect.h - averageArea) / averageArea),
    )
    return (worstAspect > 2 ? 100 + (worstAspect - 2) * 10 : worstAspect) + areaSpread * 0.65
  }

  const solve = (items: number, width: number, height: number): TileRect[] => {
    if (items === 1) return [{ x: 0, y: 0, w: width, h: height }]
    const key = `${items}:${width}:${height}`
    const cached = memo.get(key)
    if (cached) return cached

    let best: TileRect[] | null = null
    let bestScore = Number.POSITIVE_INFINITY

    for (let firstCount = 1; firstCount < items; firstCount += 1) {
      const secondCount = items - firstCount

      for (let cut = 1; cut < width; cut += 1) {
        if (cut * height < firstCount || (width - cut) * height < secondCount) continue
        const first = solve(firstCount, cut, height)
        const second = solve(secondCount, width - cut, height).map((rect) => ({
          ...rect,
          x: rect.x + cut,
        }))
        const candidate = [...first, ...second]
        const candidateScore = score(candidate, width, height)
        if (candidateScore < bestScore) {
          best = candidate
          bestScore = candidateScore
        }
      }

      for (let cut = 1; cut < height; cut += 1) {
        if (width * cut < firstCount || width * (height - cut) < secondCount) continue
        const first = solve(firstCount, width, cut)
        const second = solve(secondCount, width, height - cut).map((rect) => ({
          ...rect,
          y: rect.y + cut,
        }))
        const candidate = [...first, ...second]
        const candidateScore = score(candidate, width, height)
        if (candidateScore < bestScore) {
          best = candidate
          bestScore = candidateScore
        }
      }
    }

    const result = best ?? [{ x: 0, y: 0, w: width, h: height }]
    memo.set(key, result)
    return result
  }

  return solve(count, cols, rows)
}

function makeGraphFrost(cols: number, rows: number) {
  const random = mulberry32(cols * 41 + rows * 73)
  return Array.from({ length: cols * rows }, (_, index) => {
    const x = index % cols
    const y = Math.floor(index / cols)
    return random() < (((x * 2 + y) % 9 < 3) ? 0.5 : 0.16)
  })
}

function KnowledgeFieldBackground({
  palette,
}: {
  palette: [string, string, string]
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [grid, setGrid] = useState({ cols: 1, rows: 1, cell: 64 })
  const [frost, setFrost] = useState<boolean[]>([true])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => {
      const cell = window.matchMedia('(max-width: 820px)').matches ? 56 : 64
      const cols = Math.max(1, Math.ceil(stage.clientWidth / cell))
      const rows = Math.max(1, Math.ceil(stage.clientHeight / cell))
      setGrid((current) =>
        current.cols === cols && current.rows === rows && current.cell === cell
          ? current
          : { cols, rows, cell },
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

  useEffect(() => {
    setFrost(makeGraphFrost(grid.cols, grid.rows))
  }, [grid.cols, grid.rows])

  const mask = useMemo(
    () => buildFillMask(frost.map((cell) => (cell ? 1 : 0)), grid.cols, grid.rows),
    [frost, grid.cols, grid.rows],
  )
  const layerStyle = {
    left: `calc(50% - ${Math.floor(grid.cols / 2) * grid.cell}px)`,
    width: `${grid.cols * grid.cell}px`,
    height: `${grid.rows * grid.cell}px`,
    gridTemplateColumns: `repeat(${grid.cols}, ${grid.cell}px)`,
    gridTemplateRows: `repeat(${grid.rows}, ${grid.cell}px)`,
  }

  return (
    <div className="kg-material" ref={stageRef}>
      <GradientSurface
        className="kg-material__gradient"
        config={preset({
          color1: palette[0],
          color2: palette[1],
          color3: palette[2],
          uSpeed: 0.025,
          uStrength: 1.45,
          uDensity: 1.15,
          uFrequency: 4.5,
          cDistance: 4.4,
          cPolarAngle: 110,
          cAzimuthAngle: 170,
          positionX: -0.35,
          positionY: 0.05,
          rotationZ: 150,
          brightness: 1.05,
          reflection: 0.08,
        })}
        portrait={{ cDistance: 5.5, positionY: -0.3 }}
        compact={{ cPolarAngle: 100 }}
        phone={{ cDistance: 6.2, cameraZoom: 0.85 }}
        maxScale={1.1}
      />
      <div className="field-material__grain" aria-hidden="true" />
      <div
        className="kg-material__frost"
        aria-hidden="true"
        style={{
          ...layerStyle,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      <div
        className="kg-material__hits"
        role="group"
        aria-label="Interactive knowledge field background"
        style={layerStyle}
      >
        {frost.map((active, index) => (
          <button
            key={index}
            type="button"
            aria-label={`${active ? 'Clear' : 'Frost'} background tile ${index + 1}`}
            aria-pressed={active}
            onClick={() =>
              setFrost((current) =>
                current.map((value, cell) => (cell === index ? !value : value)),
              )
            }
          />
        ))}
      </div>
    </div>
  )
}

function TopicTile({
  topic,
  rect,
  selected,
  onSelect,
  onOpen,
}: {
  topic: Topic
  rect: TileRect
  selected: boolean
  onSelect: () => void
  onOpen: () => void
}) {
  const hasChildren = Boolean(topic.children?.length)
  const previewLayout = buildBalancedLayout(
    topic.children?.length ?? 0,
    rect.w,
    Math.max(1, rect.h - 1),
  )
  const style = {
    '--topic-w': rect.w,
    '--topic-h': rect.h,
    '--skill-color': skillColor(skillFor(topic)),
    gridColumn: `${rect.x + 1} / span ${rect.w}`,
    gridRow: `${rect.y + 1} / span ${rect.h}`,
  } as CSSProperties

  return (
    <button
      className="kg-topic"
      data-selected={selected}
      data-branch={hasChildren}
      style={style}
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpen}
      aria-pressed={selected}
      aria-label={`${topic.title}, ${topic.kind}`}
    >
      <span className="kg-topic__code">{topic.short}</span>
      <span className="kg-topic__depth">{hasChildren ? `${topic.children!.length} inside` : 'atomic'}</span>
      <strong>{topic.title}</strong>
      {hasChildren && (
        <span
          className="kg-topic__preview"
          aria-hidden="true"
          style={{
            gridTemplateColumns: `repeat(${rect.w}, var(--cell))`,
            gridTemplateRows: `repeat(${Math.max(1, rect.h - 1)}, var(--cell))`,
          }}
        >
          {topic.children!.map((child, index) => {
            const childRect = previewLayout[index]
            return (
              <i
                key={child.id}
                style={{
                  '--child-skill': skillColor(skillFor(child)),
                  gridColumn: `${childRect.x + 1} / span ${childRect.w}`,
                  gridRow: `${childRect.y + 1} / span ${childRect.h}`,
                } as CSSProperties}
              >
                <b>{child.title}</b>
                <small>{child.children?.length ? `${child.children.length} inside` : child.short}</small>
              </i>
            )
          })}
        </span>
      )}
    </button>
  )
}

export function KnowledgeGraphDemo() {
  const { theme } = useTheme()
  const sceneRef = useRef<HTMLElement>(null)
  const [currentId, setCurrentId] = useState(GRAPH.id)
  const [selectedId, setSelectedId] = useState(GRAPH.children![0].id)
  const [transitioning, setTransitioning] = useState(false)
  const [sceneGrid, setSceneGrid] = useState({ cols: 14, rows: 8, cell: 64 })
  const path = useMemo(() => findPath(GRAPH, currentId) ?? [GRAPH], [currentId])
  const current = path[path.length - 1]
  const topics = current.children ?? []
  const layout = useMemo(
    () => buildBalancedLayout(topics.length, sceneGrid.cols, sceneGrid.rows),
    [topics.length, sceneGrid.cols, sceneGrid.rows],
  )
  const selected =
    topics.find((topic) => topic.id === selectedId) ??
    topics[0] ??
    current

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const measure = () => {
      const cell = window.matchMedia('(max-width: 820px)').matches ? 56 : 64
      const cols = Math.max(4, Math.floor(scene.clientWidth / cell))
      const reservedHeight = window.matchMedia('(max-width: 820px)').matches ? 280 : 320
      const rows = Math.max(8, Math.ceil((window.innerHeight - reservedHeight) / cell))
      setSceneGrid((currentGrid) =>
        currentGrid.cols === cols &&
        currentGrid.rows === rows &&
        currentGrid.cell === cell
          ? currentGrid
          : { cols, rows, cell },
      )
    }
    measure()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    observer?.observe(scene)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const moveTo = (topic: Topic) => {
    if (topic.id === current.id || transitioning) return
    setTransitioning(true)
    window.setTimeout(() => {
      setCurrentId(topic.id)
      setSelectedId(topic.children![0]?.id ?? topic.id)
      setTransitioning(false)
    }, 180)
  }

  const moveUp = () => {
    if (path.length <= 1 || transitioning) return
    const parent = path[path.length - 2]
    setTransitioning(true)
    window.setTimeout(() => {
      setCurrentId(parent.id)
      setSelectedId(current.id)
      setTransitioning(false)
    }, 180)
  }

  const palette =
    theme === 'dark'
      ? ['#102a43', '#193c60', '#285b84'] as [string, string, string]
      : ['#b9dcf2', '#82b8e4', '#d5e9f7'] as [string, string, string]

  return (
    <div className="field-app kg-app">
      <a className="skip-link" href="#graph-field">Skip to knowledge graph</a>
      <KnowledgeFieldBackground palette={palette} />

      <header className="field-topbar kg-topbar">
        <GraphBrand />
        <nav className="kg-page-nav" aria-label="Main pages">
          <a href="#/">Learning field</a>
          <a href="#/knowledge-graph" aria-current="page">Knowledge graph</a>
          <a href="#/modules">Modules</a>
        </nav>
        <div className="field-topbar__tools">
          <span className="field-index">{countDescendants(GRAPH)} topics · depth {path.length - 1}</span>
          <ThemeToggle />
          <button className="field-avatar" type="button" aria-label="Open Alex's profile">AM</button>
        </div>
      </header>

      <main className="kg-main" id="graph-field">
        <section className="kg-head">
          <div>
            <span>Kite / spatial knowledge instrument</span>
            <h1>{current.title}</h1>
          </div>
          <p>
            Topics contain topics. Hover or select to preview a topic’s contents, then open
            it from the inspector to make it the new field.
          </p>
        </section>

        <nav className="kg-breadcrumbs" aria-label="Topic depth">
          <button type="button" onClick={moveUp} disabled={path.length === 1}>
            <span aria-hidden="true">↑</span> Up one level
          </button>
          <ol>
            {path.map((topic, index) => (
              <li key={topic.id}>
                <button
                  type="button"
                  aria-current={index === path.length - 1 ? 'page' : undefined}
                  onClick={() => {
                    if (topic.id === current.id) return
                    setCurrentId(topic.id)
                    setSelectedId(path[index + 1]?.id ?? topic.children?.[0]?.id ?? topic.id)
                  }}
                >
                  {topic.title}
                </button>
              </li>
            ))}
          </ol>
          <span>Level {String(path.length - 1).padStart(2, '0')}</span>
        </nav>

        <div className="kg-workspace">
          <section
            className="kg-scene"
            data-transitioning={transitioning}
            aria-label={`Topics inside ${current.title}`}
            ref={sceneRef}
            style={{ minHeight: `${sceneGrid.rows * sceneGrid.cell}px` }}
          >
            <div
              className="kg-scene__topics"
              style={{
                width: `${sceneGrid.cols * sceneGrid.cell}px`,
                height: `${sceneGrid.rows * sceneGrid.cell}px`,
                gridTemplateColumns: `repeat(${sceneGrid.cols}, ${sceneGrid.cell}px)`,
                gridTemplateRows: `repeat(${sceneGrid.rows}, ${sceneGrid.cell}px)`,
              }}
            >
              {topics.length ? (
                topics.map((topic, index) => (
                  <TopicTile
                    key={topic.id}
                    topic={topic}
                    rect={layout[index]}
                    selected={selected.id === topic.id}
                    onSelect={() => setSelectedId(topic.id)}
                    onOpen={() => moveTo(topic)}
                  />
                ))
              ) : (
                <div
                  className="kg-empty"
                  style={{ '--skill-color': skillColor(skillFor(current)) } as CSSProperties}
                >
                  <span>{current.short}</span>
                  <strong>{current.title}</strong>
                  <p>This is an atomic topic—the smallest square in this graph.</p>
                </div>
              )}
            </div>
          </section>

          <aside className="kg-inspector" aria-live="polite">
            <div className="kg-inspector__copy">
              <h2>{selected.title}</h2>
              <p>{selected.description}</p>
            </div>
            {selected.id !== current.id && (
              <button
                className="kg-inspector__open"
                type="button"
                onClick={() => moveTo(selected)}
              >
                Open topic
                <span aria-hidden="true">↘</span>
              </button>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}
