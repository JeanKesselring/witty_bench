import { useEffect, useState } from 'react'

import { ColorField, FieldGroup, SegmentedField, Slider, ToggleField } from './fields'
import { useGradient } from '../shader/gradientContext'
import { PRESETS, configFor, swatchFor } from '../shader/presets'
import { useTheme } from '../theme/themeContext'
import type { GradientConfig } from '../shader/types'

const TYPE_OPTIONS = [
  { value: 'waterPlane', label: 'Water' },
  { value: 'plane', label: 'Plane' },
  { value: 'sphere', label: 'Sphere' },
] as const

const LIGHT_OPTIONS = [
  { value: '3d', label: '3D' },
  { value: 'env', label: 'Env' },
] as const

const ENV_OPTIONS = [
  { value: 'city', label: 'City' },
  { value: 'dawn', label: 'Dawn' },
  { value: 'lobby', label: 'Lobby' },
] as const

/** Serialise the live config back into a paste-ready JSX snippet. */
function toJsx(config: GradientConfig, presetId: string, theme: 'light' | 'dark'): string {
  const base = configFor(presetId, theme)
  const changed = (Object.keys(config) as (keyof GradientConfig)[])
    .filter((k) => config[k] !== base[k])
    .map((k) => {
      const v = config[k]
      return typeof v === 'string' ? `  ${k}="${v}"` : `  ${k}={${JSON.stringify(v)}}`
    })

  return [
    `// preset: ${presetId}${changed.length ? ' + overrides' : ''}`,
    '<ShaderGradientCanvas pixelDensity={1.5} fov={45}>',
    '  <ShaderGradient',
    `    control="props"`,
    ...(Object.keys(config) as (keyof GradientConfig)[]).map((k) => {
      const v = config[k]
      return typeof v === 'string' ? `    ${k}="${v}"` : `    ${k}={${JSON.stringify(v)}}`
    }),
    '  />',
    '</ShaderGradientCanvas>',
  ].join('\n')
}

