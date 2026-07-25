import { createContext, useContext } from 'react'

import type { GradientConfig } from './types'

export type GradientStore = {
  config: GradientConfig
  presetId: string
  /** Global motion kill switch, surfaced in the control panel. */
  motion: boolean
  set: <K extends keyof GradientConfig>(key: K, value: GradientConfig[K]) => void
  patch: (next: Partial<GradientConfig>) => void
  setMotion: (on: boolean) => void
  applyPreset: (id: string) => void
  reset: () => void
}

export const GradientCtx = createContext<GradientStore | null>(null)

export function useGradient(): GradientStore {
  const ctx = useContext(GradientCtx)
  if (!ctx) throw new Error('useGradient must be used inside <GradientProvider>')
  return ctx
}
