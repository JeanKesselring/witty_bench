'use client'

import { useMemo, useState } from 'react'
import { CONCEPTS, type Concept, type ConceptKind, type JlptLevel } from '@/lib/api/jkg'
import { Ruby } from '@/components/deck/Japanese'

type MasteryFilter = 'all' | 'proficient' | 'learning' | 'unseen'
type KindGroup = 'all' | 'writing' | 'vocabulary' | 'grammar'

const WRITING: ConceptKind[] = ['kanji', 'katakana', 'hiragana']
const VOCABULARY: ConceptKind[] = ['verb', 'noun', 'adjective', 'particle', 'adverb']
const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export function Explorer() {
  const [kindGroup, setKindGroup] = useState<KindGroup>('all')
  const [level, setLevel] = useState<'all' | JlptLevel>('all')
  const [mastery, setMastery] = useState<MasteryFilter>('all')
  const [selected, setSelected] = useState<string | null>(CONCEPTS[0]?.id ?? null)

  const shown = useMemo(
    () =>
      CONCEPTS.filter((concept) => {
        if (kindGroup === 'writing' && !WRITING.includes(concept.kind)) return false
        if (kindGroup === 'vocabulary' && !VOCABULARY.includes(concept.kind)) return false
        if (kindGroup === 'grammar' && concept.kind !== 'grammar') return false
        if (level !== 'all' && concept.level !== level) return false
        if (mastery !== 'all' && bandOf(concept) !== mastery) return false
        return true
      }),
    [kindGroup, level, mastery],
  )

  const concept = CONCEPTS.find((candidate) => candidate.id === selected) ?? null

  return (
    <div className="k-explorer">
      <div className="k-explorer__toolbar" aria-label="Concept selectors">
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
      </div>

      <div className="k-explorer__body">
        <div className="k-explorer__stage">
          <p className="k-meta">
            {shown.length} of {CONCEPTS.length} concepts
          </p>

          <ul className="k-conceptlist">
            {shown.map((candidate) => (
              <li key={candidate.id}>
                <button
                  type="button"
                  className="k-btn k-btn--quiet k-press"
                  aria-pressed={selected === candidate.id}
                  data-current={selected === candidate.id ? 'true' : undefined}
                  onClick={() => setSelected(candidate.id)}
                >
                  <span className="k-ja" lang="ja">
                    {candidate.name}
                  </span>
                  <small className="k-meta">
                    {candidate.reading ? `${candidate.reading} · ` : ''}
                    {candidate.kind} · {candidate.level}
                  </small>
                </button>
              </li>
            ))}
          </ul>
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

              {concept.examples.length ? (
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
          ) : null}
        </aside>
      </div>
    </div>
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
