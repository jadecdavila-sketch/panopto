import { useSyncExternalStore } from 'react'

interface FlashcardCardProps {
  front: string
  back: string
  isFlipped: boolean
  onFlip: () => void
}

/** Subscribe to prefers-reduced-motion media query */
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}

export function FlashcardCard({
  front,
  back,
  isFlipped,
  onFlip,
}: FlashcardCardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div
      className="w-full max-w-[600px] cursor-pointer"
      style={{ perspective: reduceMotion ? undefined : '1000px' }}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onFlip()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={
        isFlipped
          ? 'Flashcard showing answer. Click to flip back.'
          : 'Flashcard showing question. Click to flip.'
      }
    >
      {reduceMotion ? (
        /* Reduced-motion: instant swap via display toggle */
        <div className="relative min-h-[300px] w-full">
          {!isFlipped && (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl bg-white p-8 shadow-lg">
              <p className="text-center text-[20px] font-medium text-text-primary">
                {front}
              </p>
            </div>
          )}
          {isFlipped && (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl bg-primary-tint p-8 shadow-lg">
              <p className="text-center text-[20px] text-text-primary">
                {back}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Animated 3D flip */
        <div
          className="relative min-h-[300px] w-full"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-white p-8 shadow-lg"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-center text-[20px] font-medium text-text-primary">
              {front}
            </p>
          </div>

          {/* Back face (pre-rotated) */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-primary-tint p-8 shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-center text-[20px] text-text-primary">{back}</p>
          </div>
        </div>
      )}

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        {isFlipped ? `Answer: ${back}` : `Question: ${front}`}
      </div>
    </div>
  )
}
