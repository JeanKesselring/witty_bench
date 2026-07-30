/* API types — shaped to the FastAPI responses so the fixture adapter can be
 * swapped for the proxy route (§12.2) without touching a component.
 * Vocabulary matches the data model exactly (§13.5): Course, Lecture, Topic,
 * Module, ContentType. No learner-facing synonyms. */

import type { ContentType } from '../modules/registry'

export type Role = 'student' | 'educator' | 'admin'
export type Mastery = 'unstarted' | 'in_progress' | 'mastered'
export type PublishState = 'draft' | 'published'
export type CourseAccess = 'open' | 'closed'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  locale: 'en' | 'de'
}

export interface Course {
  id: string
  title: string
  educator: string
  topicCount: number
  access: CourseAccess
  state: PublishState
  enrolled: boolean
  mastery: Mastery
  lastStudied: string | null
  /** §13.6: educator-only, and only when stale. */
  generatedAt: string
}

export interface Lecture {
  id: string
  courseId: string
  title: string
  topicIds: string[]
  state: PublishState
}

export interface Topic {
  id: string
  courseId: string
  parentId: string | null
  title: string
  blurb: string
  mastery: Mastery
  /** Learner progress through this topic, from 0 to 100. */
  progressPercent?: number
  childIds: string[]
  moduleCount: number
  /** Cell-snapped tile packing, 1×1 to 3×3 (§2.4). */
  span: 1 | 2 | 3
}

export interface ModuleItem {
  id: string
  topicId: string
  topicTitle: string
  /** Registry id — never rendered, never reasoned about (§2.7 tier 4). */
  moduleType: string
  contentType: ContentType
  prompt: string
  /** lang of the prompt/answer, so §4.3 applies to real content. */
  lang?: 'ja' | 'en' | 'de'
  options?: string[]
  answer: string
  /** Alternate exact answers, such as the on- and kun-readings of a kanji. */
  acceptedAnswers?: string[]
  /** Ordering types. */
  tokens?: string[]
  /**
   * Map-click types: one marker per candidate, `label` matching an entry in
   * `options`. The two controls are peers writing the same value, so the
   * labels have to agree — §9.3B requires the list path to score identically.
   */
  mapTargets?: Array<{ label: string; lat: number; lng: number }>
  /** Cloze types: sentence split around a single gap. */
  clozeBefore?: string
  clozeAfter?: string
  bank?: string[]
  /** Ungraded types: prose shown instead of a prompt. */
  body?: string
  audioSrc?: string
  /**
   * §4.3 furigana. The prompt and answer are segmented so kanji runs can
   * carry readings — the same split JKG's tokeniser produces with
   * `surface`/`kana`/`has_kanji`. A plain `prompt` string cannot express
   * this: readings attach to *runs*, not to the whole line, so 図書館 gets
   * one reading and the particle after it gets none.
   *
   * These are additions to `prompt`/`answer`, never replacements — every
   * type still has the plain string, so nothing has to understand ruby to
   * render a card.
   */
  promptRuby?: RubySegment[]
  answerRuby?: RubySegment[]
  /** §6.9: required for every spoken prompt, not optional. */
  transcript?: RubySegment[]
  /** JKG's flashcards flip to the answer AND two example sentences. */
  examples?: ExampleSentence[]
  /**
   * Structured payload for the ungraded types that are NOT prose.
   *
   * stat_boxes is a row of values, timeline is an event spine,
   * comparison_vs_similar is two columns, common_mistakes is paired
   * wrong/right boxes, key_value_pairs is a table, formula_equation is an
   * expression with a legend, input_output_balance is three columns. Passing
   * these as `body` markdown — which is what the first pass did — throws
   * away the whole composition and renders every one of them as a paragraph.
   */
  figure?: Figure
  /** Optional line under the topic title. `topic_card` uses it for its type. */
  subtitle?: string
  /** Optional supporting explanation for result review or an inspector. */
  explanation?: string
  /**
   * Set presentation. A canonical `flashcard` or `quiz` carries extra cards
   * here; a set is presentation data, never a second module type or renderer.
   *
   * A single-card module leaves this undefined and the frame behaves exactly
   * as before; nothing about the one-card path is conditional on it.
   */
  cards?: SetCard[]
  /**
   * The catalogue's shared learning-card behaviour: `Source ↗` when supplied,
   * and a provenance line saying where the content came from. Both are
   * content, not chrome — a learner deciding whether to trust a generated
   * card is doing the right thing, and the card has to answer.
   */
  sources?: Array<{ label: string; href: string }>
  grounding?: 'material' | 'external'
}

export interface SetCard {
  prompt: string
  answer: string
  acceptedAnswers?: string[]
  promptRuby?: RubySegment[]
  answerRuby?: RubySegment[]
  /** Present on quiz sets; absent on flashcard sets. */
  options?: string[]
  /** Shown with the judgement, per the catalogue's "explanation when supplied". */
  explanation?: string
  examples?: ExampleSentence[]
}

/* Common Sage's generator schemas carry a per-item `accent` (stat_boxes) and
 * `color` (diagram_schematic), one of blue/green/orange/purple/red/yellow.
 * Neither is modelled here. §3.2 is explicit that the frontend colours by
 * ContentType "and nothing else", and every ungraded type is one content type,
 * so honouring the source accents would put six hues on a surface where colour
 * is supposed to mean content kind — the identity channel stops identifying.
 * The distinctions those fields drew are carried by weight, scale and rule
 * instead. `note` and `shape` ARE modelled: they are content and a second
 * non-colour channel (§3.3) respectively, not decoration. */
