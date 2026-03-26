import { useState, useEffect, useCallback, useMemo } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { InlineError } from '../ui/InlineError'
import { useToast } from '../../context/ToastContext'
import {
  generateFlashcardSet,
  generateQuiz,
  generateMindMap,
} from '../../services/mockApi'
import type {
  GenerationScope,
  ModalityType,
  KnowledgeTouchpoint,
  LearningAsset,
} from '../../types/domain'

interface GenerationResult {
  modalityType: ModalityType
  id: string
}

interface GenerationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (result: GenerationResult) => void
  modalityType: ModalityType
  scope: GenerationScope
  scopeTitle: string
  knowledgeTouchpoints?: KnowledgeTouchpoint[]
  assets?: LearningAsset[]
}

const modalityLabels: Record<ModalityType, string> = {
  flashcards: 'Flashcards',
  quiz: 'Quiz',
  mindmap: 'Mind Map',
}

const countOptions = {
  flashcards: Array.from({ length: 10 }, (_, i) => (i + 1) * 5),
  quiz: Array.from({ length: 6 }, (_, i) => (i + 1) * 5),
}

const difficultyOptions = ['easy', 'medium', 'hard'] as const

export function GenerationModal({
  isOpen,
  onClose,
  onSuccess,
  modalityType,
  scope,
  scopeTitle,
  knowledgeTouchpoints,
  assets,
}: GenerationModalProps) {
  const toast = useToast()

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const label = modalityLabels[modalityType]

  // Determine selection items based on scope level
  const selectionItems = useMemo(() => {
    if (scope.level === 'topic' && assets) {
      return assets.map((a) => ({ id: a.id, label: a.title }))
    }
    if (
      (scope.level === 'asset' || scope.level === 'studyset') &&
      knowledgeTouchpoints
    ) {
      return knowledgeTouchpoints.map((kt) => ({ id: kt.id, label: kt.heading }))
    }
    return []
  }, [scope.level, assets, knowledgeTouchpoints])

  const showSelection = scope.level !== 'kt' && selectionItems.length > 0

  // Reset state on open
  useEffect(() => {
    if (!isOpen) return
    setSelectedIds(new Set(selectionItems.map((item) => item.id)))
    setName(`${scopeTitle} \u2014 ${label}`)
    setCount(10)
    setDifficulty('medium')
    setError(null)
    setIsSubmitting(false)
  }, [isOpen, selectionItems, scopeTitle, label])

  const toggleItem = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          // Prevent deselecting the last item
          if (next.size <= 1) return prev
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    },
    [],
  )

  const canSubmit = !isSubmitting && (
    !showSelection || selectedIds.size > 0
  )

  const handleGenerate = useCallback(async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    setError(null)

    const ktIds = scope.level !== 'topic'
      ? Array.from(selectedIds)
      : undefined

    try {
      let resultId: string
      switch (modalityType) {
        case 'flashcards': {
          const fs = await generateFlashcardSet(scope, {
            count,
            difficulty,
            name: name.trim(),
            ktIds,
          })
          resultId = fs.id
          break
        }
        case 'quiz': {
          const q = await generateQuiz(scope, {
            count,
            difficulty,
            name: name.trim(),
            ktIds,
          })
          resultId = q.id
          break
        }
        case 'mindmap': {
          const mm = await generateMindMap(scope, {
            name: name.trim(),
            ktIds,
          })
          resultId = mm.id
          break
        }
      }
      toast.success(`${label} generated successfully`)
      onClose()
      onSuccess({ modalityType, id: resultId })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to generate ${label.toLowerCase()}. Please try again.`,
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [
    canSubmit, modalityType, scope, count, difficulty, name,
    selectedIds, label, toast, onSuccess, onClose,
  ])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Generate ${label}`}
      size="md"
    >
      <div className="flex flex-col gap-4">
        {/* Scope label */}
        <p className="text-sm text-text-secondary">
          From: <span className="font-medium text-text-primary">{scopeTitle}</span>
        </p>

        {/* Selection checklist */}
        {showSelection && (
          <div>
            <p className="mb-1.5 text-sm font-medium text-text-primary">
              {scope.level === 'topic' ? 'Materials' : 'Knowledge Touchpoints'}
              {' '}
              <span className="font-normal text-text-secondary">
                ({selectedIds.size} selected)
              </span>
            </p>
            <ul
              className="flex max-h-[200px] flex-col gap-1 overflow-y-auto"
              role="group"
              aria-label={
                scope.level === 'topic'
                  ? 'Select materials to include'
                  : 'Select knowledge touchpoints to include'
              }
            >
              {selectionItems.map((item) => {
                const isSelected = selectedIds.has(item.id)
                const isLastSelected = isSelected && selectedIds.size === 1
                return (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:bg-surface">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isLastSelected}
                        onChange={() => toggleItem(item.id)}
                        className="h-4 w-4 rounded border-border text-primary accent-primary"
                        aria-label={`Select ${item.label}`}
                      />
                      <span className="flex-1 truncate text-sm text-text-primary">
                        {item.label}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Count option (flashcards / quiz only) */}
        {modalityType !== 'mindmap' && (
          <div>
            <label
              htmlFor="generation-count"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              {modalityType === 'flashcards' ? 'Number of cards' : 'Number of questions'}
            </label>
            <select
              id="generation-count"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background py-2 pl-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {(modalityType === 'flashcards'
                ? countOptions.flashcards
                : countOptions.quiz
              ).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Difficulty option (flashcards / quiz only) */}
        {modalityType !== 'mindmap' && (
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-text-primary">
              Difficulty
            </legend>
            <div className="flex gap-3">
              {difficultyOptions.map((opt) => (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-1.5 text-sm text-text-primary"
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={opt}
                    checked={difficulty === opt}
                    onChange={() => setDifficulty(opt)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="capitalize">{opt}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* Error */}
        {error && <InlineError message={error} />}

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={!canSubmit}
          isLoading={isSubmitting}
          className="w-full"
        >
          Generate
        </Button>
      </div>
    </Modal>
  )
}
