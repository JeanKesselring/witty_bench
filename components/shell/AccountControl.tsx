import Link from 'next/link'
import type { Route } from 'next'
import { logout } from '@/app/login/actions'
import type { SessionUser } from '@/lib/auth/session'

/* §8.1 tools cluster. Who you are signed in as, and the way out.
 *
 * Sign out is a POST via a server action, never a link: signing out is a
 * state change, and a GET that mutates gets fired by link prefetching and
 * by anything that crawls the page. */

export function AccountControl({ user }: { user: SessionUser | null }) {
  if (!user) {
    return (
      <Link href={'/login' as Route} className="k-btn k-btn--quiet k-press">
        Sign in
      </Link>
    )
  }

  return (
    <form action={logout} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
      {/* §7.4: the account is named, not just implied by an avatar — a
          monogram alone cannot tell you which of two accounts you are in. */}
      <span className="k-meta" title={user.email}>
        {user.name} {user.lastname}
      </span>
      <button type="submit" className="k-btn k-btn--quiet k-press">
        Sign out
      </button>
    </form>
  )
}