export function ControlPanel() {
  const { config, presetId, motion, set, setMotion, applyPreset, reset } = useGradient()
  const { theme } = useTheme()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])

  // Escape closes the drawer — it covers the page on small screens.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const copy = async () => {
    await navigator.clipboard.writeText(toJsx(config, presetId, theme))
    setCopied(true)
  }

  return (
    <>
      <button
        type="button"
        className="panel-toggle"
        aria-expanded={open}
        aria-controls="control-panel"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="panel-toggle__dot" style={{ background: config.color1 }} />
        <span className="panel-toggle__dot" style={{ background: config.color2 }} />
        {open ? 'Close' : 'Controls'}
      </button>

      <aside id="control-panel" className="panel" data-open={open}>
        <header className="panel__head">
          <div>
            <h2 className="panel__title">Gradient controls</h2>
            <p className="panel__hint">Drives all three demos live.</p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={reset}>
            Reset
          </button>
        </header>

        <div className="panel__body">
          <FieldGroup title="Preset">
            <div className="presets">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="preset"
                  aria-pressed={p.id === presetId}
                  onClick={() => applyPreset(p.id)}
                >
                  <span
                    className="preset__swatch"
                    style={{
                      background: `linear-gradient(135deg, ${swatchFor(p, theme)[0]}, ${swatchFor(p, theme)[1]})`,
                    }}
                  />
                  {p.label}
                </button>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup title="Motion">
            <ToggleField label="Animate" checked={motion} onChange={setMotion} />
            <Slider
              label="Speed"
              value={config.uSpeed}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => set('uSpeed', v)}
            />
            <Slider
              label="Strength"
              value={config.uStrength}
              min={0}
              max={6}
              step={0.1}
              onChange={(v) => set('uStrength', v)}
            />
            <Slider
              label="Density"
              value={config.uDensity}
              min={0}
              max={4}
              step={0.1}
              onChange={(v) => set('uDensity', v)}
            />
            <Slider
              label="Frequency"
              value={config.uFrequency}
              min={0}
              max={10}
              step={0.1}
              onChange={(v) => set('uFrequency', v)}
            />
          </FieldGroup>

          <FieldGroup title="Palette">
            <ColorField label="Color 1" value={config.color1} onChange={(v) => set('color1', v)} />
            <ColorField label="Color 2" value={config.color2} onChange={(v) => set('color2', v)} />
            <ColorField label="Color 3" value={config.color3} onChange={(v) => set('color3', v)} />
          </FieldGroup>

          <FieldGroup title="Area & framing">
            <p className="group__note">
              The camera decides how much of the mesh fills the element — this is the control that
              actually matters when the same gradient has to work at 390px and 2560px.
            </p>
            <Slider
              label="Distance"
              value={config.cDistance}
              min={0}
              max={20}
              step={0.1}
              onChange={(v) => set('cDistance', v)}
            />
            <Slider
              label="Zoom"
              value={config.cameraZoom}
              min={0.1}
              max={5}
              step={0.05}
              onChange={(v) => set('cameraZoom', v)}
            />
            <Slider
              label="Polar angle"
              value={config.cPolarAngle}
              min={0}
              max={180}
              step={1}
              unit="°"
              onChange={(v) => set('cPolarAngle', v)}
            />
            <Slider
              label="Azimuth"
              value={config.cAzimuthAngle}
              min={0}
              max={360}
              step={1}
              unit="°"
              onChange={(v) => set('cAzimuthAngle', v)}
            />
            <Slider
              label="Offset X"
              value={config.positionX}
              min={-3}
              max={3}
              step={0.1}
              onChange={(v) => set('positionX', v)}
            />
            <Slider
              label="Offset Y"
              value={config.positionY}
              min={-3}
              max={3}
              step={0.1}
              onChange={(v) => set('positionY', v)}
            />
            <Slider
              label="Rotate X"
              value={config.rotationX}
              min={-180}
              max={180}
              step={1}
              unit="°"
              onChange={(v) => set('rotationX', v)}
            />
            <Slider
              label="Rotate Z"
              value={config.rotationZ}
              min={-180}
              max={180}
              step={1}
              unit="°"
              onChange={(v) => set('rotationZ', v)}
            />
          </FieldGroup>

          <FieldGroup title="Surface">
            <SegmentedField
              label="Mesh"
              value={config.type}
              options={TYPE_OPTIONS}
              onChange={(v) => set('type', v)}
            />
            <SegmentedField
              label="Lighting"
              value={config.lightType}
              options={LIGHT_OPTIONS}
              onChange={(v) => set('lightType', v)}
            />
            {config.lightType === 'env' && (
              <>
                <SegmentedField
                  label="Environment"
                  value={config.envPreset}
                  options={ENV_OPTIONS}
                  onChange={(v) => set('envPreset', v)}
                />
                <p className="group__note">
                  Env lighting fetches an HDR map from the ShaderGradient CDN — a real network
                  dependency. `3D` stays local.
                </p>
              </>
            )}
            <Slider
              label="Brightness"
              value={config.brightness}
              min={0}
              max={3}
              step={0.05}
              onChange={(v) => set('brightness', v)}
            />
            <Slider
              label="Reflection"
              value={config.reflection}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => set('reflection', v)}
            />
            <ToggleField
              label="Grain"
              checked={config.grain === 'on'}
              onChange={(v) => set('grain', v ? 'on' : 'off')}
            />
            <ToggleField
              label="Wireframe"
              checked={config.wireframe}
              onChange={(v) => set('wireframe', v)}
            />
          </FieldGroup>
        </div>

        <footer className="panel__foot">
          <button type="button" className="btn btn--primary" onClick={copy}>
            {copied ? 'Copied ✓' : 'Copy JSX'}
          </button>
        </footer>
      </aside>

      {open && (
        <button
          type="button"
          className="panel__scrim"
          aria-label="Close controls"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
