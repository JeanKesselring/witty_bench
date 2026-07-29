/* The Japanese Knowledge Graph layer — types and fixtures.
 *
 * JKG is a separate Flask service (port 8010) with its own vocabulary:
 * daily plans and lessons, placement runs with per-dimension estimates,
 * generated reader texts with paragraphs and comprehension questions,
 * conversations, and a concept graph. witty_bench does not call it yet, so
 * every shape here is modelled on the handlers in `server/*.py` rather than
 * invented:
 *
 *   · `daily.py`   — tiers carry `item_counts` per type and `test_questions`.
 *   · `placement.py` — a run is a status plus a per-dimension mean/sd, and
 *     an answer returns `{feedback, completed, question}`.
 *   · `reader.py`  — a text is `{genre, length_tier, title, title_en,
 *     paragraphs, questions, target_level, provenance}`.
 *
 * Keeping the field names is the point: when the proxy route lands, the
 * adapter maps names, not concepts, and no page changes.
 */

import type { RubySegment } from './types'

/* ── Shared ─────────────────────────────────────────────────────────── */

export type Dimension = 'kana' | 'vocabulary' | 'kanji' | 'grammar'
export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

export const DIMENSIONS: Dimension[] = ['kana', 'vocabulary', 'kanji', 'grammar']

/* ── Daily plan and lesson ──────────────────────────────────────────── */

export type LessonStage = 'setup' | 'review' | 'learn' | 'context' | 'check' | 'summary'

export const LESSON_STAGES: Array<{ id: LessonStage; label: string; blurb: string }> = [
  { id: 'setup', label: 'Setup', blurb: 'Choose what today covers.' },
  { id: 'review', label: 'Review', blurb: 'What is due from previous days.' },
  { id: 'learn', label: 'Learn', blurb: 'Today’s focus concepts.' },
  { id: 'context', label: 'Context', blurb: 'The same items, used in sentences.' },
  { id: 'check', label: 'Check', blurb: 'Retrieval, without the notes.' },
  { id: 'summary', label: 'Summary', blurb: 'What changed today.' },
]

export type Tier = 1 | 2 | 3 | 4

export interface TierSpec {
  tier: Tier
  label: string
  minutes: number
  /** `item_counts` in daily.py — one count per dimension. */
  itemCounts: Record<Dimension, number>
  testQuestions: number
}

export const TIERS: TierSpec[] = [
  {
    tier: 1,
    label: 'Light',
    minutes: 8,
    itemCounts: { kana: 2, vocabulary: 4, kanji: 2, grammar: 1 },
    testQuestions: 6,
  },
  {
    tier: 2,
    label: 'Steady',
    minutes: 15,
    itemCounts: { kana: 3, vocabulary: 6, kanji: 4, grammar: 2 },
    testQuestions: 10,
  },
  {
    tier: 3,
    label: 'Full',
    minutes: 25,
    itemCounts: { kana: 4, vocabulary: 10, kanji: 6, grammar: 3 },
    testQuestions: 16,
  },
  {
    tier: 4,
    label: 'Intensive',
    minutes: 40,
    itemCounts: { kana: 6, vocabulary: 16, kanji: 10, grammar: 5 },
    testQuestions: 24,
  },
]

export interface PlanItem {
  conceptId: string
  dimension: Dimension
  /** The written form: a kana, a word, a kanji, or a grammar pattern. */
  name: string
  reading?: string
  meaning: string
  /** Set by `Already know` / `Not interested` — both suppress, differently. */
  suppressed?: 'known' | 'uninterested'
  due: boolean
}

export interface DailyPlan {
  planId: string
  date: string
  tier: Tier
  theme: string
  goal: string
  items: PlanItem[]
  confirmed: boolean
}

/* ── The study sheet ─────────────────────────────────────────────────── */

export interface StudySheet {
  theme: string
  goal: string
  grammar: {
    pattern: string
    meaning: string
    structure: string
    explanation: string
    examples: Array<{ ja: RubySegment[]; en: string }>
  }
  kanji: Array<{
    character: string
    on: string[]
    kun: string[]
    meaning: string
    components: string[]
    words: Array<{ ja: string; reading: string; en: string }>
  }>
  vocabulary: Array<{
    word: string
    reading: string
    pos: string
    pitch: string
    meaning: string
    example: { ja: RubySegment[]; en: string }
  }>
  kanaFocus: string[]
  checks: string[]
  minutes: number
  testQuestions: number
}

/* ── Placement ───────────────────────────────────────────────────────── */

