import { useState, useEffect, useRef, useCallback } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
}: SearchInputProps) {
  const [internal, setInternal] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Sync external value changes
  useEffect(() => {
    setInternal(value)
  }, [value])

  const handleChange = useCallback(
    (next: string) => {
      setInternal(next)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onChange(next), debounceMs)
    },
    [onChange, debounceMs],
  )

  // Cleanup timer
  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return (
    <div className="relative">
      {/* Search icon */}
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M13.5 13.5L17 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      <input
        type="search"
        value={internal}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={[
          'w-full rounded-full border border-border bg-background py-2 pl-9 pr-9 text-sm text-text-primary outline-none',
          'placeholder:text-text-disabled',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
        ].join(' ')}
        aria-label={placeholder}
      />

      {/* Clear button */}
      {internal.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setInternal('')
            onChange('')
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Clear search"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M11 3L3 11M3 3l8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
