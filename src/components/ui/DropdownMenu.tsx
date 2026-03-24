import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

interface DropdownMenuItem {
  label: string
  onClick: () => void
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
}

interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownMenuItem[]
  align?: 'left' | 'right'
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Focus management
  useEffect(() => {
    if (open && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.focus()
    }
  }, [open, activeIndex])

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
        setActiveIndex(0)
      }
    },
    [],
  )

  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => (prev + 1) % items.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
          break
        case 'Escape':
          e.preventDefault()
          setOpen(false)
          setActiveIndex(-1)
          break
        case 'Enter':
        case ' ': {
          e.preventDefault()
          const item = items[activeIndex]
          if (item && !item.disabled) {
            item.onClick()
            setOpen(false)
          }
          break
        }
      }
    },
    [items, activeIndex],
  )

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Trigger */}
      <div
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((prev) => !prev)
          if (!open) setActiveIndex(-1)
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        {trigger}
      </div>

      {/* Menu */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className={[
            'absolute z-40 mt-1 min-w-[180px] rounded-lg border border-border bg-background py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
          ].join(' ')}
        >
          {items.map((item, i) => (
            <button
              key={i}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              role="menuitem"
              tabIndex={activeIndex === i ? 0 : -1}
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick()
                  setOpen(false)
                }
              }}
              className={[
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                item.danger
                  ? 'text-status-failed hover:bg-status-failed/10'
                  : 'text-text-primary hover:bg-surface',
                item.disabled ? 'opacity-40 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {item.icon && (
                <span className="h-4 w-4 shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
