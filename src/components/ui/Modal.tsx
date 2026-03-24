import {
  useEffect,
  useRef,
  useCallback,
  useState,
  useId,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useIsMobile } from '../../hooks/useMediaQuery'

type ModalSize = 'sm' | 'md' | 'lg'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: ModalSize
  /** Ref to the element that should receive focus on open. Defaults to the dialog itself. */
  initialFocusRef?: React.RefObject<HTMLElement | null>
}

const maxWidths: Record<ModalSize, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[672px]',
  lg: 'max-w-[800px]',
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  initialFocusRef,
}: ModalProps) {
  const isMobile = useIsMobile()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const titleId = useId()

  // Animate in
  useEffect(() => {
    if (isOpen) {
      // Allow one frame for mount, then set visible for CSS transition
      const frame = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset visibility when modal closes
    setVisible(false)
  }, [isOpen])

  // Focus management
  useEffect(() => {
    if (!isOpen) return
    const target = initialFocusRef?.current ?? dialogRef.current
    target?.focus()
  }, [isOpen, initialFocusRef])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [],
  )

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      className={[
        'fixed inset-0 z-50 flex',
        isMobile ? 'items-end' : 'items-center justify-center',
        'transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={[
          'relative z-10 w-full bg-background shadow-xl outline-none',
          'transition-transform duration-200',
          'motion-reduce:transition-none',
          maxWidths[size],
          isMobile
            ? [
                'rounded-t-[24px] pb-[env(safe-area-inset-bottom)]',
                visible ? 'translate-y-0' : 'translate-y-full',
              ].join(' ')
            : [
                'rounded-[24px]',
                visible ? 'scale-100' : 'scale-95',
              ].join(' '),
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2
            id={titleId}
            className="text-lg font-semibold text-text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
