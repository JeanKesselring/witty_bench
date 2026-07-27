import { Surface } from '@/components/ui/Surface'

/* §11.3: /forgot reports the same message whether or not the address
 * exists. Account enumeration through differential responses is the
 * standard failure here, and the copy is what leaks — so the copy is
 * specified. The message states how long the link is valid, in words,
 * before the learner goes looking for it. */

export default function ForgotPage() {
  return (
    <Surface title="Reset your password" orientation="We’ll send you a link.">
      <form
        method="post"
        style={{ display: 'grid', gap: 'var(--space-2)', maxInlineSize: '24rem' }}
      >
        <div className="k-field">
          <label className="k-field__label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="k-input"
            autoComplete="username"
            required
          />
          <p className="k-field__hint">
            If an account exists for that address, a reset link is on its way.
            The link works for one hour, and opens in any browser.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="k-btn k-btn--primary k-press">
            Send the link
          </button>
        </div>
      </form>
    </Surface>
  )
}
