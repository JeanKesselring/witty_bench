/* Backend DTOs → the interface's own types.
 *
 * These two vocabularies genuinely differ, and the seam belongs here rather
 * than in components: the backend speaks `uuid`/`name`/`understanding_level`,
 * the interface speaks `id`/`title`/`mastery`. Every field below was read off
 * the live OpenAPI document, not assumed.
 *
 * Where the backend has no equivalent for something the interface models —
 * a topic's tile `span`, a course's `enrolled` flag — the mapper picks the
 * honest neutral value rather than inventing data. Those are marked; each is
 * a real gap in the API, not a rendering choice.
 */

import type {
  Course,
  Mastery,
  ModuleItem,
  PillarProficiency,
  Role,
  Topic,
  User,
} from './types'

export interface UserDto {
  uuid: string
  name: string
  lastname: string
  email: string
  role: string
  status: string
  institution?: string | null
}

export interface CourseDto {
  uuid: string
  title: string
  description?: string | null
  semester?: string | null
  faculty?: string | null
  visibility?: string | null
  status?: string | null
  educator_uuid?: string | null
}

export interface TopicDto {
  uuid: string
  name: string
  description?: string | null
  keywords?: string[] | null
  topics_parent_uuids?: string[] | null
  created_at?: string | null
}

export interface TopicProgressDto {
  topic_uuid: string
  understanding_level?: number | null
  accuracy_level?: number | null
  last_visited?: string | null
  status?: string | null
}

export interface QueueItemDto {
  uuid: string
  content_type: string
  topic_uuid: string
  lecture_uuid?: string | null
  relevance?: number | null
  difficulty?: number | null
  preview?: string | null
}

export interface NextContentDto {
  current_lecture?: string | null
  current_topics?: Array<{ uuid: string; name: string; understanding_level?: number | null; status?: string | null }>
  content_queue?: QueueItemDto[]
  is_onboarding?: boolean
}

export interface PillarDto {
  course_uuid: string
  pillars?: Record<string, number | null> | Array<{ name?: string; pillar?: string; score?: number | null }>
  weakest_subtype?: string | null
}

const ROLES: Role[] = ['admin', 'educator', 'student']
const asRole = (r: string): Role =>
  (ROLES as string[]).includes(r) ? (r as Role) : 'student'

/**
 * §11.7: mastery is never a deficit. `null`/absent means UNSTARTED, which is
 * an absence of evidence — it must not render as a low score.
 */
export function masteryFrom(level?: number | null, status?: string | null): Mastery {
  if (status === 'mastered') return 'mastered'
  if (level === null || level === undefined) return 'unstarted'
  if (level >= 0.8) return 'mastered'
  if (level > 0) return 'in_progress'
  return 'unstarted'
}

export const toUser = (d: UserDto): User => ({
  id: d.uuid,
  name: [d.name, d.lastname].filter(Boolean).join(' ').trim() || d.email,
  email: d.email,
  role: asRole(d.role),
  // The backend has no per-user locale; the interface locale is chosen in
  // the client (§4.4), so this is a display default, not a claim.
  locale: 'en',
})

export const toCourse = (d: CourseDto, topicCount = 0): Course => ({
  id: d.uuid,
  title: d.title,
  educator: d.educator_uuid ?? '',
  topicCount,
  // No enrolment/access field on the course DTO — /courses/{id}/enrollments
  // is a separate endpoint. Defaults are neutral, not invented state.
  access: d.visibility === 'public' ? 'open' : 'closed',
  state: d.status === 'published' ? 'published' : 'draft',
  enrolled: false,
  mastery: 'unstarted',
  lastStudied: null,
  generatedAt: '',
})

export const toTopic = (
  d: TopicDto,
  courseId: string,
  progress?: TopicProgressDto,
): Topic => ({
  id: d.uuid,
  courseId,
  parentId: d.topics_parent_uuids?.[0] ?? null,
  title: d.name,
  blurb: d.description ?? '',
  mastery: masteryFrom(progress?.understanding_level, progress?.status),
  childIds: [],
  // The backend does not size tiles; §2.4's packing is a layout decision, so
  // it is derived here from how much the tile has to say.
  moduleCount: 0,
  span: (d.description && d.description.length > 140 ? 2 : 1) as 1 | 2 | 3,
})

/**
 * A queue entry is a POINTER, not a module: next-content returns
 * `{uuid, content_type, topic_uuid, preview}` with no prompt, answer or
 * options. Those live on the per-type content endpoints. This produces the
 * pointer half; `hydrate` in client.ts fills the rest.
 */
export const toQueuePointer = (d: QueueItemDto, topicTitle: string): ModuleItem => ({
  id: d.uuid,
  topicId: d.topic_uuid,
  topicTitle,
  moduleType: d.content_type,
  contentType: (['summary', 'text', 'video', 'audio', 'flashcard', 'quiz'] as string[]).includes(
    d.content_type,
  )
    ? (d.content_type as ModuleItem['contentType'])
    : 'text',
  prompt: d.preview ?? '',
  answer: '',
})

export function toPillars(d: PillarDto): PillarProficiency[] {
  const p = d?.pillars
  if (!p) return []
  if (Array.isArray(p)) {
    return p.map((x) => ({
      pillar: x.pillar ?? x.name ?? '',
      score: x.score ?? null,
    }))
  }
  return Object.entries(p).map(([pillar, score]) => ({ pillar, score: score ?? null }))
}
