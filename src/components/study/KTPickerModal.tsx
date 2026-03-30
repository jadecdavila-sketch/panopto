import { useState, useMemo } from 'react'
import type { KnowledgeTouchpoint } from '../../types/domain'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface KTPickerModalProps {
  isOpen: boolean
  onClose: () => void
  assetTitle: string
  modality: 'flashcards' | 'quiz' | 'mindmap'
  knowledgeTouchpoints: KnowledgeTouchpoint[]
  /** Pre-selected KT id (e.g. when launched from a specific KT card) */
  preSelectedKtId?: string
  onStart: (selectedKtIds: string[]) => void
}

export function KTPickerModal({
  isOpen,
  onClose,
  assetTitle,
  modality,
  knowledgeTouchpoints,
  preSelectedKtId,
  onStart,
}: KTPickerModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (preSelectedKtId) return new Set([preSelectedKtId])
    return new Set(knowledgeTouchpoints.map((kt) => kt.id))
  })

  // Reset selection when KTs or preSelectedKtId change
  useMemo(() => {
    if (preSelectedKtId) {
      setSelectedIds(new Set([preSelectedKtId]))
    } else {
      setSelectedIds(new Set(knowledgeTouchpoints.map((kt) => kt.id)))
    }
  }, [knowledgeTouchpoints, preSelectedKtId])

  const allSelected = selectedIds.size === knowledgeTouchpoints.length
  const noneSelected = selectedIds.size === 0

  function toggleKt(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(knowledgeTouchpoints.map((kt) => kt.id)))
  }

  const modalityLabel =
    modality === 'flashcards' ? 'Flashcards' : modality === 'quiz' ? 'Quiz' : 'Mind Map'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="What do you want to study?" size="sm">
      <p className="mb-4 text-sm text-text-secondary">
        {assetTitle} — {modalityLabel}
      </p>

      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">Knowledge Touchpoints</span>
        <button
          type="button"
          onClick={toggleAll}
          className="text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      <div className="max-h-64 space-y-1 overflow-y-auto">
        {knowledgeTouchpoints.map((kt) => (
          <label
            key={kt.id}
            className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-surface"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(kt.id)}
              onChange={() => toggleKt(kt.id)}
              className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary"
            />
            <span className="truncate text-sm text-text-primary">{kt.heading}</span>
          </label>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={() => onStart(Array.from(selectedIds))}
          disabled={noneSelected}
          aria-label={`Start ${modalityLabel.toLowerCase()} session`}
        >
          Start
        </Button>
      </div>
    </Modal>
  )
}
