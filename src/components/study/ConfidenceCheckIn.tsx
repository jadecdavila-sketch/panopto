import { useState, useEffect } from 'react'

interface ConfidenceCheckInProps {
  onRate: (rating: number) => void
  onSkip: () => void
}

export function ConfidenceCheckIn({ onRate, onSkip }: ConfidenceCheckInProps) {
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 5) {
        setSelected(num)
        onRate(num)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onRate])

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-lg font-semibold text-text-primary">
        How confident do you feel?
      </h3>

      <div className="flex gap-3" role="radiogroup" aria-label="Confidence rating">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            role="radio"
            aria-checked={selected === num}
            aria-label={`Confidence ${num} of 5`}
            onClick={() => {
              setSelected(num)
              onRate(num)
            }}
            className={[
              'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              selected === num
                ? 'bg-primary text-[#1A1A1A]'
                : 'border border-border bg-surface text-text-primary hover:bg-primary-tint',
            ].join(' ')}
          >
            {num}
          </button>
        ))}
      </div>

      <button
        onClick={onSkip}
        className="text-sm text-text-secondary underline hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Skip confidence rating"
      >
        Skip
      </button>
    </div>
  )
}
