/* Query-key factory (§12.2). Never inline a query key string. */

export const keys = {
  me: () => ['me'] as const,
  meCourses: () => ['me', 'courses'] as const,
  meProgress: () => ['me', 'progress'] as const,
  meNotes: () => ['me', 'notes'] as const,

  courses: () => ['courses'] as const,
  course: (id: string) => ['courses', id] as const,
  courseTopics: (id: string) => ['courses', id, 'topics'] as const,
  courseLectures: (id: string) => ['courses', id, 'lectures'] as const,
  courseQueue: (id: string) => ['courses', id, 'queue'] as const,
  coursePillars: (id: string) => ['courses', id, 'pillars'] as const,
  courseUsers: (id: string) => ['courses', id, 'users'] as const,

  topic: (id: string) => ['topics', id] as const,
  topicNotes: (id: string) => ['topics', id, 'notes'] as const,

  adminUsers: () => ['admin', 'users'] as const,
  adminCourses: () => ['admin', 'courses'] as const,
  adminLectures: () => ['admin', 'lectures'] as const,
} as const
