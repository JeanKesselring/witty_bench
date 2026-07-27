import { redirect } from 'next/navigation'

/* §11.2: role-aware landing → /me for students. */
export default function Index() {
  redirect('/me')
}