/** One run of Japanese text, with its reading if it needs one. Segments with
 *  no `reading` are kana or punctuation and render bare (§4.3). */
export interface RubySegment {
  text: string
  reading?: string
}

export interface ExampleSentence {
  ja: RubySegment[]
  en: string
}

export type Figure =
  | {
      kind: 'stats'
      items: Array<{ label: string; value: string; unit?: string; note?: string }>
    }
  | {
      kind: 'diagram'
      /** Drives layout only; the source calls this `diagram_type`. */
      layout: 'flowchart' | 'tree' | 'network' | 'cycle'
      nodes: Array<{
        id: string
        label: string
        description?: string
        shape?: 'box' | 'diamond' | 'circle' | 'oval'
      }>
      edges: Array<{ from: string; to: string; label?: string; style?: 'solid' | 'dashed' }>
    }
  | { kind: 'timeline'; events: Array<{ when: string; what: string }> }
  | {
      kind: 'comparison'
      left: { title: string; points: string[] }
      right: { title: string; points: string[] }
      /** The one sentence that says why they get confused. */
      note?: string
    }
  | { kind: 'mistakes'; items: Array<{ wrong: string; right: string; why?: string }> }
  | { kind: 'pairs'; rows: Array<{ key: string; value: string }>; note?: string }
  | {
      kind: 'formula'
      expression: string
      terms: Array<{ symbol: string; meaning: string }>
    }
  | {
      kind: 'balance'
      inputs: string[]
      outputs: string[]
      stored: string
      note?: string
    }
  /**
   * hero_image — one to THREE images, because the catalogue's hero is a
   * gallery with prev/next/dot navigation and a counter, not a single plate.
   * `alt` is required per image, not optional: a hero with no alt is the one
   * image on the page that definitely carries meaning.
   */
  | {
      kind: 'gallery'
      images: Array<{
        src: string
        alt: string
        caption?: string
        attribution?: string
        license?: string
      }>
    }
  /**
   * model_3d. The catalogue's rich renderer is the target: automatic
   * rotation, drag to rotate, scroll or pinch to zoom, a loading state and a
   * thumbnail fallback when rendering fails.
   *
   * §9.3C's carve-out is therefore live, and its terms are met rather than
   * dodged: keyboard rotation with an announced orientation, a poster with
   * real alt text, and `reveals` — a written account of what turning it
   * shows — so the learning objective is reachable without ever rotating
   * anything. `src` absent means the viewer degrades to the poster.
   */
  | {
      kind: 'model'
      /** GLB or STL. Absent = poster only. */
      src?: string
      poster: string
      alt: string
      /** What turning it would show you — the part a still frame cannot. */
      reveals: string
      attribution?: string
      license?: string
    }
  /**
   * globe_pin. A real slippy map (drag to pan, scroll/pinch to zoom, click a
   * pin for its description), so §9.3B's raster-map carve-out applies: the
   * pin list beside it is the equivalent path and carries the same content,
   * and OSM attribution is required and present.
   */
  | {
      kind: 'globe'
      pins: Array<{ label: string; lat: number; lng: number; description?: string }>
      /** Named regions and routes the source renderer draws over the map. */
      routes?: Array<{ label: string; points: Array<{ lat: number; lng: number }> }>
      note?: string
    }
  /**
   * conversion_calculator. Restored: §6.10 had deleted it, and
   * complete_modules.md lists it as a live tool with an input loop, a
   * validation message and immediate results.
   */
  | {
      kind: 'conversion'
      source: { name: string; symbol: string }
      groups: Array<{
        label: string
        units: Array<{ name: string; symbol: string; factor: number; offset?: number }>
      }>
    }
  /** audio and video. The player is ours (§6.9), not the browser's default. */
  | {
      kind: 'media'
      media: 'audio' | 'video'
      src: string
      poster?: string
      /** §9.3: captions gate publishing for video; transcript for audio. */
      captions?: string
      transcript?: string
    }
  /**
   * topic_card — the composite. Up to two visual modules plus collapsible
   * explanatory panels and one unified source list. Its children are the
   * same canonical figures, not copies of them.
   */
  | {
      kind: 'composite'
      figures: Figure[]
      panels: Array<{ title: string; body: string }>
    }
/* There was a `figure` kind here — a labelled placeholder plate standing in
 * for hero_image, globe_pin, model_3d and diagram_schematic until the real
 * assets were wired. All four now have their own kind above, which left it
 * matched by nothing. An unexercised renderer reads as finished work and
 * isn't, so it is gone rather than kept "just in case": ModuleFigure already
 * returns null for an unknown kind, and a module with no figure renders its
 * prose. */

export interface Note {
  id: string
  topicId: string
  topicTitle: string
  courseId: string
  courseTitle: string
  text: string
  lang: 'ja' | 'en' | 'de'
  kind: 'learner' | 'educator'
  state: PublishState
  createdAt: string
}

export interface PillarProficiency {
  pillar: string
  /** null means not begun — never a deficit (§11.7). */
  score: number | null
}

export interface SessionSummary {
  minutes: number
  modules: number
  topics: number
  mastered: string[]
  weaker: string[]
}

export type Grade = 'again' | 'hard' | 'good' | 'easy'

export interface Judgement {
  outcome: 'correct' | 'incorrect' | 'partial'
  answer: string
  note?: string
}
