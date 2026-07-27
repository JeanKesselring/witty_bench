import { useMemo, useState, type ComponentType } from 'react'

import {
  CommonMistakesModule,
  ComparisonModule,
  ConversionCalculatorModule,
  DiagramSchematicModule,
  FormulaEquationModule,
  GlobePinModule,
  HeroImageModule,
  InputOutputBalanceModule,
  KeyValuePairsModule,
  MapClickQuizModule,
  Model3DModule,
  StatBoxesModule,
  TimelineDragExerciseModule,
  TimelineModule,
  TopicCardModule,
} from '../components/modules/AcademicModules'
import {
  ConjugationModule,
  DiscriminationModule,
  GrammarProductionModule,
  GrammarRecognitionModule,
  KanaProductionModule,
  KanaRecognitionModule,
  KanjiMeaningModule,
  KanjiReadingModule,
  LanguageFlashcardModule,
  ParticleClozeModule,
  SentenceScrambleModule,
  TranscriptionModule,
  VocabGuessModule,
  VocabProductionModule,
  VocabRecognitionModule,
} from '../components/modules/LanguageModules'
import { ThemeToggle } from '../components/ThemeToggle'
import { GradientSurface } from '../shader/GradientSurface'
import { preset } from '../shader/presets'
import { useTheme } from '../theme/themeContext'

type ModuleGroup = 'academic' | 'language'

type CatalogEntry = {
  Component: ComponentType
  description: string
  group: ModuleGroup
  id: string
  name: string
  wide?: boolean
}

const MODULES: CatalogEntry[] = [
  { id: 'common-mistakes', name: 'Common mistakes', description: 'Misconception repair', group: 'academic', Component: CommonMistakesModule },
  { id: 'comparison', name: 'Comparison vs similar', description: 'Side-by-side distinction', group: 'academic', Component: ComparisonModule },
  { id: 'conversion', name: 'Conversion calculator', description: 'Interactive unit conversion', group: 'academic', Component: ConversionCalculatorModule },
  { id: 'diagram', name: 'Diagram schematic', description: 'Connected process model', group: 'academic', Component: DiagramSchematicModule },
  { id: 'formula', name: 'Formula equation', description: 'Equation and variable legend', group: 'academic', Component: FormulaEquationModule },
  { id: 'globe-pin', name: 'Globe pin', description: 'Geographic reference', group: 'academic', Component: GlobePinModule },
  { id: 'hero-image', name: 'Hero image', description: 'Visual topic anchor', group: 'academic', Component: HeroImageModule, wide: true },
  { id: 'input-output', name: 'Input/output balance', description: 'Process accounting', group: 'academic', Component: InputOutputBalanceModule },
  { id: 'key-value', name: 'Key-value pairs', description: 'Structured factual attributes', group: 'academic', Component: KeyValuePairsModule },
  { id: 'map-click', name: 'Map click quiz', description: 'Square-based geography answer', group: 'academic', Component: MapClickQuizModule, wide: true },
  { id: 'model-3d', name: 'Model 3D', description: 'Rotatable spatial object', group: 'academic', Component: Model3DModule },
  { id: 'stat-boxes', name: 'Stat boxes', description: 'Quantitative highlights', group: 'academic', Component: StatBoxesModule },
  { id: 'timeline', name: 'Timeline', description: 'Chronological exploration', group: 'academic', Component: TimelineModule },
  { id: 'timeline-drag', name: 'Timeline drag exercise', description: 'Sequence ordering', group: 'academic', Component: TimelineDragExerciseModule },
  { id: 'topic-card', name: 'Topic card', description: 'Expandable concept overview', group: 'academic', Component: TopicCardModule },
  { id: 'flashcard', name: 'Flashcard', description: 'Self-rated free recall', group: 'language', Component: LanguageFlashcardModule },
  { id: 'kana-recognition', name: 'Kana recognition', description: 'Symbol to sound', group: 'language', Component: KanaRecognitionModule },
  { id: 'kana-production', name: 'Kana production', description: 'Sound to symbol', group: 'language', Component: KanaProductionModule },
  { id: 'discrimination', name: 'Discrimination', description: 'Confusable glyph choice', group: 'language', Component: DiscriminationModule },
  { id: 'kanji-meaning', name: 'Kanji meaning', description: 'Kanji to meaning', group: 'language', Component: KanjiMeaningModule },
  { id: 'kanji-reading', name: 'Kanji readings', description: 'On and kun multiselect', group: 'language', Component: KanjiReadingModule },
  { id: 'vocab-recognition', name: 'Vocab recognition', description: 'Word to meaning', group: 'language', Component: VocabRecognitionModule },
  { id: 'vocab-production', name: 'Vocab production', description: 'Meaning to typed word', group: 'language', Component: VocabProductionModule },
  { id: 'vocab-guesser', name: 'Vocab guesser', description: 'Meaning to spoken word', group: 'language', Component: VocabGuessModule },
  { id: 'conjugation', name: 'Conjugation drill', description: 'Morphological production', group: 'language', Component: ConjugationModule },
  { id: 'particle-cloze', name: 'Particle play', description: 'Grammar in context', group: 'language', Component: ParticleClozeModule },
  { id: 'sentence-scramble', name: 'Sentence scramble', description: 'Word-order construction', group: 'language', Component: SentenceScrambleModule },
  { id: 'grammar-recognition', name: 'Grammar recognition', description: 'Grammar to meaning', group: 'language', Component: GrammarRecognitionModule },
  { id: 'grammar-production', name: 'Grammar production', description: 'Meaning to grammar', group: 'language', Component: GrammarProductionModule },
  { id: 'transcription', name: 'Transcription test', description: 'Listening to typed text', group: 'language', Component: TranscriptionModule },
]