export interface PlacementEstimate {
  dimension: Dimension
  /** `mean`/`sd` from placement.py — a level band and how sure it is. */
  mean: number
  sd: number
  count: number
}

export interface PlacementRun {
  runId: string
  status: 'not_started' | 'in_progress' | 'complete'
  answered: number
  total: number
  estimates: PlacementEstimate[]
  /** Present when complete. Deliberately conservative — see the page. */
  result?: {
    workingLevel: JlptLevel
    perDimension: Record<Dimension, JlptLevel>
    uncertainty: 'low' | 'medium' | 'high'
    familiarConcepts: number
  }
}

/* ── Reader / Listen / Karaoke ───────────────────────────────────────── */

export type Genre = 'conversation' | 'history' | 'folk_tale'
export type LengthTier = 'tiny' | 'short' | 'long'
export type Challenge = 'easier' | 'current' | 'stretch'
export type Register = 'casual' | 'neutral' | 'formal'

/** One token, as JKG's tokeniser emits it: surface, kana, and whether it
 *  carries kanji — which is what decides whether a reading is offered. */
export interface Token {
  surface: string
  kana: string
  hasKanji: boolean
  romaji: string
  gloss: string
  grammar?: string
  conceptId?: string
}

export interface Sentence {
  tokens: Token[]
  translation: string
  /** Per-sentence audio; `reader_audio.py` serves these individually. */
  audioSrc?: string
}

export interface ReaderText {
  textId: string
  title: string
  titleEn: string
  genre: Genre
  lengthTier: LengthTier
  targetLevel: JlptLevel
  challenge: Challenge
  register: Register
  wordCount: number
  paragraphs: Sentence[][]
  questions: Array<{ prompt: string; promptEn: string; options: string[]; answer: string }>
  createdAt: string
}

/* ── Conversation ────────────────────────────────────────────────────── */

export type Scenario = 'daily_life' | 'restaurant' | 'travel' | 'school' | 'shopping' | 'custom'

export const SCENARIOS: Array<{ id: Scenario; label: string }> = [
  { id: 'daily_life', label: 'Daily life' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'travel', label: 'Travel' },
  { id: 'school', label: 'School' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'custom', label: 'Custom topic' },
]

export interface ConversationTurn {
  role: 'learner' | 'tutor'
  text: string
  ruby?: RubySegment[]
  translation?: string
}

export interface Conversation {
  conversationId: string
  scenario: Scenario
  title: string
  turns: ConversationTurn[]
  updatedAt: string
}

export interface ConversationAnalysis {
  summary: string
  patterns: Array<{ pattern: string; original: string; corrected: string; note: string }>
  targets: string[]
  drills: Array<{ label: string; moduleType: string }>
  nextPrompts: string[]
}

/* ── Concept explorer ────────────────────────────────────────────────── */

export type ConceptKind =
  | 'kanji'
  | 'katakana'
  | 'hiragana'
  | 'verb'
  | 'noun'
  | 'adjective'
  | 'particle'
  | 'adverb'
  | 'grammar'

export interface Concept {
  id: string
  name: string
  reading?: string
  kind: ConceptKind
  pillar: Dimension
  level: JlptLevel
  definition: string
  properties: Array<{ key: string; value: string }>
  strokeOrder?: string[]
  examples: Array<{ ja: RubySegment[]; en: string }>
  related: Array<{ id: string; name: string; relation: string; direction: 'to' | 'from' }>
  /** `graph/mastery` — recall estimate plus the counts behind it. */
  recall: number | null
  reviews: number
  lapses: number
  history: number[]
}

/* ════════════════════════════════════════════════════════════════════════
   Fixtures. Written to the shapes above, sized so every page has something
   awkward in it — a suppressed item, a long compound, a text with three
   paragraphs, a concept with no recall estimate yet.
   ════════════════════════════════════════════════════════════════════════ */

const ruby = (...pairs: Array<[string, string?]>): RubySegment[] =>
  pairs.map(([text, reading]) => (reading ? { text, reading } : { text }))

