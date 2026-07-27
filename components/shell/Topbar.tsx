'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { CourseSearch } from './CourseSearch'

/* §2.5: stance is asymmetric and left-weighted — no 1fr auto 1fr centring.
 * §8.1: brand, then primary nav, then tools. §8.3: help sits in the same
 * position on every surface, for every role, never behind a role check. */

const NAV = [
  { href: '/me', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/me/progress', label: 'Progress' },
  { href: '/me/notes', label: 'Notes' },
] as const

export function Topbar({ account }: { account?: ReactNode }) {
  const pathname = usePathname()

  return (
    <header className="k-topbar">
      {/* §13.5: 1-cell monogram plus the wordmark, at every breakpoint.
          Common Sage is the product name; Kite is the design system. */}
      <Link href="/me" className="k-brand" aria-label="Common Sage, home">
        <span className="k-brand__monogram" aria-hidden="true">
          CS
        </span>
        <span className="k-brand__wordmark">Common Sage</span>
      </Link>

      <nav className="k-topbar__nav" aria-label="Primary">
        {NAV.map((item) => {
          const current = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="k-btn k-btn--quiet k-press"
              // §6.5: this changes the path, so it is a nav link and
              // claims aria-current — not a tab.
              aria-current={current ? 'page' : undefined}
              style={
                current
                  ? {
                      textDecoration: 'underline',
                      textUnderlineOffset: 'var(--optical)',
                      color: 'var(--ink)',
                    }
                  : undefined
              }
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="k-topbar__tools">
        {/* §11.14: search exists only inside a course. It reads the URL,
            so it renders behind a Suspense boundary. */}
        <Suspense fallback={null}>
          <CourseSearch />
        </Suspense>
        <ThemeToggle />
        {/* Passed in from the layout: this component is a client component
            for usePathname, and the session is only readable on the server. */}
        {account}
        <Link href="/help" className="k-btn k-btn--quiet k-press">
          Help
        </Link>
      </div>
    </header>
  )
}
