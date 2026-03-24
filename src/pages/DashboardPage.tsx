import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import type { Topic, DashboardKPI } from '../types/domain'
import {
  listTopics,
  getDashboardKPIs,
} from '../services/mockApi'
import { EmptyDashboard } from '../components/dashboard/EmptyDashboard'
import { KPIStrip } from '../components/dashboard/KPIStrip'
import { Tabs } from '../components/ui/Tabs'
import { TopicsSection } from '../components/library/TopicsSection'
import { AssetsTable } from '../components/library/AssetsTable'
import { Skeleton } from '../components/ui/Skeleton'
import { InlineError } from '../components/ui/InlineError'
import { CreateTopicDialog } from '../components/topic/CreateTopicDialog'
import { AddAssetModal } from '../components/asset/AddAssetModal'

function DevDataToggle() {
  const isSeeded = localStorage.getItem('mock:seeded') === '1'
  return (
    <button
      type="button"
      onClick={() => {
        localStorage.setItem('mock:seeded', isSeeded ? '0' : '1')
        window.location.reload()
      }}
      className="fixed bottom-3 right-3 z-50 cursor-pointer rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary shadow-md hover:bg-background"
      title={isSeeded ? 'Clear sample data' : 'Load sample data'}
    >
      {isSeeded ? '⚪ Clear data' : '🟢 Load sample data'}
    </button>
  )
}

export default function DashboardPage() {
  usePageTitle('Dashboard')
  const navigate = useNavigate()
  const [topics, setTopics] = useState<Topic[]>([])
  const [kpis, setKpis] = useState<DashboardKPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateTopic, setShowCreateTopic] = useState(false)
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [dashTab, setDashTab] = useState('folios')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [topicList, dashKpis] = await Promise.all([
        listTopics(),
        getDashboardKPIs(),
      ])
      setTopics(topicList)
      setKpis(dashKpis)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load data. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <Skeleton variant="text" width="50%" className="mb-2" />
              <Skeleton variant="text" width="30%" height={28} />
            </div>
          ))}
        </div>
        <Skeleton variant="rect" width="100%" height={200} />
        <Skeleton variant="rect" width="100%" height={300} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <InlineError message={error} onRetry={fetchData} />
      </div>
    )
  }

  if (topics.length === 0) {
    return (
      <>
        <EmptyDashboard
          onCreateTopic={() => setShowCreateTopic(true)}
          onAddAsset={() => setShowAddAsset(true)}
          onLoadSampleData={() => {
            localStorage.setItem('mock:seeded', '1')
            window.location.reload()
          }}
        />
        <CreateTopicDialog
          isOpen={showCreateTopic}
          onClose={() => setShowCreateTopic(false)}
          onCreated={(topic) => {
            setShowCreateTopic(false)
            navigate(`/topics/${topic.id}`)
          }}
        />
        <AddAssetModal
          isOpen={showAddAsset}
          onClose={() => setShowAddAsset(false)}
          onAdded={(created) => {
            setShowAddAsset(false)
            if (created && created.length > 0) {
              navigate(`/assets/${created[0].id}`)
            } else {
              fetchData()
            }
          }}
        />
      </>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* KPIs */}
      {kpis && <KPIStrip kpis={kpis} />}

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'folios', label: 'Folios' },
          { id: 'materials', label: 'Learning Materials' },
        ]}
        activeTab={dashTab}
        onChange={setDashTab}
      />

      {/* Tab content */}
      {dashTab === 'folios' && <TopicsSection />}
      {dashTab === 'materials' && <AssetsTable />}

      {/* Dev toggle: clear sample data */}
      {import.meta.env.DEV && <DevDataToggle />}
    </div>
  )
}