export const PLAN: DailyPlan = {
  planId: 'plan-2026-07-28',
  date: '2026-07-28',
  tier: 2,
  theme: 'At the station',
  goal: 'Ask for and understand simple directions.',
  confirmed: false,
  items: [
    {
      conceptId: 'c-eki',
      dimension: 'vocabulary',
      name: '駅',
      reading: 'えき',
      meaning: 'station',
      due: false,
    },
    {
      conceptId: 'c-kippu',
      dimension: 'vocabulary',
      name: '切符',
      reading: 'きっぷ',
      meaning: 'ticket',
      due: false,
    },
    {
      conceptId: 'c-noru',
      dimension: 'vocabulary',
      name: '乗る',
      reading: 'のる',
      meaning: 'to board',
      due: true,
    },
    {
      conceptId: 'c-oriru',
      dimension: 'vocabulary',
      name: '降りる',
      reading: 'おりる',
      meaning: 'to get off',
      due: true,
    },
    {
      conceptId: 'c-migi',
      dimension: 'vocabulary',
      name: '右',
      reading: 'みぎ',
      meaning: 'right',
      due: false,
    },
    {
      conceptId: 'c-hidari',
      dimension: 'vocabulary',
      name: '左',
      reading: 'ひだり',
      meaning: 'left',
      due: false,
      suppressed: 'known',
    },
    {
      conceptId: 'c-kanji-eki',
      dimension: 'kanji',
      name: '駅',
      reading: 'エキ',
      meaning: 'station',
      due: false,
    },
    {
      conceptId: 'c-kanji-nori',
      dimension: 'kanji',
      name: '乗',
      reading: 'ジョウ',
      meaning: 'ride',
      due: false,
    },
    {
      conceptId: 'c-kanji-ori',
      dimension: 'kanji',
      name: '降',
      reading: 'コウ',
      meaning: 'descend',
      due: true,
    },
    {
      conceptId: 'c-kanji-migi',
      dimension: 'kanji',
      name: '右',
      reading: 'ウ',
      meaning: 'right',
      due: false,
    },
    {
      conceptId: 'c-kana-tsu',
      dimension: 'kana',
      name: 'っ',
      meaning: 'small tsu — the doubled consonant',
      due: false,
    },
    {
      conceptId: 'c-kana-kya',
      dimension: 'kana',
      name: 'きゃ',
      meaning: 'kya — a contracted sound',
      due: false,
    },
    { conceptId: 'c-kana-fu', dimension: 'kana', name: 'ふ', meaning: 'fu', due: true },
    {
      conceptId: 'c-te-kudasai',
      dimension: 'grammar',
      name: '〜てください',
      meaning: 'please do —',
      due: false,
    },
    {
      conceptId: 'c-tara',
      dimension: 'grammar',
      name: '〜たら',
      meaning: 'if / when —',
      due: true,
    },
  ],
}

export const SHEET: StudySheet = {
  theme: PLAN.theme,
  goal: PLAN.goal,
  minutes: 15,
  testQuestions: 10,
  grammar: {
    pattern: '〜てください',
    meaning: 'Please do —',
    structure: 'verb て-form + ください',
    explanation:
      'A polite request. Built on the て-form, so the て-form has to be secure before this is: 行く → 行って → 行ってください. It asks; it does not command. To a superior, use 〜ていただけますか instead.',
    examples: [
      {
        ja: ruby(['右', 'みぎ'], ['に'], ['曲', 'ま'], ['がってください。']),
        en: 'Please turn right.',
      },
      { ja: ruby(['ここで'], ['降', 'お'], ['りてください。']), en: 'Please get off here.' },
    ],
  },
  kanji: [
    {
      character: '駅',
      on: ['エキ'],
      kun: [],
      meaning: 'station',
      components: ['馬 horse', '尺 measure'],
      words: [
        { ja: '駅前', reading: 'えきまえ', en: 'in front of the station' },
        { ja: '東京駅', reading: 'とうきょうえき', en: 'Tokyo Station' },
      ],
    },
    {
      character: '降',
      on: ['コウ'],
      kun: ['お.りる', 'ふ.る'],
      meaning: 'descend, fall',
      components: ['阝 hill', '夅 descend'],
      words: [
        { ja: '降りる', reading: 'おりる', en: 'to get off' },
        { ja: '雨が降る', reading: 'あめがふる', en: 'it rains' },
      ],
    },
  ],
  vocabulary: [
    {
      word: '切符',
      reading: 'きっぷ',
      pos: 'noun',
      pitch: '[0] flat',
      meaning: 'ticket',
      example: {
        ja: ruby(['切符', 'きっぷ'], ['を'], ['買', 'か'], ['いました。']),
        en: 'I bought a ticket.',
      },
    },
    {
      word: '乗り換える',
      reading: 'のりかえる',
      pos: 'ichidan verb',
      pitch: '[4] falls after り',
      meaning: 'to change trains',
      example: {
        ja: ruby(
          ['次', 'つぎ'],
          ['の'],
          ['駅', 'えき'],
          ['で'],
          ['乗', 'の'],
          ['り'],
          ['換', 'か'],
          ['えます。'],
        ),
        en: 'I change trains at the next station.',
      },
    },
  ],
  kanaFocus: ['っ', 'きゃ', 'ふ'],
  checks: [
    'Say “please turn right” without looking.',
    'Read 駅前 aloud.',
    'Give the て-form of 降りる.',
  ],
}

