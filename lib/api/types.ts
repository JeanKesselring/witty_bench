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
  /** Ordering types. */
  tokens?: string[]
  /** Cloze types: sentence split around a single gap. */
  clozeBefore?: string
  clozeAfter?: string
  bank?: string[]
  /** Ungraded types: prose shown instead of a prompt. */
  body?: string
  audioSrc?: string
}

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
