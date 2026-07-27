'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

/* §6.11 Toasts: bottom-left, because bottom-right belongs to the primary
 * action. Max 3 stacked, growing upward; a fourth replaces the oldest.
 * 6s default, 10s with an action — and a retry after a rollback (§7.4)
 * never auto-dismisses. The timeout pauses on hover and while focus is
 * inside (SC 2.2.1). §9.4: polite, assertive only for errors. */

export interface Toast {
  id: number
  message: string
  tone: 'info' | 'error'
  action?: { label: string; onAction: () => void }
}

interface ToastApi {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: number) => void
}

const Ctx = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const MAX = 3

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const next = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((all) => all.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    setToasts((all) => {
      const withNew = [...all, { ...t, id: next.current++ }]
      // A fourth replaces the oldest.
      return withNew.slice(-MAX)
    })
  }, [])

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false)
  // A toast offering retry after a rollback persists until acted on.
  const sticky = Boolean(toast.action)

  useEffect(() => {
    if (sticky || paused) return
    const ms = 6000
    const timer = setTimeout(onDismiss, ms)
    return () => clearTimeout(timer)
  }, [sticky, paused, onDismiss])

  return (
    <div
      className={toast.tone === 'error' ? 'k-toast k-toast--err' : 'k-toast'}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <p>{toast.message}</p>
      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
        {toast.action ? (
          <button
            type="button"
            className="k-btn k-btn--secondary k-press"
            onClick={() => {
              toast.action?.onAction()
              onDismiss()
            }}
          >
            {toast.action.label}
          </button>
        ) : null}
        <button type="button" className="k-btn k-btn--quiet k-press" onClick={onDismiss}>
          Close
        </button>
      </div>
    </div>
  )
}

export function ToastRegion() {
  const { toasts, dismiss } = useToast()
  const errors = toasts.filter((t) => t.tone === 'error')
  const polite = toasts.filter((t) => t.tone !== 'error')

  return (
    <>
      {/* §9.4: one assertive region per surface, maximum. */}
      <div className="k-toasts" role="alert" aria-live="assertive">
        {errors.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
      <div className="k-toasts" role="status" aria-live="polite">
        {polite.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </>
  )
}
