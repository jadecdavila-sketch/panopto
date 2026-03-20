import { useNavigate } from 'react-router-dom'
import type { RecentActivityItem, ModalityType } from '../../types/domain'

interface RecentActivityProps {
  items: RecentActivityItem[]
}

function ModalityIcon({ type }: { type: ModalityType }) {
  switch (type) {
    case 'flashcards':
      return (
        <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M2 4.5A2.5 2.5 0 014.5 2h5A2.5 2.5 0 0112 4.5v11a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 012 15.5v-11z" />
          <path d="M8 4.5A2.5 2.5 0 0110.5 2h5A2.5 2.5 0 0118 4.5v11a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 018 15.5v-11z" opacity="0.5" />
        </svg>
      )
    case 'quiz':
      return (
        <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'mindmap':
      return (
        <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5z"
            clipRule="evenodd"
          />
        </svg>
      )
  }
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

export function RecentActivity({ items }: RecentActivityProps) {
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <section aria-label="Recent Activity">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Recent Activity</h2>
        <p className="text-sm text-text-secondary">No activity yet. Start studying to see your progress here.</p>
      </section>
    )
  }

  return (
    <section aria-label="Recent Activity">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Recent Activity</h2>
      <ul className="divide-y divide-border rounded-lg border border-border bg-background">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => navigate(item.route)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
            >
              <ModalityIcon type={item.modalityType} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {item.title}
                </p>
                <p className="text-xs text-text-secondary">
                  {item.modalityType === 'mindmap'
                    ? 'Mind Map'
                    : `Score: ${Math.round(item.score * 100)}%`}
                </p>
              </div>
              <span className="shrink-0 text-xs text-text-disabled">
                {timeAgo(item.completedAt)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
