'use client'

import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from 'react-aria-components'
import type { ReactNode } from 'react'

/* §6.11 Dialog: opaque paper, zero radius, cell-multiple geometry, flat
 * scrim with no blur. Focus is trapped and returns to the opener (§8.7) —
 * React Aria supplies that, which is why §13.2 chose it.
 * No nested dialogs: a dialog that needs a dialog is a wizard (§6.7). */

export function ConfirmDialog({
  trigger,
  title,
  body,
  confirmLabel,
  onConfirm,
  destructive = false,
}: {
  trigger: ReactNode
  title: string
  body: ReactNode
  confirmLabel: string
  onConfirm: () => void
  destructive?: boolean
}) {
  return (
    <DialogTrigger>
      {trigger}
      <ModalOverlay className="k-scrim">
        <Modal>
          <Dialog className="k-dialog">
            {({ close }) => (
              <>
                <Heading slot="title" className="k-h3">
                  {title}
                </Heading>
                <div className="k-body-sm">{body}</div>
                <div className="k-dialog__actions">
                  <Button className="k-btn k-btn--secondary k-press" onPress={close}>
                    Cancel
                  </Button>
                  <Button
                    className={
                      destructive
                        ? 'k-btn k-btn--destructive k-press'
                        : 'k-btn k-btn--primary k-press'
                    }
                    onPress={() => {
                      onConfirm()
                      close()
                    }}
                  >
                    {confirmLabel}
                  </Button>
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
