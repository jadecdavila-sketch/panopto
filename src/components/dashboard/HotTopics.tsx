import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Topic, TopicKPI } from '../../types/domain'
import { getTopicKPIs } from '../../services/mockApi'
import { TopicCard } from './TopicCard'
import { Skeleton } from '../ui/Skeleton'

interface HotTopicsProps {
  topics: Topic[]
}

export function HotTopics({ topics }: HotTopicsProps) {
  const navigate = useNavigate()
  const [kpiMap, setKpiMap] = useState<Record<string, TopicKPI>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchKPIs() {
      setLoading(true)
      try {
        const entries = await Promise.all(
          topics.map(async (t) => {
            const kpi = await getTopicKPIs(t.id)
            return [t.id, kpi] as const
          }),
        )
        if (!cancelled) {
          setKpiMap(Object.fromEntries(entries))
        }
      } catch {
        // KPI fetch is best-effort; cards render with fallback
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (topics.length > 0) {
      fetchKPIs()
    } else {
      setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [topics])

  if (loading) {
    return (
      <section aria-label="Hot Folios loading">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Hot Folios</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <Skeleton variant="text" width="60%" height={20} className="mb-3" />
              <Skeleton variant="text" width="40%" className="mb-2" />
              <Skeleton variant="text" width="80%" className="mb-2" />
              <Skeleton variant="text" width="70%" className="mb-2" />
              <Skeleton variant="text" width="50%" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Hot Folios">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Hot Folios</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => {
          const kpi = kpiMap[topic.id] ?? {
            assetCount: 0,
            flashcardAccuracy: null,
            quizBestScore: null,
            studyStreak: 0,
            lastStudiedAt: null,
          }
          return (
            <TopicCard
              key={topic.id}
              name={topic.name}
              kpis={kpi}
              onClick={() => navigate(`/topics/${topic.id}`)}
            />
          )
        })}
      </div>
    </section>
  )
}
