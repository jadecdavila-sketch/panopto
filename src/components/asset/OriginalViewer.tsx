import { useState, useMemo } from 'react'
import type { LearningAsset, Citation } from '../../types/domain'
import { AssetBadge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface OriginalViewerProps {
  asset: LearningAsset
  activeCitation?: Citation
}

function DocumentViewer({
  asset,
  activeCitation,
}: {
  asset: LearningAsset
  activeCitation?: Citation
}) {
  const totalPages = asset.pages ?? 5
  // Derive initial page from citation; allow user override
  const citationPage = activeCitation?.page
    ? Math.min(activeCitation.page, totalPages)
    : null
  const [userPage, setUserPage] = useState<number | null>(null)
  const currentPage = userPage ?? citationPage ?? 1
  const setCurrentPage = (updater: (prev: number) => number) => {
    setUserPage(updater(currentPage))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Page navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <span className="text-sm text-text-secondary">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>

      {/* Placeholder page content */}
      <div
        className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6"
        aria-label={`Document page ${currentPage}`}
      >
        <div className="h-4 w-3/4 rounded bg-text-disabled/20" aria-hidden="true" />
        <div className="h-3 w-full rounded bg-text-disabled/15" aria-hidden="true" />
        <div className="h-3 w-full rounded bg-text-disabled/15" aria-hidden="true" />
        <div className="h-3 w-5/6 rounded bg-text-disabled/15" aria-hidden="true" />
        <div className="mt-2 h-3 w-full rounded bg-text-disabled/15" aria-hidden="true" />
        <div className="h-3 w-4/5 rounded bg-text-disabled/15" aria-hidden="true" />
        <div className="h-3 w-full rounded bg-text-disabled/15" aria-hidden="true" />
        <div className="h-3 w-2/3 rounded bg-text-disabled/15" aria-hidden="true" />
      </div>
    </div>
  )
}

function VideoViewer({ activeCitation }: { activeCitation?: Citation }) {
  const jumpTarget = useMemo(() => {
    if (activeCitation?.timestampSec == null) return null
    const m = Math.floor(activeCitation.timestampSec / 60)
    const s = activeCitation.timestampSec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }, [activeCitation])

  return (
    <div className="flex flex-col gap-3">
      {/* Placeholder video */}
      <div
        className="relative flex aspect-video items-center justify-center rounded-lg bg-[#1A1A1A]"
        role="img"
        aria-label="Video player placeholder"
      >
        <svg
          className="h-16 w-16 text-white/60"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>

      {jumpTarget && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            // In a real app this would seek the video
            console.log(`Jumping to ${jumpTarget}`)
          }}
        >
          Jump to {jumpTarget}
        </Button>
      )}
    </div>
  )
}

function PanoptoViewer() {
  return (
    <div className="flex flex-col gap-3">
      {/* Placeholder iframe area */}
      <div
        className="flex aspect-video flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface"
        role="img"
        aria-label="Panopto video embed placeholder"
      >
        <svg
          className="mb-2 h-10 w-10 text-text-disabled"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm font-medium text-text-secondary">Panopto Video</p>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => console.log('Open in Panopto clicked')}
      >
        Open in Panopto
      </Button>
    </div>
  )
}

export function OriginalViewer({ asset, activeCitation }: OriginalViewerProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-text-primary truncate">
          {asset.title}
        </h2>
        <AssetBadge assetType={asset.type} />
      </div>

      {/* Viewer by type */}
      {asset.type === 'document' && (
        <DocumentViewer asset={asset} activeCitation={activeCitation} />
      )}
      {asset.type === 'video' && (
        <VideoViewer activeCitation={activeCitation} />
      )}
      {asset.type === 'panopto' && <PanoptoViewer />}
    </div>
  )
}
