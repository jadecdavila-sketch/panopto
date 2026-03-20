import { useState, useEffect, useRef, useCallback } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { InlineError } from '../ui/InlineError'
import { AssetBadge } from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { listAssets, createStudySet } from '../../services/mockApi'
import type { LearningAsset, StudySet } from '../../types/domain'

interface CreateStudySetDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (studySet: StudySet) => void
  topicId: string
}

export function CreateStudySetDialog({
  isOpen,
  onClose,
  onCreated,
  topicId,
}: CreateStudySetDialogProps) {
  const [name, setName] = useState('')
  const [assets, setAssets] = useState<LearningAsset[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  // Fetch ready assets for the topic
  useEffect(() => {
    if (!isOpen || !topicId) return
    setIsLoadingAssets(true)
    listAssets(topicId)
      .then((all) => {
        const ready = all.filter((a) => a.processingStatus === 'ready')
        setAssets(ready)
      })
      .catch(() => setAssets([]))
      .finally(() => setIsLoadingAssets(false))
  }, [isOpen, topicId])

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setName('')
      setSelectedIds(new Set())
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const toggleAsset = useCallback((assetId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(assetId)) {
        next.delete(assetId)
      } else {
        next.add(assetId)
      }
      return next
    })
  }, [])

  const canSubmit = name.trim().length > 0 && selectedIds.size > 0 && !isSubmitting

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    setError(null)

    try {
      const studySet = await createStudySet(topicId, name.trim(), Array.from(selectedIds))
      toast.success(`Study Set "${studySet.name}" created`)
      onCreated(studySet)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create study set. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [canSubmit, topicId, name, selectedIds, toast, onCreated, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && canSubmit) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit, canSubmit],
  )

  const handleClose = useCallback(() => {
    setName('')
    setSelectedIds(new Set())
    setError(null)
    onClose()
  }, [onClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Study Set"
      size="md"
      initialFocusRef={inputRef}
    >
      <div className="flex flex-col gap-4">
        {/* Name input */}
        <div>
          <label
            htmlFor="studyset-name"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Name
          </label>
          <input
            ref={inputRef}
            id="studyset-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Midterm Review"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            autoComplete="off"
          />
        </div>

        {/* Asset checklist */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-text-primary">
            Assets{' '}
            {selectedIds.size > 0 && (
              <span className="font-normal text-text-secondary">
                ({selectedIds.size} selected)
              </span>
            )}
          </p>

          {isLoadingAssets ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Skeleton variant="rect" width={16} height={16} />
                  <Skeleton variant="text" width="60%" height={14} />
                </div>
              ))}
            </div>
          ) : assets.length === 0 ? (
            <p className="rounded-lg border border-border px-4 py-6 text-center text-sm text-text-secondary">
              No ready assets in this topic yet.
            </p>
          ) : (
            <ul
              className="flex max-h-[240px] flex-col gap-1 overflow-y-auto"
              role="group"
              aria-label="Select assets for the study set"
            >
              {assets.map((asset) => {
                const isSelected = selectedIds.has(asset.id)
                return (
                  <li key={asset.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAsset(asset.id)}
                        className="h-4 w-4 rounded border-border text-primary accent-primary"
                        aria-label={`Select ${asset.title}`}
                      />
                      <span className="flex-1 truncate text-sm text-text-primary">
                        {asset.title}
                      </span>
                      <AssetBadge assetType={asset.type} />
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error && <InlineError message={error} />}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} isLoading={isSubmitting}>
            Create
          </Button>
        </div>
      </div>
    </Modal>
  )
}