export const PLACEMENT: PlacementRun = {
  runId: 'run-1',
  status: 'not_started',
  answered: 0,
  total: 28,
  estimates: DIMENSIONS.map((d) => ({ dimension: d, mean: 0, sd: 1.2, count: 0 })),
}

const s = (
  tokens: Array<[string, string, string, string, string?]>,
  translation: string,
  audioSrc?: string,
): Sentence => ({
  tokens: tokens.map(([surface, kana, romajiText, gloss, grammar]) => ({
    surface,
    kana,
    romaji: romajiText,
    gloss,
    grammar,
    hasKanji: /[一-龯]/.test(surface),
  })),
  translation,
  audioSrc,
})

export const TEXTS: ReaderText[] = [
  {
    textId: 'text-1',
    title: '駅で',
    titleEn: 'At the station',
    genre: 'conversation',
    lengthTier: 'short',
    targetLevel: 'N5',
    challenge: 'current',
    register: 'neutral',
    wordCount: 42,
    createdAt: '2026-07-28',
    paragraphs: [
      [
        s(
          [
            ['すみません', 'すみません', 'sumimasen', 'excuse me'],
            ['、', '、', '', ''],
            ['東京駅', 'とうきょうえき', 'toukyou eki', 'Tokyo Station'],
            ['は', 'は', 'wa', 'topic marker', 'particle は'],
            ['どこ', 'どこ', 'doko', 'where'],
            ['ですか', 'ですか', 'desu ka', 'is it? (polite question)', 'copula + か'],
            ['。', '。', '', ''],
          ],
          'Excuse me, where is Tokyo Station?',
          '/media/sentence-ja.wav',
        ),
        s(
          [
            ['この', 'この', 'kono', 'this'],
            ['道', 'みち', 'michi', 'road'],
            ['を', 'を', 'wo', 'object marker', 'particle を'],
            ['まっすぐ', 'まっすぐ', 'massugu', 'straight ahead'],
            ['行って', 'いって', 'itte', 'go (て-form)', '〜てform'],
            ['ください', 'ください', 'kudasai', 'please', '〜てください'],
            ['。', '。', '', ''],
          ],
          'Please go straight along this road.',
          '/media/vocab-ja.wav',
        ),
      ],
      [
        s(
          [
            ['二', 'ふた', 'futa', 'two'],
            ['つ', 'つ', 'tsu', 'counter'],
            ['目', 'め', 'me', 'th (ordinal)'],
            ['の', 'の', 'no', 'possessive', 'particle の'],
            ['角', 'かど', 'kado', 'corner'],
            ['を', 'を', 'wo', 'object marker'],
            ['右', 'みぎ', 'migi', 'right'],
            ['に', 'に', 'ni', 'direction marker', 'particle に'],
            ['曲がったら', 'まがったら', 'magattara', 'if you turn', '〜たら'],
            ['、', '、', '', ''],
            ['見えます', 'みえます', 'miemasu', 'you will see it'],
            ['。', '。', '', ''],
          ],
          'If you turn right at the second corner, you will see it.',
          '/media/sentence-ja.wav',
        ),
      ],
    ],
    questions: [
      {
        prompt: '男の人はどこへ行きたいですか。',
        promptEn: 'Where does the man want to go?',
        options: ['東京駅', '学校', 'figure', '病院'],
        answer: '東京駅',
      },
      {
        prompt: 'どの角を曲がりますか。',
        promptEn: 'Which corner does he turn at?',
        options: ['一つ目', '二つ目', '三つ目', '曲がらない'],
        answer: '二つ目',
      },
    ],
  },
]

export const CONVERSATIONS: Conversation[] = [
  {
    conversationId: 'conv-1',
    scenario: 'restaurant',
    title: 'Ordering lunch',
    updatedAt: '2026-07-27',
    turns: [
      {
        role: 'tutor',
        text: 'いらっしゃいませ。何名様ですか。',
        ruby: ruby(['いらっしゃいませ。'], ['何名様', 'なんめいさま'], ['ですか。']),
        translation: 'Welcome. How many people?',
      },
      { role: 'learner', text: '二人です。' },
      {
        role: 'tutor',
        text: 'かしこまりました。こちらのお席へどうぞ。',
        ruby: ruby(['かしこまりました。こちらのお'], ['席', 'せき'], ['へどうぞ。']),
        translation: 'Certainly. This way to your table, please.',
      },
    ],
  },
]

