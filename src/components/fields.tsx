import { useId, type ReactNode } from 'react'

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  unit = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  const id = useId()
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        <span>{label}</span>
        <output className="field__value">
          {step >= 1 ? Math.round(value) : value.toFixed(2)}
          {unit}
        </output>
      </label>
      <input
        id={id}
        className="field__range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const id = useId()
  return (
    <div className="field field--color">
      <label className="field__label" htmlFor={id}>
        <span>{label}</span>
        <output className="field__value">{value}</output>
      </label>
      <input
        id={id}
        className="field__swatch"
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function SegmentedField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className="segmented__item"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  const id = useId()
  return (
    <div className="field field--toggle">
      <label className="field__label" htmlFor={id}>
        <span>{label}</span>
      </label>
      <button
        id={id}
        type="button"
        className="toggle"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle__thumb" />
      </button>
    </div>
  )
}

export function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  // A <legend> is laid out inside the fieldset's border box and straddles any
  // border-top, and the usual float workaround wrecks the flow of everything
  // after it. `aria-label` on the fieldset carries the same grouping semantics
  // with none of the layout special-casing.
  return (
    <fieldset className="group" aria-label={title}>
      <div className="group__title" aria-hidden="true">
        {title}
      </div>
      {children}
    </fieldset>
  )
}
