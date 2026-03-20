interface FilterOption {
  id: string
  label: string
}

interface FilterChipsProps {
  options: FilterOption[]
  selected: string
  onChange: (id: string) => void
}

export function FilterChips({ options, selected, onChange }: FilterChipsProps) {
  return (
    <div
      role="radiogroup"
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
    >
      {options.map((option) => {
        const isSelected = option.id === selected
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.id)}
            className={[
              'shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors whitespace-nowrap',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              isSelected
                ? 'bg-primary text-[#1A1A1A] font-medium'
                : 'border border-border bg-surface text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
