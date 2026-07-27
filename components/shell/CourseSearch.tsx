'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import { useEffect, useState } from 'react'

/* §11.14: search is course-scoped and exists only inside a course. On /me,
 * the catalogue and admin there is no field at all — a scope that changes
 * silently with the route is worse than no search. State lives in the URL. */

function courseScope(pathname: string): boolean {
  return (
    /^\/courses\/[^/]+/.test(pathname) ||
    /^\/topics\/[^/]+/.test(pathname) ||
    /^\/lectures\/[^/]+/.test(pathname)
  )
}

export function CourseSearch() {
  const pathname = usePathname()
  const params = useSearchParams()
  const router = useRouter()
  const [value, setValue] = useState(params.get('q') ?? '')

  useEffect(() => {
    setValue(params.get('q') ?? '')
  }, [params])

  if (!courseScope(pathname)) return null

  function commit(next: string) {
    const query = new URLSearchParams(Array.from(params.entries()))
    if (next) query.set('q', next)
    else query.delete('q')
    router.replace(`${pathname}?${query.toString()}` as Route)
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        commit(value)
      }}
    >
      {/* §6.8: a visible persistent label. Placeholder is never the label. */}
      <label className="k-visually-hidden" htmlFor="course-search">
        Search this course
      </label>
      <input
        id="course-search"
        className="k-input"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ inlineSize: '12rem' }}
      />
    </form>
  )
}
