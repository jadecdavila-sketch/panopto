import { useRef, useCallback } from 'react'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let next = index
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next = (index + 1) % tabs.length
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        next = (index - 1 + tabs.length) % tabs.length
      } else if (e.key === 'Home') {
        e.preventDefault()
        next = 0
      } else if (e.key === 'End') {
        e.preventDefault()
        next = tabs.length - 1
      } else {
        return
      }
      tabRefs.current[next]?.focus()
      onChange(tabs[next].id)
    },
    [tabs, onChange],
  )

  return (
    <div
      role="tablist"
      className="inline-flex gap-1 rounded-lg bg-surface p-1"
    >
      {tabs.map((tab, i) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={[
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              isActive
                ? 'bg-white font-medium text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
