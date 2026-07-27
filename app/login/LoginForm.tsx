'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { login, type LoginState } from './actions'

/* §6.8 Authentication, bound by SC 3.3.8 Accessible Authentication:
 * paste works everywhere, password managers work via correct autocomplete
 * tokens on a real <form>, and there is no cognitive function test in the
 * path. Every field has a visible persistent label.
 *
 * The form posts to a server action, so it degrades to a plain form post if
 * JavaScript has not loaded — the token exchange happens on the server
 * either way (§12.2).
 */

const INITIAL: LoginState = { error: null }

function Submit() {
  // §10.5: the pending state is on the control that caused it, not a page
  // spinner. The label changes rather than being replaced by a spinner, so
  // the button never changes width mid-press.
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="k-btn k-btn--primary k-press" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, INITIAL)
  const invalid = state.error ? true : undefined

  return (
    <form action={formAction} style={{ display: 'grid', gap: 'var(--space-2)', maxInlineSize: '24rem' }}>
      {/* §9.4: the failure is announced, not just coloured. It sits before
          the fields so a screen reader meets it on the way back to them. */}
      {state.error ? (
        <p className="k-field__error" role="alert" id="login-error">
          {state.error}
        </p>
      ) : null}

      <div className="k-field">
        <label className="k-field__label" htmlFor="username">
          Email
        </label>
        <input
          id="username"
          name="username"
          type="email"
          className="k-input"
          autoComplete="username"
          aria-invalid={invalid}
          aria-describedby={state.error ? 'login-error' : undefined}
          required
        />
      </div>

      <div className="k-field">
        <label className="k-field__label" htmlFor="current-password">
          Password
        </label>
        <input
          id="current-password"
          name="password"
          type="password"
          className="k-input"
          autoComplete="current-password"
          aria-invalid={invalid}
          aria-describedby={state.error ? 'login-error' : undefined}
          required
        />
        <p className="k-field__hint">Required. Pasting is allowed.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link className="k-link k-body-sm" href={'/forgot' as Route}>
          Forgot your password?
        </Link>
        <Submit />
      </div>
    </form>
  )
}
