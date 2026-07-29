/* The API adapter — §12.2, as a factory.
 *
 * Every method here talks to the live Common Sage backend. It takes its
 * transport as an argument because the browser and the server need
 * different ones — the browser goes through the same-origin proxy, the
 * server calls the backend directly with the cookie's token. Keeping that
 * choice OUT of this file is what stops `next/headers` being pulled into
 * the client bundle, which is exactly the error it caused when the
 * transport tried to decide for itself.
 *
 * ONE EXCEPTION, and it is not an oversight. Notes have no backend at all —
 * there is no /notes endpoint in the OpenAPI document. Per §11.15 a note is
 * an edge between a user and a topic and needs net-new backend surface, so
 * the three note methods still resolve locally and are marked below. Until
 * that lands, notes are session-only in fact as well as in design.
 */

import { NOTES } from './fixtures'
import type { Requester } from './http'
import {
    toCourse,
    toPillars,
    toQueuePointer,
    toTopic,
    toUser,
    type CourseDto,
    type NextContentDto,
    type PillarDto,
    type TopicDto,
    type TopicProgressDto,
    type UserDto,
} from './dto'
import type {
    Course,
    Grade,
    Lecture,
    ModuleItem,
    Note,
    PillarProficiency,
    Topic,
    User,
} from './types'

/** Grades map to the engine's 0–1 score; §0 keeps scheduling out of here. */
const SCORE: Record<Grade, number> = { again: 0, hard: 0.4, good: 0.75, easy: 1 }

/** Progress lookup keyed by topic, so topics can be mapped in one pass. */
async function topicProgress(
  request: Requester,
  courseId: string,
): Promise<Map<string, TopicProgressDto>> {
    try {
      const rows = await request<TopicProgressDto[]>(
        `/courses/${encodeURIComponent(courseId)}/topics-progress`,
      )
      return new Map(rows.map((r: TopicProgressDto) => [r.topic_uuid, r]))
    } catch {
      // Progress is an enrichment. A course that loads without it shows
      // `unstarted` rather than failing to render at all (§11.13).
      return new Map()
    }
}

