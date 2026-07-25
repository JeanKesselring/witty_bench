import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { useTheme } from '../theme/themeContext'
import { GradientCtx, type GradientStore } from './gradientContext'
import { PRESETS, configFor } from './presets'
import type { GradientConfig } from './types'

export function GradientProvider({
  initialPresetId = PRESETS[0].id,
  children,
}: {
  initialPresetId?: string
  children: ReactNode
}) {
  const { theme } = useTheme()
  const [presetId, setPresetId] = useState(initialPresetId)
  const [config, setConfig] = useState<GradientConfig>(() => configFor(initialPresetId, theme))
  const [motion, setMotion] = useState(true)

  // Switching theme re-applies the current preset in the other palette. Light
  // is a separate palette, not a transform of the dark one, so there is nothing
  // sensible to carry across — any hand-tuned values are intentionally reset.
  const lastTheme = useRef(theme)
  useEffect(() => {
    if (lastTheme.current === theme) return
    lastTheme.current = theme
    setConfig(configFor(presetId, theme))
  }, [theme, presetId])

  const patch = useCallback((next: Partial<GradientConfig>) => {
    setConfig((prev) => ({ ...prev, ...next }))
  }, [])

  const set = useCallback<GradientStore['set']>(
    (key, value) => setConfig((prev) => ({ ...prev, [key]: value })),
    [],
  )

  const applyPreset = useCallback(
    (id: string) => {
      setPresetId(id)
      setConfig(configFor(id, theme))
    },
    [theme],
  )

  const reset = useCallback(() => setConfig(configFor(presetId, theme)), [presetId, theme])

  const value = useMemo<GradientStore>(
    () => ({ config, presetId, motion, set, patch, setMotion, applyPreset, reset }),
    [config, presetId, motion, set, patch, applyPreset, reset],
  )

  return <GradientCtx.Provider value={value}>{children}</GradientCtx.Provider>
}
