import { useEffect } from 'react'
import type { QuizQuestion as QuizQuestionType } from '../../types/domain'

interface QuizQuestionProps {
  question: QuizQuestionType
  selectedIndex: number | null
  isAnswered: boolean
  onSelect: (index: number) => void
}

export function QuizQuestion({
  question,
  selectedIndex,
  isAnswered,
  onSelect,
}: QuizQuestionProps) {
  useEffect(() => {
    if (isAnswered) return

    function handleKeyDown(e: KeyboardEvent) {
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 4) {
        onSelect(num - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAnswered, onSelect])

  const isCorrect = isAnswered && selectedIndex === question.correctIndex

  function getOptionClasses(index: number): string {
    const base =
      'flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

    if (!isAnswered) {
      if (selectedIndex === index) {
        return `${base} border-primary bg-primary-tint text-text-primary`
      }
      return `${base} border-border bg-white text-text-primary hover:bg-surface cursor-pointer`
    }

    // Answered: correct — show green on correct answer
    if (isCorrect && index === question.correctIndex) {
      return `${base} border-green-500 bg-green-50 text-text-primary`
    }

    // Answered: wrong — only highlight the selected wrong answer in red, don't reveal correct
    if (!isCorrect && selectedIndex === index) {
      return `${base} border-red-400 bg-red-50 text-text-primary`
    }

    return `${base} border-border bg-white text-text-disabled opacity-60`
  }

  function getOptionIcon(index: number) {
    if (!isAnswered) return null

    // Correct answer: only show checkmark if user got it right
    if (isCorrect && index === question.correctIndex) {
      return (
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
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
      )
    }

    // Wrong answer: show X on the selected wrong option
    if (!isCorrect && selectedIndex === index) {
      return (
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
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
      )
    }

    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text-primary">
        {question.questionText}
      </h2>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Answer options">
        {question.options.map((option, index) => (
          <button
            key={index}
            role="radio"
            aria-checked={selectedIndex === index}
            aria-label={`Option ${index + 1}: ${option}`}
            disabled={isAnswered}
            onClick={() => onSelect(index)}
            className={getOptionClasses(index)}
          >
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-strong text-xs font-medium"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span className="flex-1">{option}</span>
            {getOptionIcon(index)}
          </button>
        ))}
      </div>

      {isAnswered && isCorrect && (
        <div className="rounded-lg border border-border bg-surface px-4 py-3">
          <p className="text-sm font-medium text-text-primary">Explanation</p>
          <p className="mt-1 text-sm text-text-secondary">
            {question.explanation}
          </p>
          {question.citationIds.length > 0 && (
            <p className="mt-2 text-xs text-text-disabled">
              Citation: {question.citationIds.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
