import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Topic, TopicKPI } from '../../types/domain'
import { listAllTopics, getTopicKPIs } from '../../services/mockApi'
import { Skeleton } from '../ui/Skeleton'
import { InlineError } from '../ui/InlineError'
import { CreateTopicDialog } from '../topic/CreateTopicDialog'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No activity'
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

export function TopicsSection() {
  const navigate = useNavigate()
  const [topics, setTopics] = useState<Topic[]>([])
  const [kpiMap, setKpiMap] = useState<Record<string, TopicKPI>>({})
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const fetchTopics = async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await listAllTopics()
      setTopics(all)

      const entries = await Promise.all(
        all.map(async (t) => {
          const kpi = await getTopicKPIs(t.id)
          return [t.id, kpi] as const
        }),
      )
      setKpiMap(Object.fromEntries(entries))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load folios.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTopics()
  }, [])

  const visibleTopics = showArchived
    ? topics
    : topics.filter((t) => !t.archived)

  if (loading) {
    return (
      <section aria-label="Folios loading">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton variant="text" width={120} height={24} />
          <Skeleton variant="text" width={120} height={20} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <Skeleton variant="text" width="60%" height={20} className="mb-2" />
              <Skeleton variant="text" width="40%" className="mb-1" />
              <Skeleton variant="text" width="50%" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section aria-label="Folios">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Folios</h2>
        <InlineError message={error} onRetry={fetchTopics} />
      </section>
    )
  }

  return (
    <section aria-label="Folios">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Folios{' '}
          <span className="text-sm font-normal text-text-secondary">
            ({visibleTopics.length})
          </span>
        </h2>

        <button
          type="button"
          role="switch"
          aria-checked={showArchived}
          onClick={() => setShowArchived(!showArchived)}
          className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary"
        >
          <span className="text-sm">Show archived</span>
          <span
            className={[
              'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200',
              showArchived ? 'bg-primary' : 'bg-border',
            ].join(' ')}
          >
            <span
              className={[
                'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                showArchived ? 'translate-x-[18px]' : 'translate-x-0.5',
              ].join(' ')}
              style={{ marginTop: '2px' }}
            />
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* New folio card */}
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-transparent p-4 text-primary transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="text-sm font-medium">New Folio</span>
        </button>

        {visibleTopics.map((topic) => {
          const kpi = kpiMap[topic.id]
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => navigate(`/topics/${topic.id}`)}
              className={[
                'w-full cursor-pointer rounded-lg border border-border bg-background p-4 text-left transition-colors',
                'hover:border-primary/40 hover:shadow-sm',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                topic.archived ? 'opacity-60' : '',
              ].join(' ')}
            >
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-semibold text-text-primary">{topic.name}</h3>
                {topic.archived && (
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-text-disabled">
                    Archived
                  </span>
                )}
              </div>
              <div className="space-y-0.5 text-sm text-text-secondary">
                <p>{kpi?.assetCount ?? 0} material{(kpi?.assetCount ?? 0) !== 1 ? 's' : ''}</p>
                <p>Last activity: {formatDate(kpi?.lastStudiedAt ?? null)}</p>
              </div>
            </button>
          )
        })}
      </div>

      <CreateTopicDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(newTopic) => {
          setShowCreate(false)
          navigate(`/topics/${newTopic.id}`)
        }}
      />
    </section>
  )
}
