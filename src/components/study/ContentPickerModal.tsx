import { useState, useMemo } from 'react'
import type { LearningAsset } from '../../types/domain'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface ContentPickerModalProps {
  isOpen: boolean
  onClose: () => void
  scopeName: string
  modality: 'flashcards' | 'quiz'
  assets: LearningAsset[]
  onStart: (selectedAssetIds: string[]) => void
}

export function ContentPickerModal({
  isOpen,
  onClose,
  scopeName,
  modality,
  assets,
  onStart,
}: ContentPickerModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(assets.map((a) => a.id)),
  )

  // Reset selection when assets change
  useMemo(() => {
    setSelectedIds(new Set(assets.map((a) => a.id)))
  }, [assets])

  const allSelected = selectedIds.size === assets.length
  const noneSelected = selectedIds.size === 0

  function toggleAsset(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(assets.map((a) => a.id)))
    }
  }

  function handleStart() {
    onStart(Array.from(selectedIds))
  }

  const modalityLabel = modality === 'flashcards' ? 'Flashcards' : 'Quiz'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`What do you want to study?`}
      size="sm"
    >
      <p className="mb-4 text-sm text-text-secondary">
        {scopeName} — {modalityLabel}
      </p>

      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">
          Learning Materials
        </span>
        <button
          type="button"
          onClick={toggleAll}
          className="text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      <div className="max-h-64 space-y-1 overflow-y-auto">
        {assets.map((asset) => (
          <label
            key={asset.id}
            className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-surface"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(asset.id)}
              onChange={() => toggleAsset(asset.id)}
              className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary"
            />
            <span className="truncate text-sm text-text-primary">
              {asset.title}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleStart}
          disabled={noneSelected}
          aria-label={`Start ${modalityLabel.toLowerCase()} session`}
        >
          Start
        </Button>
      </div>
    </Modal>
  )
}
