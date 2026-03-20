import type { TopicKPI } from '../../types/domain'

interface TopicCardProps {
  name: string
  kpis: TopicKPI
  onClick: () => void
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not started'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString()
}

export function TopicCard({ name, kpis, onClick }: TopicCardProps) {
  const accuracy =
    kpis.flashcardAccuracy != null
      ? `${kpis.flashcardAccuracy}%`
      : 'No activity yet'

  const quizScore =
    kpis.quizBestScore != null
      ? `${kpis.quizBestScore}%`
      : 'No activity yet'

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full cursor-pointer rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <h3 className="mb-2 font-semibold text-text-primary">{name}</h3>

      <div className="space-y-1 text-sm text-text-secondary">
        <p>{kpis.assetCount} asset{kpis.assetCount !== 1 ? 's' : ''}</p>
        <p>
          <span className="text-text-disabled">Flashcard accuracy:</span>{' '}
          {accuracy}
        </p>
        <p>
          <span className="text-text-disabled">Quiz best score:</span>{' '}
          {quizScore}
        </p>
        <p>
          <span className="text-text-disabled">Last studied:</span>{' '}
          {formatDate(kpis.lastStudiedAt)}
        </p>
      </div>
    </button>
  )
}
