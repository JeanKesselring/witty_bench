'use server'

import { redirect } from 'next/navigation'
import { BACKEND, clearSession, setSession } from '@/lib/auth/session'

/* §11.3 Auth flow. The form posts to a server action rather than to a client
 * fetch, so the token is never in reach of page JavaScript and the form keeps
 * working without it — which is also what makes password managers and paste
 * behave (§6.8, SC 3.3.8).
 *
 * The backend speaks OAuth2's password grant, so this is form-encoded with
 * `username` (an email, despite the name) and `password`.
 */

export interface LoginState {
  /** Rendered in an alert region; null when there is nothing to say. */
  error: string | null
  /** Distinguishes "wrong credentials" from "server unreachable" (§11.13). */
  retryable?: boolean
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!username || !password) {
    return { error: 'Enter your email and password.' }
  }

  let res: Response
  try {
    res = await fetch(`${BACKEND}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password }),
      cache: 'no-store',
    })
  } catch {
    return { error: 'The server could not be reached.', retryable: true }
  }

  if (res.status === 401) {
    // Deliberately does not say which of the two was wrong — the same rule
    // §11.3 applies to /forgot, for the same account-enumeration reason.
    return { error: 'Incorrect email or password.' }
  }

  if (!res.ok) {
    return { error: 'Sign in failed. Try again.', retryable: true }
  }

  const data = (await res.json()) as { access_token?: string }
  if (!data.access_token) {
    return { error: 'Sign in failed. Try again.', retryable: true }
  }

  await setSession(data.access_token)
  // §11.2: role-aware landing. /me redirects onward per role.
  redirect('/me')
}

export async function logout() {
  await clearSession()
  redirect('/login')
}
