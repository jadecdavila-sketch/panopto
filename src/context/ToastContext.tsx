import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToastVariant = 'success' | 'error'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

const DISMISS_MS = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = `toast-${++counterRef.current}`
    setToasts((prev) => [...prev, { id, message, variant }])
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      timersRef.current.delete(id)
    }, DISMISS_MS)
    timersRef.current.set(id, timer)
  }, [])

  const success = useCallback(
    (message: string) => addToast(message, 'success'),
    [addToast],
  )

  const error = useCallback(
    (message: string) => addToast(message, 'error'),
    [addToast],
  )

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/*  Toast item                                                         */
/* ------------------------------------------------------------------ */

function ToastItem({ toast }: { toast: Toast }) {
  const accentClass =
    toast.variant === 'success'
      ? 'border-l-primary'
      : 'border-l-status-failed'

  return (
    <div
      role="alert"
      className={[
        'pointer-events-auto animate-[slide-in-right_0.25s_ease-out]',
        'flex min-w-[280px] max-w-sm items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 shadow-lg',
        'border-l-4',
        accentClass,
      ].join(' ')}
    >
      {toast.variant === 'success' ? (
        <svg
          className="h-4 w-4 shrink-0 text-primary"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 8.5l3.5 3.5L13 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          className="h-4 w-4 shrink-0 text-status-failed"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 4L4 12M4 4l8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span className="text-sm text-text-primary">{toast.message}</span>
    </div>
  )
}
