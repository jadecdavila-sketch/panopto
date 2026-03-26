import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RenameDialog } from '../ui/RenameDialog'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import type { StudySet } from '../../types/domain'

interface StudySetCardProps {
  studySet: StudySet
  onRename?: (setId: string, newName: string) => void
  onDelete?: (setId: string) => void
}

function LayersIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M3.196 12.87l6.4 3.56a.75.75 0 00.708 0l6.4-3.56a.75.75 0 00-.354-1.42H3.55a.75.75 0 00-.354 1.42z" />
      <path d="M3.196 8.87l6.4 3.56a.75.75 0 00.708 0l6.4-3.56a.75.75 0 000-1.32l-6.4-3.56a.75.75 0 00-.708 0l-6.4 3.56a.75.75 0 000 1.32z" />
    </svg>
  )
}

export function StudySetCard({
  studySet,
  onRename,
  onDelete,
}: StudySetCardProps) {
  const navigate = useNavigate()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <div
        role="link"
        tabIndex={0}
        className="cursor-pointer rounded-lg border border-border bg-background transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        style={{ borderLeft: '4px solid var(--color-primary)' }}
        onClick={() => navigate(`/topics/${studySet.topicId}/study-sets/${studySet.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            navigate(`/topics/${studySet.topicId}/study-sets/${studySet.id}`)
          }
        }}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon badge */}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayersIcon />
            </span>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">
                {studySet.name}
              </p>

              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary">
                  {studySet.assetIds.length} material{studySet.assetIds.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-text-disabled">Study Set</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Rename dialog */}
      {onRename && (
        <RenameDialog
          isOpen={renameOpen}
          onClose={() => setRenameOpen(false)}
          onRename={(newName) => onRename(studySet.id, newName)}
          currentName={studySet.name}
          title="Rename study set"
          label="Name"
        />
      )}

      {/* Delete confirmation */}
      {onDelete && (
        <ConfirmDialog
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => onDelete(studySet.id)}
          title="Delete study set"
          message={`Are you sure you want to delete "${studySet.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </>
  )
}
