import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'

interface ResizableDrawerProps {
  children: ReactNode
  onClose: () => void
  defaultHeight?: number
  minHeight?: number
  maxHeightPercent?: number
}

export function ResizableDrawer({
  children,
  onClose,
  defaultHeight = 320,
  minHeight = 160,
  maxHeightPercent = 80,
}: ResizableDrawerProps) {
  const [height, setHeight] = useState(defaultHeight)
  const dragging = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)

  const maxHeight = typeof window !== 'undefined'
    ? (window.innerHeight * maxHeightPercent) / 100
    : 600

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    startY.current = e.clientY
    startHeight.current = height
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [height])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const delta = startY.current - e.clientY
    const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight.current + delta))
    setHeight(newHeight)
  }, [maxHeight, minHeight])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl border-t border-border bg-background shadow-2xl"
      style={{ height }}
      role="region"
      aria-label="Original source viewer"
    >
      {/* Resize handle */}
      <div
        className="flex cursor-row-resize items-center justify-center py-2"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label="Resize drawer"
        role="separator"
        aria-orientation="horizontal"
      >
        <div className="h-1 w-10 rounded-full bg-border-strong" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 pb-3">
        <h2 className="text-sm font-semibold text-text-primary">Original Source</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="Close original viewer"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5">
        {children}
      </div>
    </div>
  )
}
