import { redirect } from 'next/navigation'
import { Surface } from '@/components/ui/Surface'
import { getCurrentUser } from '@/lib/auth/session'
import { LoginForm } from './LoginForm'

/* §11.3 Auth flow: register → verify → login → role-aware landing.
 * The form itself is a client component only because it renders the failure
 * state; the token exchange is a server action (./actions.ts). */

export default async function LoginPage() {
  // Already signed in: this surface has nothing to offer, so it hands over
  // to the landing rather than asking for credentials a second time.
  if (await getCurrentUser()) redirect('/me')

  return (
    <Surface title="Sign in" orientation="Welcome back.">
      <LoginForm />
    </Surface>
  )
}
