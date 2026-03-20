import { useState } from 'react'
import { Button } from '../ui/Button'

interface ReflectionPromptProps {
  onSubmit: (text: string) => void
  onSkip: () => void
}

export function ReflectionPrompt({ onSubmit, onSkip }: ReflectionPromptProps) {
  const [text, setText] = useState('')

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <h3 className="text-lg font-semibold text-text-primary">
        Reflect on what you&apos;ve learned
      </h3>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="What helped you learn? What will you review next?"
        aria-label="Reflection on your learning"
        className={[
          'w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary',
          'placeholder:text-text-secondary',
          'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
        ].join(' ')}
      />

      <div className="flex items-center gap-4">
        <Button
          variant="primary"
          onClick={() => onSubmit(text)}
          disabled={text.trim().length === 0}
          aria-label="Submit reflection"
        >
          Submit
        </Button>

        <button
          onClick={onSkip}
          className="text-sm text-text-secondary underline hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="Skip reflection"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
