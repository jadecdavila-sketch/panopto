import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DropdownMenu } from '../ui/DropdownMenu'
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

function ThreeDotsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    </svg>
  )
}

export function StudySetCard({
  studySet,
  onRename,
  onDelete,
}: StudySetCardProps) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const menuItems = [
    ...(onRename
      ? [{ label: 'Rename', onClick: () => setRenameOpen(true) }]
      : []),
    {
      label: 'Edit assets',
      onClick: () => {
        /* navigate to edit — handled by parent or future link */
      },
    },
    ...(onDelete
      ? [{ label: 'Delete', onClick: () => setDeleteOpen(true), danger: true }]
      : []),
  ]

  return (
    <>
      <div className="rounded-lg border border-border bg-background overflow-hidden transition-shadow hover:shadow-md">
        {/* Accent top bar */}
        <div className="h-1 bg-gradient-to-r from-primary to-forest" />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon badge */}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayersIcon />
            </span>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <Link
                to={`/topics/${studySet.topicId}/study-sets/${studySet.id}`}
                className="block truncate text-sm font-semibold text-text-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {studySet.name}
              </Link>

              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary">
                  {studySet.assetIds.length} material{studySet.assetIds.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-text-disabled">Study Set</span>
              </div>
            </div>

            {/* Menu */}
            <DropdownMenu
              trigger={
                <button
                  type="button"
                  className="rounded-full p-1 text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label={`Actions for ${studySet.name}`}
                >
                  <ThreeDotsIcon />
                </button>
              }
              items={menuItems}
            />
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
