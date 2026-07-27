/* The API adapter.
 *
 * Today every call resolves from fixtures. To move to the live backend,
 * replace the bodies with fetches to `/api/v1/*` (the proxy route in
 * app/api/v1/[...path]/route.ts) — the signatures and the normalised
 * ApiError below are the contract components depend on (§12.2), so nothing
 * upstream changes.
 */

import {
  COURSES,
  LECTURES,
  ME,
  NOTES,
  PILLARS,
  QUEUE,
  TOPICS,
  USERS,
} from './fixtures'
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

/** One error shape, so §11.13's error states can be uniform (§12.2). */
export class ApiError extends Error {
  status: number
  /** Recovery action label — §11.13 requires one retry path, not a code. */
  retryable: boolean

  constructor(message: string, status = 500, retryable = true) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryable = retryable
  }
}

const LATENCY = 120

function resolve<T>(value: T): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), LATENCY))
}

export const api = {
  me: () => resolve<User>(ME),

  courses: () => resolve<Course[]>(COURSES),

  course: async (id: string) => {
    const found = COURSES.find((c) => c.id === id)
    if (!found) throw new ApiError('That course does not exist.', 404, false)
    return resolve<Course>(found)
  },

  courseTopics: (id: string) =>
    resolve<Topic[]>(TOPICS.filter((t) => t.courseId === id)),

  courseLectures: (id: string) =>
    resolve<Lecture[]>(LECTURES.filter((l) => l.courseId === id)),

  courseQueue: (id: string) => {
    // The recommender narrowing to topics with no modules and reporting
    // "no content" in a course that has material is a real failure mode
    // (§11.13) — the caller distinguishes nothing-due from nothing-exists.
    const topics = TOPICS.filter((t) => t.courseId === id).map((t) => t.id)
    return resolve<ModuleItem[]>(QUEUE.filter((m) => topics.includes(m.topicId)))
  },

  coursePillars: (_id: string) => resolve<PillarProficiency[]>(PILLARS),

  courseUsers: (_id: string) =>
    resolve<User[]>(USERS.filter((u) => u.role === 'student')),

  topic: async (id: string) => {
    const found = TOPICS.find((t) => t.id === id)
    if (!found) throw new ApiError('That topic does not exist.', 404, false)
    return resolve<Topic>(found)
  },

  notes: () => resolve<Note[]>(NOTES),

  topicNotes: (topicId: string) =>
    resolve<Note[]>(NOTES.filter((n) => n.topicId === topicId)),

  users: () => resolve<User[]>(USERS),

  /* Optimistic writes (§7.4). The UI commits immediately; these reconcile.
   * `assisted` is the cloze hint flag from §6.12 — nothing accepts it yet
   * (§12.1), so it is collected and sent, and the fixture ignores it. */
  submitGrade: (_moduleId: string, _grade: Grade, _assisted = false) =>
    resolve<{ ok: true }>({ ok: true }),

  /* Engagement on ungraded modules — dwell past a content-scaled threshold.
   * Distinct from a recall grade; feeds *in progress* only (§11.7). */
  submitEngagement: (_moduleId: string, _dwellMs: number) =>
    resolve<{ ok: true }>({ ok: true }),

  createNote: (note: Omit<Note, 'id' | 'createdAt'>) =>
    resolve<Note>({
      ...note,
      id: `n-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString().slice(0, 10),
    }),
}
