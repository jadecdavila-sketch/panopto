import { useState, useRef, useCallback } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { InlineError } from '../ui/InlineError'
import { useToast } from '../../context/ToastContext'
import { createTopic } from '../../services/mockApi'
import type { Topic } from '../../types/domain'

interface CreateTopicDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (topic: Topic) => void
}

export function CreateTopicDialog({
  isOpen,
  onClose,
  onCreated,
}: CreateTopicDialogProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const resetState = useCallback(() => {
    setName('')
    setError(null)
    setIsSubmitting(false)
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [onClose, resetState])

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim()
    if (!trimmed) return

    setIsSubmitting(true)
    setError(null)

    try {
      const topic = await createTopic(trimmed)
      toast.success(`Folio "${topic.name}" created`)
      resetState()
      onCreated(topic)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create folio. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [name, toast, resetState, onCreated, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && name.trim()) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit, name],
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Folio"
      size="sm"
      initialFocusRef={inputRef}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="topic-name"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Folio name
          </label>
          <input
            ref={inputRef}
            id="topic-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Molecular Genetics"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            autoComplete="off"
          />
        </div>

        {error && <InlineError message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            isLoading={isSubmitting}
          >
            Create
          </Button>
        </div>
      </div>
    </Modal>
  )
}
