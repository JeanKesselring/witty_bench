import { useMemo, useState, type CSSProperties } from 'react'

import atlasImage from '../../assets/knowledge-topic-atlas.jpg'
import { FrostedWorldMap, type MapGuess } from '../FrostedWorldMap'
import { ModuleFrame, ModuleStatus } from './ModuleFrame'

export function CommonMistakesModule() {
  const mistakes = [
    ['Myth', 'Seasons happen because Earth moves closer to the Sun.'],
    ['Correction', 'Earth’s axial tilt changes the angle and duration of sunlight.'],
  ]
  const [open, setOpen] = useState(0)

  return (
    <ModuleFrame code="CM" kind="Concept repair" title="Common mistakes">
      <div className="mistake-switch">
        {mistakes.map(([label, text], index) => (
          <button
            data-active={open === index}
            key={label}
            onClick={() => setOpen(index)}
            type="button"
          >
            <span>{label}</span>
            <strong>{open === index ? text : 'Tap to inspect'}</strong>
          </button>
        ))}
      </div>
    </ModuleFrame>
  )
}

export function ComparisonModule() {
  return (
    <ModuleFrame code="VS" kind="Compare" title="Weather vs climate">
      <div className="comparison-grid">
        <section>
          <span>Weather</span>
          <strong>Now</strong>
          <p>Short-term atmospheric conditions in a specific place.</p>
        </section>
        <section>
          <span>Climate</span>
          <strong>Pattern</strong>
          <p>Long-term tendencies measured across decades.</p>
        </section>
      </div>
    </ModuleFrame>
  )
}

export function ConversionCalculatorModule() {
  const [kilometers, setKilometers] = useState(42)
  const miles = kilometers * 0.621371

  return (
    <ModuleFrame
      code="CV"
      kind="Tool"
      title="Distance converter"
      footer={<span>1 kilometer = 0.621371 miles</span>}
    >
      <div className="conversion-module">
        <label>
          <span>Kilometers</span>
          <input
            min="0"
            onChange={(event) => setKilometers(Number(event.target.value))}
            type="number"
            value={kilometers}
          />
        </label>
        <span aria-hidden="true">→</span>
        <output>
          <span>Miles</span>
          <strong>{miles.toFixed(2)}</strong>
        </output>
      </div>
    </ModuleFrame>
  )
}

