import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { InlineError } from '../components/ui/InlineError'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { RenameDialog } from '../components/ui/RenameDialog'
import { DropdownMenu } from '../components/ui/DropdownMenu'
import { AssetCard } from '../components/asset/AssetCard'
import { StudySetCard } from '../components/studyset/StudySetCard'
import { GenerationModal } from '../components/asset/GenerationModal'
import { ContentPickerModal } from '../components/study/ContentPickerModal'
import { CreateTopicDialog } from '../components/topic/CreateTopicDialog'
import { AddAssetModal } from '../components/asset/AddAssetModal'
import { CreateStudySetDialog } from '../components/studyset/CreateStudySetDialog'
import { Layers, ClipboardCheck, Network } from 'lucide-react'
import { NotesButton } from '../components/ui/NotesButton'
import { AiChatFab } from '../components/chat/AiChatFab'
import { AiChatPanel } from '../components/chat/AiChatPanel'
import { useToast } from '../context/ToastContext'
import {
  getTopicDetail,
  getTopicKPIs,
  renameTopic,
  archiveTopic,
  unarchiveTopic,
  renameAsset,
  removeAsset,
  getAssetKPIs,
  renameStudySet,
  deleteStudySet,
} from '../services/mockApi'
import type {
  Topic,
  LearningAsset,
  StudySet,
  TopicKPI,
  AssetKPI,
  ModalityType,
  GenerationScope,
} from '../types/domain'

