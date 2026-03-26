import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AssetBadge, StatusBadge } from '../ui/Badge'
import { RenameDialog } from '../ui/RenameDialog'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import type { LearningAsset, AssetKPI } from '../../types/domain'

interface AssetCardProps {
  asset: LearningAsset
  kpis?: AssetKPI
  onRename?: (assetId: string, newTitle: string) => void
  onDelete?: (assetId: string) => void
}

const accentColors: Record<LearningAsset['type'], string> = {
  document: '#F59E0B',
  video: '#38BDF8',
  panopto: '#2AC271',
}

function TypeIcon({ type }: { type: LearningAsset['type'] }) {
  const className = 'h-5 w-5 shrink-0'
  switch (type) {
    case 'document':
      return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'video':
      return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
      )
    case 'panopto':
      return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm5.5 8.5h5a.75.75 0 000-1.5h-5a.75.75 0 000 1.5zM8 6.75A.75.75 0 018.75 6h2.5a.75.75 0 010 1.5h-2.5A.75.75 0 018 6.75z"
            clipRule="evenodd"
          />
        </svg>
      )
  }
}

function formatLastStudied(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

export function AssetCard({
  asset,
  kpis,
  onRename,
  onDelete,
}: AssetCardProps) {
  const navigate = useNavigate()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isReady = asset.processingStatus === 'ready'
  const hasStudied = kpis && kpis.lastStudiedAt != null


  return (
    <>
      <div
        role="link"
        tabIndex={0}
        className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 shadow-sm transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onClick={() => navigate(`/assets/${asset.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            navigate(`/assets/${asset.id}`)
          }
        }}
      >
        {/* Type accent dot + icon */}
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${accentColors[asset.type]}15`, color: accentColors[asset.type] }}
        >
          <TypeIcon type={asset.type} />
        </span>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-text-primary">
              {asset.title}
            </p>
            {!isReady && <StatusBadge status={asset.processingStatus} />}
          </div>
          <p className="mt-0.5 text-xs text-text-disabled">
            {hasStudied ? (
              <>
                Flashcards: {kpis.flashcardAccuracy != null ? `${kpis.flashcardAccuracy}%` : '--'}
                {' \u00B7 '}
                Quiz: {kpis.quizBestScore != null ? `${kpis.quizBestScore}%` : '--'}
                {' \u00B7 '}
                {formatLastStudied(kpis.lastStudiedAt)}
              </>
            ) : (
              <AssetBadge assetType={asset.type} />
            )}
          </p>
        </div>

        {/* Chevron hint */}
        <svg className="h-4 w-4 shrink-0 text-text-disabled" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Rename dialog */}
      {onRename && (
        <RenameDialog
          isOpen={renameOpen}
          onClose={() => setRenameOpen(false)}
          onRename={(newName) => onRename(asset.id, newName)}
          currentName={asset.title}
          title="Rename asset"
          label="Title"
        />
      )}

      {/* Delete confirmation */}
      {onDelete && (
        <ConfirmDialog
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => onDelete(asset.id)}
          title="Delete asset"
          message={`Are you sure you want to delete "${asset.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </>
  )
}
