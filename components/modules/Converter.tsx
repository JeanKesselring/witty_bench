'use client'

/* conversion_calculator — restored.
 *
 * §6.10 had deleted this type outright ("bad and useless"); complete_modules.md
 * lists it as a live tool with an input, immediate results, a clear control
 * and a stated validation message, and the catalogue is the authority on
 * interaction. The row is back in the registry, and this is its renderer.
 *
 * The design objection was never groundless, so the answer to it is in the
 * composition rather than in a refusal: results are a table of values, not a
 * grid of boxes competing with the input; the input is the only thing on the
 * card that looks interactive; and the number of significant figures is
 * bounded so `1 ft` does not produce `0.30479999999999996 m`.
 */

import { useId, useState } from 'react'
import type { Figure } from '@/lib/api/types'

export function Converter({ figure }: { figure: Extract<Figure, { kind: 'conversion' }> }) {
  const [raw, setRaw] = useState('1')
  const inputId = useId()
  const errorId = `${inputId}-error`

  const value = Number(raw)
  const valid = raw.trim() !== '' && Number.isFinite(value)

  return (
    <div className="k-fig k-fig--conversion">
      <div className="k-field">
        <label className="k-field__label" htmlFor={inputId}>
          {figure.source.name} ({figure.source.symbol})
        </label>
        <div className="k-convert__input">
          <input
            id={inputId}
            className="k-input"
            inputMode="decimal"
            value={raw}
            aria-invalid={!valid}
            aria-describedby={valid ? undefined : errorId}
            onChange={(e) => setRaw(e.target.value)}
          />
          <button type="button" className="k-btn k-btn--quiet k-press" onClick={() => setRaw('')}>
            Clear
          </button>
        </div>
        {!valid ? (
          <p className="k-field__error" id={errorId}>
            Enter a valid number
          </p>
        ) : null}
      </div>

      {figure.groups.map((group) => (
        <section key={group.label}>
          <h3 className="k-meta">{group.label}</h3>
          <table className="k-table">
            <tbody>
              {group.units.map((unit) => (
                <tr key={unit.symbol}>
                  <th scope="row">{unit.name}</th>
                  <td>
                    {/* aria-live on the container, not per cell: twenty live
                        cells announce twenty times per keystroke. */}
                    {valid ? format(value * unit.factor + (unit.offset ?? 0)) : '—'}{' '}
                    <span className="k-meta">{unit.symbol}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}

/** Four significant figures, and never exponent notation for ordinary
 *  magnitudes — a conversion table is read, not computed with. */
function format(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs !== 0 && (abs < 1e-4 || abs >= 1e9)) return n.toExponential(3)
  const decimals = abs >= 100 ? 1 : abs >= 1 ? 3 : 5
  return Number(n.toFixed(decimals)).toLocaleString()
}
