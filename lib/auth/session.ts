import { cookies } from 'next/headers'

/* §12.2 The session, server-adjacent.
 *
 * The access token lives in an httpOnly cookie and is read only on the
 * server — by the proxy in app/api/v1/[...path]/route.ts, which attaches it
 * as a Bearer header, and by the helpers here. The browser never holds it,
 * which is the reason §13.1 stays on Next rather than dropping to a static
 * SPA: there is nowhere in an SPA to put a token that JavaScript cannot read.
 *
 * This module is server-only. It carries no `server-only` import because the
 * package is not a dependency here; `next/headers` enforces the same thing at
 * runtime, since cookies() throws outside a server context.
 */

const COOKIE = 'cs_session'

export const BACKEND = process.env.COMMON_SAGE_API ?? 'http://localhost:8000'

/** The backend's user shape, from GET /api/v1/auth/me. */
export interface SessionUser {
  uuid: string
  name: string
  lastname: string
  email: string
  role: 'admin' | 'educator' | 'student' | 'service'
  status: string
  institution?: string | null
}

export async function setSession(token: string) {
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Plain http on localhost would drop a `secure` cookie outright.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}

export async function clearSession() {
  const jar = await cookies()
  jar.delete(COOKIE)
}

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE)?.value
}

/**
 * The signed-in user, or null.
 *
 * Never throws: a surface that cannot identify the user renders its
 * signed-out state rather than an error. §11.13 is explicit that a 401 is
 * not a redirect to /login — the interface stays where it is.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getToken()
  if (!token) return null

  try {
    const res = await fetch(`${BACKEND}/api/v1/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as SessionUser
  } catch {
    return null
  }
}