export function DiagramSchematicModule() {
  const nodes = [
    ['Light', 'Photons excite chlorophyll.'],
    ['Water', 'Roots supply electrons.'],
    ['Glucose', 'Chemical energy is stored.'],
  ]
  const [active, setActive] = useState(0)

  return (
    <ModuleFrame code="DG" kind="System map" title="Photosynthesis">
      <div className="schematic-module">
        <div className="schematic-module__flow">
          {nodes.map(([label], index) => (
            <button
              data-active={active === index}
              key={label}
              onClick={() => setActive(index)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {label}
            </button>
          ))}
        </div>
        <p>{nodes[active][1]}</p>
      </div>
    </ModuleFrame>
  )
}

export function FormulaEquationModule() {
  const variables = [
    ['F', 'force · newtons'],
    ['m', 'mass · kilograms'],
    ['a', 'acceleration · m/s²'],
  ]
  const [active, setActive] = useState('F')

  return (
    <ModuleFrame code="FX" kind="Equation" title="Newton’s second law">
      <div className="formula-module">
        <strong>F = m × a</strong>
        <div>
          {variables.map(([symbol, label]) => (
            <button
              data-active={active === symbol}
              key={symbol}
              onClick={() => setActive(symbol)}
              type="button"
            >
              <b>{symbol}</b>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </ModuleFrame>
  )
}

export function GlobePinModule() {
  const pins = [
    { label: 'Quito', x: 29, y: 59 },
    { label: 'Lima', x: 32, y: 70 },
    { label: 'Santiago', x: 36, y: 83 },
  ]
  const [active, setActive] = useState(0)

  return (
    <ModuleFrame code="GP" kind="Reference map" title="Andean cities">
      <div className="globe-pin-module">
        <svg aria-label="Stylized map of South America" viewBox="0 0 100 100">
          <path d="M24 10 48 8l17 12 7 20-10 17-8 28-12 12-7-25-15-25 5-17-8-9Z" />
        </svg>
        {pins.map((pin, index) => (
          <button
            aria-label={pin.label}
            data-active={active === index}
            key={pin.label}
            onClick={() => setActive(index)}
            style={{ '--pin-x': `${pin.x}%`, '--pin-y': `${pin.y}%` } as CSSProperties}
            type="button"
          />
        ))}
        <span>{pins[active].label}</span>
      </div>
    </ModuleFrame>
  )
}

export function HeroImageModule() {
  return (
    <ModuleFrame code="HI" kind="Visual anchor" title="Knowledge atlas">
      <figure className="hero-module">
        <img alt="A colorful knowledge atlas laid out on a table" src={atlasImage} />
        <figcaption>
          <span>Field study · 04</span>
          <strong>Every topic has a landscape.</strong>
        </figcaption>
      </figure>
    </ModuleFrame>
  )
}

export function InputOutputBalanceModule() {
  const [focus, setFocus] = useState<'input' | 'output'>('input')

  return (
    <ModuleFrame code="IO" kind="Balance" title="Cellular respiration">
      <div className="balance-module" data-focus={focus}>
        <button onClick={() => setFocus('input')} type="button">
          <span>Inputs</span>
          <strong>Glucose + oxygen</strong>
          <small>C₆H₁₂O₆ + 6O₂</small>
        </button>
        <i aria-hidden="true">⇄</i>
        <button onClick={() => setFocus('output')} type="button">
          <span>Outputs</span>
          <strong>ATP + water + CO₂</strong>
          <small>usable cellular energy</small>
        </button>
      </div>
    </ModuleFrame>
  )
}

export function KeyValuePairsModule() {
  const rows = [
    ['Class', 'Mammalia'],
    ['Order', 'Carnivora'],
    ['Family', 'Felidae'],
    ['Range', 'Africa · Asia'],
  ]

  return (
    <ModuleFrame code="KV" kind="Facts" title="Lion taxonomy">
      <dl className="key-value-module">
        {rows.map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </ModuleFrame>
  )
}

export function MapClickQuizModule() {
  const [guess, setGuess] = useState<MapGuess | null>(null)

  return (
    <ModuleFrame
      code="MQ"
      kind="Geography exercise"
      title="Find the Andes"
      footer={
        <ModuleStatus tone={guess ? (guess.correct ? 'right' : 'wrong') : 'neutral'}>
          {!guess ? 'Choose a 300 km square' : guess.correct ? 'Range found' : 'Try farther west'}
        </ModuleStatus>
      }
    >
      <div className="catalog-map-module">
        <FrostedWorldMap gridSizeKm={300} onGuess={setGuess} />
      </div>
    </ModuleFrame>
  )
}

export function Model3DModule() {
  const [rotation, setRotation] = useState(24)

  return (
    <ModuleFrame code="3D" kind="Model" title="Molecular geometry">
      <div className="model-module">
        <div
          className="model-module__object"
          style={{ '--model-rotation': `${rotation}deg` } as CSSProperties}
        >
          <i /><i /><i /><i />
          <span /><span /><span />
        </div>
        <label>
          <span>Rotate model</span>
          <input
            aria-label="Rotate molecular model"
            max="180"
            min="-180"
            onChange={(event) => setRotation(Number(event.target.value))}
            type="range"
            value={rotation}
          />
        </label>
      </div>
    </ModuleFrame>
  )
}

export function StatBoxesModule() {
  const stats = [
    ['4.54B', 'years old'],
    ['12,742', 'km diameter'],
    ['71%', 'water cover'],
  ]

  return (
    <ModuleFrame code="ST" kind="Numbers" title="Planet Earth">
      <div className="stat-module">
        {stats.map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </ModuleFrame>
  )
}

export function TimelineModule() {
  const events = [
    ['1969', 'ARPANET sends its first message.'],
    ['1989', 'The World Wide Web is proposed.'],
    ['1993', 'Mosaic makes the web visual.'],
  ]
  const [active, setActive] = useState(0)

  return (
    <ModuleFrame code="TL" kind="Chronology" title="The early internet">
      <div className="timeline-module">
        <nav aria-label="Timeline years">
          {events.map(([year], index) => (
            <button
              aria-current={active === index ? 'step' : undefined}
              key={year}
              onClick={() => setActive(index)}
              type="button"
            >
              {year}
            </button>
          ))}
        </nav>
        <strong>{events[active][1]}</strong>
      </div>
    </ModuleFrame>
  )
}

export function TimelineDragExerciseModule() {
  const correctOrder = ['Observe', 'Question', 'Test', 'Conclude']
  const [order, setOrder] = useState(['Test', 'Observe', 'Conclude', 'Question'])
  const [dragged, setDragged] = useState<string | null>(null)
  const correct = order.every((item, index) => item === correctOrder[index])

  const move = (target: string) => {
    if (!dragged || dragged === target) return
    setOrder((current) => {
      const next = [...current]
      const from = next.indexOf(dragged)
      const to = next.indexOf(target)
      ;[next[from], next[to]] = [next[to], next[from]]
      return next
    })
  }

  return (
    <ModuleFrame
      code="TD"
      kind="Ordering exercise"
      title="Scientific method"
      footer={<ModuleStatus tone={correct ? 'right' : 'neutral'}>{correct ? 'Sequence complete' : 'Drag to reorder'}</ModuleStatus>}
    >
      <div className="drag-timeline-module">
        {order.map((item, index) => (
          <button
            draggable
            key={item}
            onDragEnd={() => setDragged(null)}
            onDragOver={(event) => event.preventDefault()}
            onDragStart={() => setDragged(item)}
            onDrop={() => move(item)}
            type="button"
          >
            <span>{index + 1}</span>
            {item}
          </button>
        ))}
      </div>
    </ModuleFrame>
  )
}

export function TopicCardModule() {
  const [expanded, setExpanded] = useState(false)
  const topics = useMemo(() => ['Plate tectonics', 'Rock cycle', 'Deep time'], [])

  return (
    <ModuleFrame code="TC" kind="Topic" title="Geology">
      <button
        aria-expanded={expanded}
        className="topic-module"
        onClick={() => setExpanded((value) => !value)}
        type="button"
      >
        <span>Earth systems · 03 concepts</span>
        <strong>How the solid Earth changes.</strong>
        {expanded && (
          <ul>
            {topics.map((topic) => <li key={topic}>{topic}</li>)}
          </ul>
        )}
        <small>{expanded ? 'Collapse' : 'Open topic'} ↗</small>
      </button>
    </ModuleFrame>
  )
}