/* ------------------------------------------------------------------ */
/*  Filter options                                                     */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatLastStudied(dateStr: string | null): string {
  if (!dateStr) return '\u2014'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  // Data state
  const [topic, setTopic] = useState<Topic | null>(null)
  usePageTitle(topic?.name ?? 'Folio')
  const [assets, setAssets] = useState<LearningAsset[]>([])
  const [studySets, setStudySets] = useState<StudySet[]>([])
  const [kpis, setKpis] = useState<TopicKPI | null>(null)
  const [assetKpiMap, setAssetKpiMap] = useState<Record<string, AssetKPI>>({})

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog state
  const [renameOpen, setRenameOpen] = useState(false)
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)

  // Generation modal state
  const [generationModal, setGenerationModal] = useState<{
    isOpen: boolean
    modalityType: ModalityType
  }>({ isOpen: false, modalityType: 'flashcards' })

  // Content picker state
  const [contentPicker, setContentPicker] = useState<{
    isOpen: boolean
    modality: 'flashcards' | 'quiz'
  }>({ isOpen: false, modality: 'flashcards' })

  // + New dialog state
  const [createTopicOpen, setCreateTopicOpen] = useState(false)
  const [addAssetOpen, setAddAssetOpen] = useState(false)
  const [createStudySetOpen, setCreateStudySetOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(true)

  /* ---------------------------------------------------------------- */
  /*  Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  const fetchData = useCallback(async () => {
    if (!topicId) return
    setIsLoading(true)
    setError(null)

    try {
      const [detail, topicKpis] = await Promise.all([
        getTopicDetail(topicId),
        getTopicKPIs(topicId),
      ])

      setTopic(detail.topic)
      setAssets(detail.assets)
      setStudySets(detail.studySets)
      setKpis(topicKpis)

      // Fetch per-asset KPIs
      const kpiEntries = await Promise.all(
        detail.assets
          .filter((a: LearningAsset) => a.processingStatus === 'ready' && !a.isDeleted)
          .map(async (a: LearningAsset) => {
            const kpi = await getAssetKPIs(a.id)
            return [a.id, kpi] as const
          }),
      )
      setAssetKpiMap(Object.fromEntries(kpiEntries))

    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load folio. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [topicId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  const handleRenameTopic = useCallback(
    async (newName: string) => {
      if (!topicId) return
      try {
        const updated = await renameTopic(topicId, newName)
        setTopic(updated)
        toast.success('Folio renamed')
      } catch {
        toast.error('Failed to rename folio')
      }
    },
    [topicId, toast],
  )

  const handleArchiveToggle = useCallback(async () => {
    if (!topicId || !topic) return
    try {
      if (topic.archived) {
        const updated = await unarchiveTopic(topicId)
        setTopic(updated)
        toast.success('Folio unarchived')
      } else {
        const updated = await archiveTopic(topicId)
        setTopic(updated)
        toast.success('Folio archived')
      }
    } catch {
      toast.error('Failed to update archive status')
    }
  }, [topicId, topic, toast])

  const handleRenameAsset = useCallback(
    async (assetId: string, newTitle: string) => {
      try {
        await renameAsset(assetId, newTitle)
        toast.success('Asset renamed')
        fetchData()
      } catch {
        toast.error('Failed to rename asset')
      }
    },
    [toast, fetchData],
  )

  const handleDeleteAsset = useCallback(
    async (assetId: string) => {
      try {
        await removeAsset(assetId)
        toast.success('Asset deleted')
        fetchData()
      } catch {
        toast.error('Failed to delete asset')
      }
    },
    [toast, fetchData],
  )

  const handleRenameStudySet = useCallback(
    async (setId: string, newName: string) => {
      try {
        await renameStudySet(setId, newName)
        toast.success('Study set renamed')
        fetchData()
      } catch {
        toast.error('Failed to rename study set')
      }
    },
    [toast, fetchData],
  )

  const handleDeleteStudySet = useCallback(
    async (setId: string) => {
      try {
        await deleteStudySet(setId)
        toast.success('Study set deleted')
        fetchData()
      } catch {
        toast.error('Failed to delete study set')
      }
    },
    [toast, fetchData],
  )

  const openGenerationModal = useCallback((modalityType: ModalityType) => {
    setGenerationModal({ isOpen: true, modalityType })
  }, [])

  const closeGenerationModal = useCallback(() => {
    setGenerationModal((prev) => ({ ...prev, isOpen: false }))
  }, [])


  /* ---------------------------------------------------------------- */
  /*  Derived                                                          */
  /* ---------------------------------------------------------------- */

  const readyAssets = assets.filter((a) => a.processingStatus === 'ready' && !a.isSynthesis)
  const hasReadyAssets = readyAssets.length > 0


  const generationScope: GenerationScope | null = topicId
    ? { level: 'topic', topicId }
    : null

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Skeleton variant="text" width="30%" height={24} />
        <Skeleton variant="text" width="60%" height={32} className="mt-3" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height={80} />
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height={120} />
          ))}
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Error state                                                      */
  /* ---------------------------------------------------------------- */

  if (error || !topic) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <InlineError
          message={error ?? 'Folio not found.'}
          onRetry={fetchData}
        />
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl">
      {/* Archived banner */}
      {topic.archived && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-4 py-3">
          <p className="text-sm font-medium text-[#92400E]">
            This folio is archived
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleArchiveToggle}
          >
            Unarchive
          </Button>
        </div>
      )}

      {/* Header hero */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-background to-surface p-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-text-secondary">
            <li>
              <Link
                to="/"
                className="hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-text-disabled">/</li>
            <li aria-current="page" className="font-medium text-text-primary truncate max-w-[200px]">
              {topic.name}
            </li>
          </ol>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Topic icon */}
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest/10 text-forest">
              <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M2 4.5A2.5 2.5 0 014.5 2h2.764a2.5 2.5 0 011.789.764l.586.616a1 1 0 00.723.31H15.5A2.5 2.5 0 0118 6.19V15.5a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 15.5v-11z" />
              </svg>
            </span>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Folio</p>
              <h1 className="mt-1 text-2xl font-semibold text-text-primary">
                {topic.name}
              </h1>
              {kpis && (
                <p className="mt-1.5 text-sm text-text-secondary">
                  {kpis.assetCount} material{kpis.assetCount !== 1 ? 's' : ''}
                  {kpis.studyStreak > 0 && <> &middot; {kpis.studyStreak} day streak</>}
                  {kpis.lastStudiedAt && <> &middot; Last studied {formatLastStudied(kpis.lastStudiedAt)}</>}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {topicId && <NotesButton level="folio" id={topicId} scopeName={topic.name} />}
            <DropdownMenu
              trigger={
                <button
                  type="button"
                  className="rounded-full p-1.5 text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label="Folio actions"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                  </svg>
                </button>
              }
              items={[
                { label: 'Rename', onClick: () => setRenameOpen(true) },
                {
                  label: topic.archived ? 'Unarchive' : 'Archive',
                  onClick: topic.archived
                    ? handleArchiveToggle
                    : () => setArchiveConfirmOpen(true),
                },
              ]}
            />
          </div>
        </div>

        {/* KPI strip (compact, right-aligned) */}
        {kpis && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-xs text-text-secondary">
            {kpis.flashcardAccuracy != null && (
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M2 4.5A2.5 2.5 0 014.5 2h5A2.5 2.5 0 0112 4.5v11a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 012 15.5v-11z" />
                  <path d="M8 4.5A2.5 2.5 0 0110.5 2h5A2.5 2.5 0 0118 4.5v11a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 018 15.5v-11z" opacity="0.5" />
                </svg>
                Flashcard accuracy <span className="font-semibold text-text-primary">{kpis.flashcardAccuracy}%</span>
              </span>
            )}
            {kpis.quizBestScore != null && (
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 1l2.928 6.472L20 8.417l-5.236 4.614L16.18 20 10 16.472 3.82 20l1.416-6.969L0 8.417l7.072-.945L10 1z" clipRule="evenodd" />
                </svg>
                Quiz best <span className="font-semibold text-text-primary">{kpis.quizBestScore}%</span>
              </span>
            )}
            {kpis.studyStreak > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-orange-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                Streak <span className="font-semibold text-text-primary">{kpis.studyStreak}d</span>
              </span>
            )}
            {kpis.lastStudiedAt && (
              <span>Last studied <span className="font-semibold text-text-primary">{formatLastStudied(kpis.lastStudiedAt)}</span></span>
            )}
          </div>
        )}

        {/* Study this folio panel */}
        <div className="mt-5 rounded-xl border border-border bg-primary-tint p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-forest">
            Study this folio
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button
              variant="secondary"
              disabled={!hasReadyAssets}
              leftIcon={<Layers className="h-4 w-4" />}
              onClick={() => setContentPicker({ isOpen: true, modality: 'flashcards' })}
            >
              Flashcards
            </Button>
            <Button
              variant="secondary"
              disabled={!hasReadyAssets}
              leftIcon={<ClipboardCheck className="h-4 w-4" />}
              onClick={() => setContentPicker({ isOpen: true, modality: 'quiz' })}
            >
              Quiz
            </Button>
            <Button
              variant="secondary"
              disabled={!hasReadyAssets}
              leftIcon={<Network className="h-4 w-4" />}
              onClick={() => openGenerationModal('mindmap')}
            >
              Mind Map
            </Button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="mt-10 space-y-8">
        {/* Study Sets */}
        <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-secondary">
              Study Sets
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => setCreateStudySetOpen(true)}
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-transparent p-4 text-primary transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-sm font-medium">New Study Set</span>
              </button>
              {studySets.map((ss) => (
                <StudySetCard
                  key={ss.id}
                  studySet={ss}
                  onRename={handleRenameStudySet}
                  onDelete={handleDeleteStudySet}
                />
              ))}
            </div>
        </section>

        {/* Learning Materials */}
        <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-secondary">
              All Learning Materials
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => setAddAssetOpen(true)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-transparent px-3 py-2.5 text-primary transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-sm font-medium">Add Material</span>
              </button>
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  kpis={assetKpiMap[asset.id]}
                  onRename={handleRenameAsset}
                  onDelete={handleDeleteAsset}
                />
              ))}
            </div>
        </section>
      </div>

      {/* Rename folio dialog */}
      <RenameDialog
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        onRename={handleRenameTopic}
        currentName={topic.name}
        title="Rename folio"
        label="Folio name"
      />

      {/* Archive confirm dialog */}
      <ConfirmDialog
        isOpen={archiveConfirmOpen}
        onClose={() => setArchiveConfirmOpen(false)}
        onConfirm={handleArchiveToggle}
        title="Archive folio"
        message={`Are you sure you want to archive "${topic.name}"? You can unarchive it later.`}
        confirmLabel="Archive"
      />

      {/* Generation modal (mind map only) */}
      {generationScope && (
        <GenerationModal
          isOpen={generationModal.isOpen}
          onClose={closeGenerationModal}
          onSuccess={(result) => {
            fetchData()
            if (result.modalityType === 'mindmap') navigate(`/mindmap/${result.id}`)
          }}
          modalityType={generationModal.modalityType}
          scope={generationScope}
          scopeTitle={topic.name}
          assets={readyAssets}
        />
      )}

      {/* Content picker for adaptive flashcards/quiz */}
      <ContentPickerModal
        isOpen={contentPicker.isOpen}
        onClose={() => setContentPicker((prev) => ({ ...prev, isOpen: false }))}
        scopeName={topic.name}
        modality={contentPicker.modality}
        assets={readyAssets}
        onStart={(selectedAssetIds) => {
          setContentPicker((prev) => ({ ...prev, isOpen: false }))
          const route = contentPicker.modality === 'flashcards' ? '/study/flashcards' : '/study/quiz'
          const params = new URLSearchParams({
            scope: 'topic',
            topicId: topicId!,
            assetIds: selectedAssetIds.join(','),
            returnTo: `/topics/${topicId}`,
          })
          navigate(`${route}?${params.toString()}`)
        }}
      />

      {/* + New dialogs */}
      <CreateTopicDialog
        isOpen={createTopicOpen}
        onClose={() => setCreateTopicOpen(false)}
        onCreated={(newTopic) => {
          navigate(`/topics/${newTopic.id}`)
        }}
      />

      <AddAssetModal
        isOpen={addAssetOpen}
        onClose={() => setAddAssetOpen(false)}
        onAdded={fetchData}
        defaultTopicId={topicId}
      />

      {topicId && (
        <CreateStudySetDialog
          isOpen={createStudySetOpen}
          onClose={() => setCreateStudySetOpen(false)}
          onCreated={() => {
            fetchData()
          }}
          topicId={topicId}
        />
      )}


      </div>
      </div>

      {/* Folio AI */}
      {hasReadyAssets && !chatOpen && <AiChatFab onClick={() => setChatOpen(true)} />}
      {hasReadyAssets && (
        <AiChatPanel
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          assetTitle={topic.name}
          knowledgeTouchpoints={readyAssets.flatMap((a) => a.knowledgeTouchpoints)}
        />
      )}
    </div>
  )
}
