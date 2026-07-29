'use client'

import { useMemo, useState } from 'react'
import { CONCEPTS, type Concept, type ConceptKind, type JlptLevel } from '@/lib/api/jkg'
import { Ruby } from '@/components/deck/Japanese'

type View = 'list' | 'graph'
type MasteryFilter = 'all' | 'proficient' | 'learning' | 'unseen'
type KindGroup = 'all' | 'writing' | 'vocabulary' | 'grammar'

const WRITING: ConceptKind[] = ['kanji', 'katakana', 'hiragana']
const VOCABULARY: ConceptKind[] = ['verb', 'noun', 'adjective', 'particle', 'adverb']
const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export function Explorer() {
  const [view, setView] = useState<View>('list')
  const [query, setQuery] = useState('')
  const [kindGroup, setKindGroup] = useState<KindGroup>('all')
  const [level, setLevel] = useState<'all' | JlptLevel>('all')
  const [mastery, setMastery] = useState<MasteryFilter>('all')
  const [overlay, setOverlay] = useState(false)
  const [examples, setExamples] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  const shown = useMemo(
    () =>
      CONCEPTS.filter((concept) => {
        if (
          query &&
          !`${concept.name}${concept.reading ?? ''}${concept.definition}`
            .toLowerCase()
            .includes(query.toLowerCase())
        ) {
          return false
        }
        if (kindGroup === 'writing' && !WRITING.includes(concept.kind)) return false
        if (kindGroup === 'vocabulary' && !VOCABULARY.includes(concept.kind)) return false
        if (kindGroup === 'grammar' && concept.kind !== 'grammar') return false
        if (level !== 'all' && concept.level !== level) return false
        if (mastery !== 'all' && bandOf(concept) !== mastery) return false
        return true
      }),
    [kindGroup, level, mastery, query],
  )

  const concept = CONCEPTS.find((candidate) => candidate.id === selected) ?? null

  return (
    <div className="k-explorer">
      <div className="k-explorer__toolbar" aria-label="Concept selectors">
        <label className="k-inline-select k-inline-select--search">
          <span>Search</span>
          <input
            className="k-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && shown[0]) setSelected(shown[0].id)
              if (event.key === 'Escape') setQuery('')
            }}
            placeholder="Japanese or English"
          />
        </label>

        <label className="k-inline-select">
          <span>Concepts</span>
          <select
            className="k-input"
            value={kindGroup}
            onChange={(event) => setKindGroup(event.target.value as KindGroup)}
          >
            <option value="all">All</option>
            <option value="writing">Writing system</option>
            <option value="vocabulary">Vocabulary</option>
            <option value="grammar">Grammar</option>
          </select>
        </label>

        <label className="k-inline-select">
          <span>JLPT</span>
          <select
            className="k-input"
            value={level}
            onChange={(event) => setLevel(event.target.value as 'all' | JlptLevel)}
          >
            <option value="all">All levels</option>
            {LEVELS.map((candidate) => (
              <option key={candidate} value={candidate}>
                {candidate}
              </option>
            ))}
          </select>
        </label>

        <label className="k-inline-select">
          <span>Mastery</span>
          <select
            className="k-input"
            value={mastery}
            onChange={(event) => setMastery(event.target.value as MasteryFilter)}
          >
            <option value="all">All states</option>
            <option value="proficient">Solid</option>
            <option value="learning">Coming along</option>
            <option value="unseen">Not begun</option>
          </select>
        </label>

        <button
          type="button"
          className="k-btn k-btn--secondary k-press"
          aria-pressed={examples}
          onClick={() => setExamples((current) => !current)}
        >
          Examples
        </button>
        <button
          type="button"
          className="k-btn k-btn--secondary k-press"
          aria-pressed={overlay}
          onClick={() => setOverlay((current) => !current)}
        >
          Mastery overlay
        </button>
        <div className="k-view-switch" role="group" aria-label="Display">
          {(['list', 'graph'] as const).map((candidate) => (
            <button
              key={candidate}
              type="button"
              className="k-btn k-btn--secondary k-press"
              aria-pressed={view === candidate}
              onClick={() => setView(candidate)}
            >
              {candidate === 'list' ? 'List' : 'Graph'}
            </button>
          ))}
        </div>
      </div>

      <div className="k-explorer__body">
        <div className="k-explorer__stage">
          <p className="k-meta">
            {shown.length} of {CONCEPTS.length} concepts
          </p>

          {view === 'list' ? (
            <ul className="k-conceptlist">
              {shown.map((candidate) => (
                <li key={candidate.id}>
                  <button
                    type="button"
                    className="k-btn k-btn--quiet k-press"
                    aria-pressed={selected === candidate.id}
                    data-current={selected === candidate.id ? 'true' : undefined}
                    data-band={overlay ? bandOf(candidate) : undefined}
                    onClick={() => setSelected(candidate.id)}
                  >
                    <span className="k-ja" lang="ja">
                      {candidate.name}
                    </span>
                    <small className="k-meta">
                      {candidate.reading ? `${candidate.reading} · ` : ''}
                      {candidate.kind} · {candidate.level}
                      {overlay ? ` · ${bandLabel(candidate)}` : ''}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ConceptGraph
              concepts={shown}
              overlay={overlay}
              selected={selected}
              onSelect={setSelected}
            />
          )}
        </div>

        <aside className="k-explorer__detail" aria-label="Concept detail">
          {concept ? (
            <>
              <h2 className="k-h2 k-ja" lang="ja">
                {concept.name}
              </h2>
              <p className="k-meta">
                {concept.kind} · {concept.pillar} · {concept.level}
              </p>
              <p>{concept.definition}</p>

              <dl className="k-formula__legend">
                {concept.properties.map((property) => (
                  <div key={property.key}>
                    <dt>{property.key}</dt>
                    <dd>{property.value}</dd>
                  </div>
                ))}
              </dl>

              {concept.strokeOrder ? (
                <p className="k-meta">Stroke order: {concept.strokeOrder.join(' ')}</p>
              ) : null}

              {examples && concept.examples.length ? (
                <ul className="k-examples">
                  {concept.examples.map((example, index) => (
                    <li key={index}>
                      <Ruby segments={example.ja} className="k-ja" />
                      <span className="k-body-sm">{example.en}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <h3 className="k-h3">Connects to</h3>
              <ul className="k-conceptlist">
                {concept.related.map((related) => (
                  <li key={related.id}>
                    <button
                      type="button"
                      className="k-btn k-btn--quiet k-press"
                      onClick={() => setSelected(related.id)}
                    >
                      <span className="k-ja" lang="ja">
                        {related.name}
                      </span>
                      <small className="k-meta">
                        {related.direction === 'to' ? '→' : '←'} {related.relation}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>

              <h3 className="k-h3">How it is going</h3>
              <p>
                {concept.recall === null
                  ? 'Not begun. Nothing to report yet.'
                  : `${bandLabel(concept)} · ${concept.reviews} reviews, ${concept.lapses} lapses.`}
              </p>
              {concept.history.length > 1 ? <Spark values={concept.history} /> : null}

              <a className="k-btn k-btn--primary k-press" href="/japanese/lesson">
                Practise this now
              </a>
            </>
          ) : (
            <p className="k-meta">Choose a concept to read about it.</p>
          )}
        </aside>
      </div>
    </div>
  )
}

function ConceptGraph({
  concepts,
  overlay,
  selected,
  onSelect,
}: {
  concepts: Concept[]
  overlay: boolean
  selected: string | null
  onSelect: (id: string) => void
}) {
  const radius = 140
  const centre = { x: 200, y: 180 }
  const placed = concepts.map((concept, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(1, concepts.length)) * Math.PI * 2
    return {
      concept,
      x: centre.x + Math.cos(angle) * radius,
      y: centre.y + Math.sin(angle) * radius,
    }
  })
  const at = new Map(placed.map((position) => [position.concept.id, position]))

  return (
    <svg className="k-conceptgraph" viewBox="0 0 400 360" role="group" aria-label="Concept graph">
      {placed.flatMap((position) =>
        position.concept.related
          .filter((related) => at.has(related.id))
          .map((related) => {
            const other = at.get(related.id)!
            return (
              <line
                key={`${position.concept.id}-${related.id}`}
                x1={position.x}
                y1={position.y}
                x2={other.x}
                y2={other.y}
                className="k-conceptgraph__edge"
              />
            )
          }),
      )}
      {placed.map((position) => (
        <g
          key={position.concept.id}
          transform={`translate(${position.x} ${position.y})`}
          tabIndex={0}
          role="button"
          aria-pressed={selected === position.concept.id}
          aria-label={`${position.concept.name}. ${position.concept.definition}`}
          data-band={overlay ? bandOf(position.concept) : undefined}
          data-current={selected === position.concept.id ? 'true' : undefined}
          className="k-conceptgraph__node"
          onClick={() => onSelect(position.concept.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onSelect(position.concept.id)
            }
          }}
        >
          <rect x={-34} y={-18} width={68} height={36} />
          <text textAnchor="middle" dy="0.35em">
            {position.concept.name}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Spark({ values }: { values: number[] }) {
  const width = 120
  const height = 32
  const points = values
    .map((value, index) => `${(index / (values.length - 1)) * width},${height - value * height}`)
    .join(' ')
  return (
    <svg
      className="k-spark"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Recent recall, ${values.length} reviews`}
    >
      <polyline points={points} fill="none" />
    </svg>
  )
}

function bandOf(concept: Concept): Exclude<MasteryFilter, 'all'> {
  if (concept.recall === null) return 'unseen'
  return concept.recall >= 0.8 ? 'proficient' : 'learning'
}

function bandLabel(concept: Concept): string {
  const band = bandOf(concept)
  return band === 'proficient' ? 'Solid' : band === 'learning' ? 'Coming along' : 'Not begun'
}
