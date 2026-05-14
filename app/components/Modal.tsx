'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Reusable modal primitive. Renders into a body portal so it stacks above
// every page-level z-index. ESC and backdrop click both close. Locks body
// scroll while open. ARIA role="dialog" + aria-modal so assistive tech treats
// it as a true modal surface.
//
// Focus trap is NOT implemented in v1 — initial focus is set to the dialog
// container, which is enough for most flows. If we add a second modal that
// needs full focus trapping (e.g. a destructive-confirm with tab-able actions),
// switch to @headlessui/react Dialog.

interface ModalProps {
  open: boolean
  onClose: () => void
  labelledBy?: string
  className?: string
  children: ReactNode
}

const WIDTH = 'max-w-md'

export function Modal({ open, onClose, labelledBy, className = '', children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    document.addEventListener('keydown', onKeyDown)
    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open || typeof window === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-6"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative w-full ${WIDTH} bg-white rounded-bk-lg shadow-bk-lg outline-none ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
