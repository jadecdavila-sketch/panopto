import type { ProcessingStatus } from '../../types/domain'

type AssetType = 'document' | 'video' | 'panopto' | 'synthesis'

interface AssetBadgeProps {
  assetType: AssetType
}

interface StatusBadgeProps {
  status: ProcessingStatus
}

const assetClasses: Record<AssetType, string> = {
  document: 'bg-[#FEF3C7] text-[#92400E]',
  video: 'bg-[#E0F2FE] text-[#0369A1]',
  panopto: 'bg-[#DCFCE7] text-[#166534]',
  synthesis: 'bg-[#FFEDD5] text-[#9A3412]',
}

const assetLabels: Record<AssetType, string> = {
  document: 'Document',
  video: 'Video',
  panopto: 'Panopto',
  synthesis: 'Synthesis',
}

const statusDotColors: Record<ProcessingStatus, string> = {
  pending: 'bg-status-pending',
  processing: 'bg-status-processing',
  ready: 'bg-status-ready',
  failed: 'bg-status-failed',
}

const statusLabels: Record<ProcessingStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  ready: 'Ready',
  failed: 'Failed',
}

export function AssetBadge({ assetType }: AssetBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        assetClasses[assetType],
      ].join(' ')}
    >
      {assetLabels[assetType]}
    </span>
  )
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
      <span
        className={[
          'h-2 w-2 rounded-full',
          statusDotColors[status],
          status === 'processing' ? 'animate-pulse-dot' : '',
        ].join(' ')}
        aria-hidden="true"
      />
      {statusLabels[status]}
    </span>
  )
}