export const ANALYSIS: ConversationAnalysis = {
  summary:
    'You held the exchange without switching to English, and your requests were consistently polite. Particles are where the errors clustered.',
  patterns: [
    {
      pattern: 'を for に with movement verbs',
      original: '駅を行きます',
      corrected: '駅に行きます',
      note: '行く takes に for the destination. を marks a path you move ALONG, not a place you go TO.',
    },
    {
      pattern: 'Counter omitted',
      original: '二です',
      corrected: '二人です',
      note: 'People take 人. A bare number answers “how many?” only in maths.',
    },
  ],
  targets: ['particle に vs を', 'counters for people and objects'],
  drills: [
    { label: 'Particle drill — に and を', moduleType: 'particle_cloze' },
    { label: 'Counters — typed production', moduleType: 'vocab_production' },
  ],
  nextPrompts: ['Ask for the bill.', 'Ask whether the dish contains fish.'],
}

export const CONCEPTS: Concept[] = [
  {
    id: 'c-eki',
    name: '駅',
    reading: 'えき',
    kind: 'kanji',
    pillar: 'kanji',
    level: 'N5',
    definition:
      'Station. Almost always read エキ; appears in nearly every place name on a rail map.',
    properties: [
      { key: 'Strokes', value: '14' },
      { key: 'Radical', value: '馬' },
      { key: 'Grade', value: '3' },
    ],
    strokeOrder: ['㇐', '㇑', '㇒', '㇔'],
    examples: [
      {
        ja: ruby(['駅', 'えき'], ['で'], ['会', 'あ'], ['いましょう。']),
        en: 'Let’s meet at the station.',
      },
    ],
    related: [
      { id: 'c-kippu', name: '切符', relation: 'appears with', direction: 'to' },
      { id: 'c-noru', name: '乗る', relation: 'appears with', direction: 'to' },
    ],
    recall: 0.82,
    reviews: 14,
    lapses: 2,
    history: [0.3, 0.5, 0.62, 0.71, 0.68, 0.79, 0.82],
  },
  {
    id: 'c-tara',
    name: '〜たら',
    kind: 'grammar',
    pillar: 'grammar',
    level: 'N4',
    definition:
      'Conditional. Attaches to the plain past: 曲がる → 曲がったら. Covers both “if” and “when”, and the main clause may be a request or a discovery.',
    properties: [
      { key: 'Formation', value: 'plain past + ら' },
      { key: 'Register', value: 'neutral' },
    ],
    examples: [
      {
        ja: ruby(
          ['駅', 'えき'],
          ['に'],
          ['着', 'つ'],
          ['いたら'],
          ['電話', 'でんわ'],
          ['してください。'],
        ),
        en: 'Please call me when you arrive at the station.',
      },
    ],
    related: [
      { id: 'c-to', name: '〜と', relation: 'contrasts with', direction: 'to' },
      { id: 'c-ba', name: '〜ば', relation: 'contrasts with', direction: 'to' },
    ],
    recall: 0.41,
    reviews: 5,
    lapses: 3,
    history: [0.2, 0.35, 0.28, 0.41],
  },
  {
    id: 'c-kana-kya',
    name: 'きゃ',
    reading: 'kya',
    kind: 'hiragana',
    pillar: 'kana',
    level: 'N5',
    definition: 'A contracted sound: き plus a small ゃ. One mora, not two.',
    properties: [{ key: 'Type', value: 'yōon' }],
    examples: [{ ja: ruby(['お'], ['客', 'きゃく'], ['さん']), en: 'customer, guest' }],
    related: [{ id: 'c-kana-ki', name: 'き', relation: 'built from', direction: 'from' }],
    // Never seen. `null` means not begun and is never rendered as a deficit.
    recall: null,
    reviews: 0,
    lapses: 0,
    history: [],
  },
  {
    id: 'c-noru',
    name: '乗る',
    reading: 'のる',
    kind: 'verb',
    pillar: 'vocabulary',
    level: 'N5',
    definition: 'To board, to get on. Takes に for the thing boarded: バスに乗る.',
    properties: [
      { key: 'Class', value: 'godan' },
      { key: 'Pitch', value: '[0]' },
    ],
    examples: [{ ja: ruby(['バスに'], ['乗', 'の'], ['ります。']), en: 'I get on the bus.' }],
    related: [{ id: 'c-oriru', name: '降りる', relation: 'opposite of', direction: 'to' }],
    recall: 0.66,
    reviews: 9,
    lapses: 1,
    history: [0.4, 0.55, 0.6, 0.66],
  },
]