export function makeApi(request: Requester) {
    return {
    me: async (): Promise<User> => toUser(await request<UserDto>('/auth/me')),

    courses: async (): Promise<Course[]> =>
      (await request<CourseDto[]>('/courses/')).map((c) => toCourse(c)),

    course: async (id: string): Promise<Course> => {
      const [dto, topics] = await Promise.all([
        request<CourseDto>(`/courses/${encodeURIComponent(id)}`),
        request<TopicDto[]>(`/courses/${encodeURIComponent(id)}/topics`).catch(() => []),
      ])
      return toCourse(dto, topics.length)
    },

    courseTopics: async (id: string): Promise<Topic[]> => {
      const [dtos, progress] = await Promise.all([
        request<TopicDto[]>(`/courses/${encodeURIComponent(id)}/topics`),
        topicProgress(request, id),
      ])
      const topics = dtos.map((d) => toTopic(d, id, progress.get(d.uuid)))
      // childIds is not on the DTO; it is the inverse of topics_parent_uuids,
      // so it is derived here rather than left empty for the graph to guess.
      const byId = new Map(topics.map((t) => [t.id, t]))
      for (const t of topics) {
        if (t.parentId && byId.has(t.parentId)) byId.get(t.parentId)!.childIds.push(t.id)
      }
      return topics
    },

    courseLectures: async (id: string): Promise<Lecture[]> => {
      const rows = await request<Array<{ uuid: string; title?: string; name?: string }>>(
        `/courses/${encodeURIComponent(id)}/lectures`,
      )
      return rows.map((l) => ({
        id: l.uuid,
        courseId: id,
        title: l.title ?? l.name ?? 'Untitled lecture',
      })) as Lecture[]
    },

    /**
     * §7.2 the session queue.
     *
     * next-content returns POINTERS — `{uuid, content_type, topic_uuid,
     * preview}` — with no prompt, answer or options, so each entry is
     * hydrated from its topic's contents. Hydration failures degrade to the
     * preview rather than dropping the item: a module that renders thinly is
     * better than a queue with a hole in it.
     */
    courseQueue: async (id: string): Promise<ModuleItem[]> => {
      const next = await request<NextContentDto>(
        `/courses/${encodeURIComponent(id)}/next-content`,
      )
      const titles = new Map((next.current_topics ?? []).map((t) => [t.uuid, t.name]))
      const queue = next.content_queue ?? []

      const contentsByTopic = new Map<string, Record<string, unknown>[]>()
      await Promise.all(
        [...new Set(queue.map((q) => q.topic_uuid))].map(async (topicId) => {
          try {
            contentsByTopic.set(
              topicId,
              await request<Record<string, unknown>[]>(
                `/topics/${encodeURIComponent(topicId)}/contents`,
              ),
            )
          } catch {
            contentsByTopic.set(topicId, [])
          }
        }),
      )

      return queue.map((q) => {
        const item = toQueuePointer(q, titles.get(q.topic_uuid) ?? '')
        const match = (contentsByTopic.get(q.topic_uuid) ?? []).find(
          (c) => c.uuid === q.uuid || c.id === q.uuid,
        )
        if (!match) return item
        const str = (k: string) => (typeof match[k] === 'string' ? (match[k] as string) : undefined)
        return {
          ...item,
          prompt: str('question') ?? str('front') ?? str('prompt') ?? str('title') ?? item.prompt,
          answer: str('answer') ?? str('back') ?? str('solution') ?? item.answer,
          options: Array.isArray(match.options) ? (match.options as string[]) : item.options,
        }
      })
    },

    coursePillars: async (id: string): Promise<PillarProficiency[]> =>
      toPillars(await request<PillarDto>(`/courses/${encodeURIComponent(id)}/pillar-proficiency`)),

    courseUsers: async (id: string): Promise<User[]> =>
      (await request<UserDto[]>(`/courses/${encodeURIComponent(id)}/users`)).map(toUser),

    topic: async (id: string): Promise<Topic> => {
      const dto = await request<TopicDto>(`/topics/${encodeURIComponent(id)}`)
      return toTopic(dto, '')
    },

    users: async (): Promise<User[]> => (await request<UserDto[]>('/users/')).map(toUser),

    /* §7.4 optimistic writes. The UI has already committed; these reconcile.
     * Both grades and dwell go to the same interaction endpoint — the engine
     * distinguishes them by whether a score is present. */
    submitGrade: async (moduleId: string, grade: Grade, assisted = false) => {
      await request<unknown>('/progress/interactions', {
        method: 'POST',
        json: {
          content_type: 'module',
          content_uuid: moduleId,
          // §6.12: a hint-assisted answer is capped at Hard, applied here so
          // every caller gets the cap rather than each remembering it.
          score: assisted ? Math.min(SCORE[grade], SCORE.hard) : SCORE[grade],
          duration_seconds: 0,
        },
      })
      return { ok: true } as const
    },

    /* Engagement on ungraded modules — dwell past a content-scaled threshold.
     * No score: it can move a topic to in progress but never to mastered. */
    submitEngagement: async (moduleId: string, dwellMs: number) => {
      await request<unknown>('/progress/interactions', {
        method: 'POST',
        json: {
          content_type: 'module',
          content_uuid: moduleId,
          duration_seconds: Math.round(dwellMs / 1000),
        },
      })
      return { ok: true } as const
    },

    /* ── Notes: NO BACKEND EXISTS ──────────────────────────────────────
     * There is no notes endpoint in the OpenAPI document. §11.15 needs one
     * (a note is an edge from a user to a topic, storing text and anchor but
     * no geometry). Until it ships these resolve locally, so notes do not
     * survive a reload — which is a missing API, not a design choice. */
    notes: async (): Promise<Note[]> => NOTES,

    topicNotes: async (topicId: string): Promise<Note[]> =>
      NOTES.filter((n) => n.topicId === topicId),

    createNote: async (note: Omit<Note, 'id' | 'createdAt'>): Promise<Note> => ({
      ...note,
      id: `n-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString().slice(0, 10),
    }),
    } as const
}

export type Api = ReturnType<typeof makeApi>