export function ModuleGalleryDemo() {
  const { theme } = useTheme()
  const [filter, setFilter] = useState<'all' | ModuleGroup>('all')
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return MODULES.filter(
      (module) =>
        (filter === 'all' || module.group === filter) &&
        (!normalized ||
          module.name.toLowerCase().includes(normalized) ||
          module.description.toLowerCase().includes(normalized)),
    )
  }, [filter, query])

  const colors =
    theme === 'dark'
      ? ['#16283a', '#163e47', '#3d2e61']
      : ['#bfe8ff', '#bcefe0', '#e3d6ff']

  return (
    <div className="module-catalog">
      <GradientSurface
        className="module-catalog__background"
        config={preset({
          color1: colors[0],
          color2: colors[1],
          color3: colors[2],
          uSpeed: 0.025,
          uStrength: 1.4,
          brightness: 1.08,
        })}
        maxScale={1}
      />

      <header className="module-catalog__topbar">
        <a className="module-catalog__brand" href="#/">
          <i aria-hidden="true" />
          <strong>kite</strong>
          <span>module library / 30</span>
        </a>
        <nav aria-label="Pages">
          <a href="#/">Learning field</a>
          <a href="#/knowledge-graph">Knowledge graph</a>
          <a aria-current="page" href="#/modules">Modules</a>
        </nav>
        <ThemeToggle />
      </header>

      <main className="module-catalog__main">
        <section className="module-catalog__intro">
          <span>CommonSage × Nihongo</span>
          <h1>One component<br />for every module.</h1>
          <p>
            Thirty working interface studies across visual explanation, tools,
            geography, recall, reading, writing, listening, and speech.
          </p>
          <strong>{String(filtered.length).padStart(2, '0')} visible</strong>
        </section>

        <section className="module-catalog__controls" aria-label="Filter modules">
          <div>
            {(['all', 'academic', 'language'] as const).map((item) => (
              <button
                aria-pressed={filter === item}
                key={item}
                onClick={() => setFilter(item)}
                type="button"
              >
                {item}
                <span>
                  {item === 'all'
                    ? MODULES.length
                    : MODULES.filter((module) => module.group === item).length}
                </span>
              </button>
            ))}
          </div>
          <label>
            <span>Search modules</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type to filter…"
              type="search"
              value={query}
            />
          </label>
        </section>

        <section className="module-catalog__grid" aria-live="polite">
          {filtered.map(({ Component, group, id, name, wide }) => (
            <section
              className="module-catalog__entry"
              data-group={group}
              data-wide={wide || undefined}
              id={`module-${id}`}
              key={id}
            >
              <div className="module-catalog__entry-label">
                <span>{group === 'academic' ? 'CommonSage' : 'Language'}</span>
                <a href={`#module-${id}`}>{name} · #</a>
              </div>
              <Component />
            </section>
          ))}
          {filtered.length === 0 && (
            <div className="module-catalog__empty">
              <strong>No matching modules.</strong>
              <button onClick={() => setQuery('')} type="button">Clear search</button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

