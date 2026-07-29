'use client'

/* The `⋯` in the header band — §6.10 says it is always present, and §6.11
 * says what a menu owes: opened by an explicit control, closed by Escape, an
 * outside click or blur, focus moves inside but is not trapped, and focus
 * returns to the trigger.
 *
 * It carries exactly two things, both from the catalogue's shared drill
 * behaviour: `Report grading issue`, and the note control (§11.15). Nothing
 * else earns a place — a menu that accumulates entries becomes a menu nobody
 * reads.
 */

import { useEffect, useRef, useState } from 'react'
import type { ModuleItem } from '@/lib/api/types'
import { useToast } from '@/components/ui/Toast'

export function ModuleMenu({ item }: { item: ModuleItem }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (!open) return
    const items = () =>
      Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const root = rootRef.current
    items()[0]?.focus()
    const onDown = (e: MouseEvent) => {
      if (!root?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
        return
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
      const menuItems = items()
      if (menuItems.length === 0) return
      e.preventDefault()
      const current = menuItems.indexOf(document.activeElement as HTMLElement)
      const next =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? menuItems.length - 1
            : e.key === 'ArrowDown'
              ? (current + 1) % menuItems.length
              : (current - 1 + menuItems.length) % menuItems.length
      menuItems[next]?.focus()
    }
    const onFocus = (e: FocusEvent) => {
      if (!root?.contains(e.relatedTarget as Node | null)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    root?.addEventListener('focusout', onFocus)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      root?.removeEventListener('focusout', onFocus)
    }
  }, [open])

  return (
    <div className="k-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="k-btn k-btn--quiet k-press"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">⋯</span>
        <span className="k-sr">More for this module</span>
      </button>

      {open ? (
        <div ref={menuRef} className="k-menu__list" role="menu">
          <button
            type="button"
            role="menuitem"
            className="k-btn k-btn--quiet k-press"
            onClick={() => {
              setOpen(false)
              let reports: Array<Record<string, unknown>> = []
              try {
                const stored = JSON.parse(
                  window.localStorage.getItem('kite-module-reports') ?? '[]',
                )
                if (Array.isArray(stored)) reports = stored
              } catch {
                // A malformed old value should not make the report control
                // itself fail. Start a fresh local outbox.
              }
              reports.push({
                moduleId: item.id,
                moduleType: item.moduleType,
                topicId: item.topicId,
                createdAt: new Date().toISOString(),
              })
              window.localStorage.setItem('kite-module-reports', JSON.stringify(reports.slice(-50)))
              toast.push({
                tone: 'info',
                message: `Report saved on this device for the ${item.topicTitle} module.`,
              })
              triggerRef.current?.focus()
            }}
          >
            Report grading issue
          </button>
          <a
            role="menuitem"
            className="k-btn k-btn--quiet k-press"
            href={`/topics/${item.topicId}`}
          >
            Open topic &amp; notes
          </a>
        </div>
      ) : null}
    </div>
  )
}
