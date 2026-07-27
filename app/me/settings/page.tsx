'use client'

import { Surface } from '@/components/ui/Surface'
import { ThemeToggle } from '@/components/shell/ThemeToggle'

/* §11.12 Settings, split so preferences are adjusted where they are felt.
 * /me/settings holds locale, theme, reduced background motion, haptics and
 * handwriting; the in-place study preferences are listed read-only with a
 * pointer to where they live, so nothing set once becomes unfindable.
 * There are no notification preferences — notifications are a §0 non-goal. */

const IN_PLACE = [
  ['Furigana visibility', 'On any Japanese module'],
  ['Captions', 'In the media player'],
  ['Playback rate', 'In the media player'],
  ['Transcript visibility', 'In the media player'],
]

export default function SettingsPage() {
  return (
    <Surface title="Settings" orientation="Preferences follow your account, not this device.">
      <div style={{ display: 'grid', gap: 'var(--space-6)', maxInlineSize: 'var(--measure)' }}>
        <section style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <h2 className="k-label" style={{ color: 'var(--ink-faint)' }}>
            Interface
          </h2>

          <div className="k-field">
            <label className="k-field__label" htmlFor="locale">
              Language
            </label>
            <select id="locale" className="k-input" defaultValue="en">
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <span className="k-field__label">Theme</span>
            <ThemeToggle />
          </div>

          <label style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
            <input type="checkbox" />
            {/* §9.3A: a user-facing control independent of the OS setting. */}
            Reduce background motion
          </label>

          <label style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
            <input type="checkbox" />
            Haptics on mobile
          </label>

          <label style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
            <input type="checkbox" defaultChecked />
            {/* §9.3D: handwriting is optional and never blocking. */}
            Include handwriting modules
          </label>
        </section>

        <section>
          <h2 className="k-label" style={{ color: 'var(--ink-faint)' }}>
            Set while studying
          </h2>
          <table className="k-table" style={{ marginBlockStart: 'var(--space-2)' }}>
            <caption className="k-visually-hidden">
              Preferences you set in place, and where to find them.
            </caption>
            <thead>
              <tr>
                <th scope="col">Preference</th>
                <th scope="col">Where</th>
              </tr>
            </thead>
            <tbody>
              {IN_PLACE.map(([name, where]) => (
                <tr key={name}>
                  <th scope="row" data-label="Preference">
                    {name}
                  </th>
                  <td data-label="Where">{where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </Surface>
  )
}
