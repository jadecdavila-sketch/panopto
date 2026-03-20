import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { KPICard } from '../components/ui/KPICard'
import { FilterChips } from '../components/ui/FilterChips'
import { Skeleton } from '../components/ui/Skeleton'
import { InlineError } from '../components/ui/InlineError'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { RenameDialog } from '../components/ui/RenameDialog'
import { DropdownMenu } from '../components/ui/DropdownMenu'
import { AssetCard } from '../components/asset/AssetCard'
import { StudySetCard } from '../components/studyset/StudySetCard'
import { GenerationModal } from '../components/asset/GenerationModal'
import { CreateTopicDialog } from '../components/topic/CreateTopicDialog'
import { AddAssetModal } from '../components/asset/AddAssetModal'
import { CreateStudySetDialog } from '../components/studyset/CreateStudySetDialog'
import { Layers, ClipboardCheck, Network } from 'lucide-react'
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
  listFlashcardSets,
  listQuizzes,
  listMindMaps,
  listAllFlashcardSetsForTopic,
  listAllQuizzesForTopic,
  listAllMindMapsForTopic,
} from '../services/mockApi'
import type {
  Topic,
  LearningAsset,
  StudySet,
  TopicKPI,
  AssetKPI,
  FlashcardSet,
  Quiz,
  MindMap,
  ModalityType,
  GenerationScope,
} from '../types/domain'

/* ------------------------------------------------------------------ */
/*  Filter options                                                     */
/* ------------------------------------------------------------------ */

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'assets', label: 'Materials' },
  { id: 'studysets', label: 'Study Sets' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quizzes', label: 'Quizzes' },
  { id: 'mindmaps', label: 'Mind Maps' },
]

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function scopeLabel(
  scope: GenerationScope,
  assetMap: Record<string, string>,
  ktMap: Record<string, string>,
): string {
  switch (scope.level) {
    case 'topic':
      return 'Entire folio'
    case 'studyset':
      return 'Study set'
    case 'asset':
      return assetMap[scope.assetId] ?? 'Asset'
    case 'kt': {
      const assetName = assetMap[scope.assetId] ?? 'Asset'
      const ktName = ktMap[scope.ktId] ?? 'Touchpoint'
      return `${assetName} › ${ktName}`
    }
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

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
  const [assets, setAssets] = useState<LearningAsset[]>([])
  const [studySets, setStudySets] = useState<StudySet[]>([])
  const [kpis, setKpis] = useState<TopicKPI | null>(null)
  const [assetKpiMap, setAssetKpiMap] = useState<Record<string, AssetKPI>>({})
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([])
  const [quizList, setQuizList] = useState<Quiz[]>([])
  const [mindMapList, setMindMapList] = useState<MindMap[]>([])
  const [allFlashcardSets, setAllFlashcardSets] = useState<FlashcardSet[]>([])
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([])
  const [allMindMaps, setAllMindMaps] = useState<MindMap[]>([])

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [viewMode] = useState<'grid' | 'list'>('grid')

  // Dialog state
  const [renameOpen, setRenameOpen] = useState(false)
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)

  // Generation modal state
  const [generationModal, setGenerationModal] = useState<{
    isOpen: boolean
    modalityType: ModalityType
  }>({ isOpen: false, modalityType: 'flashcards' })

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
      const [detail, topicKpis, fSets, qList, mList, allFS, allQ, allMM] = await Promise.all([
        getTopicDetail(topicId),
        getTopicKPIs(topicId),
        listFlashcardSets({ level: 'topic', topicId }),
        listQuizzes({ level: 'topic', topicId }),
        listMindMaps({ level: 'topic', topicId }),
        listAllFlashcardSetsForTopic(topicId),
        listAllQuizzesForTopic(topicId),
        listAllMindMapsForTopic(topicId),
      ])

      setTopic(detail.topic)
      setAssets(detail.assets)
      setStudySets(detail.studySets)
      setKpis(topicKpis)
      setFlashcardSets(fSets)
      setQuizList(qList)
      setMindMapList(mList)
      setAllFlashcardSets(allFS)
      setAllQuizzes(allQ)
      setAllMindMaps(allMM)

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

  const readyAssets = assets.filter((a) => a.processingStatus === 'ready')
  const hasReadyAssets = readyAssets.length > 0

  const showAssets = filter === 'all' || filter === 'assets'
  const showStudySets = filter === 'all' || filter === 'studysets'
  const showFlashcards = filter === 'flashcards'
  const showQuizzes = filter === 'quizzes'
  const showMindMaps = filter === 'mindmaps'

  const generationScope: GenerationScope | null = topicId
    ? { level: 'topic', topicId }
    : null

  // Lookup maps for scope labels
  const assetNameMap: Record<string, string> = Object.fromEntries(
    assets.map((a) => [a.id, a.title]),
  )
  const ktNameMap: Record<string, string> = Object.fromEntries(
    assets.flatMap((a) => a.knowledgeTouchpoints.map((kt) => [kt.id, kt.heading])),
  )

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

        {/* KPI strip */}
        {kpis && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <KPICard
              label="Flashcard Accuracy"
              value={kpis.flashcardAccuracy != null ? `${kpis.flashcardAccuracy}%` : null}
            />
            <KPICard
              label="Quiz Best Score"
              value={kpis.quizBestScore != null ? `${kpis.quizBestScore}%` : null}
            />
            <KPICard
              label="Study Streak"
              value={kpis.studyStreak > 0 ? `${kpis.studyStreak} days` : null}
            />
            <KPICard
              label="Last Studied"
              value={formatLastStudied(kpis.lastStudiedAt)}
            />
          </div>
        )}

        {/* Study actions */}
        <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
          {flashcardSets.length > 0 ? (
            <Button
              variant="success"
              size="sm"
              onClick={() => navigate(`/flashcards/${flashcardSets[0].id}/session`)}
            >
              Study flashcards
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled={!hasReadyAssets}
              onClick={() => openGenerationModal('flashcards')}
            >
              Generate flashcards
            </Button>
          )}
          {quizList.length > 0 ? (
            <Button
              variant="success"
              size="sm"
              onClick={() => navigate(`/quiz/${quizList[0].id}/session`)}
            >
              Take quiz
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled={!hasReadyAssets}
              onClick={() => openGenerationModal('quiz')}
            >
              Generate quiz
            </Button>
          )}
          {mindMapList.length > 0 ? (
            <Button
              variant="success"
              size="sm"
              onClick={() => navigate(`/mindmap/${mindMapList[0].id}`)}
            >
              View mind map
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled={!hasReadyAssets}
              onClick={() => openGenerationModal('mindmap')}
            >
              Generate mind map
            </Button>
          )}
        </div>
      </div>

      {/* View toggle + filter */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <FilterChips
          options={FILTER_OPTIONS}
          selected={filter}
          onChange={setFilter}
        />

        <DropdownMenu
          trigger={
            <Button
              variant="secondary"
              size="sm"
              leftIcon={
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
            >
              New
            </Button>
          }
          items={[
            { label: 'Learning Material', onClick: () => setAddAssetOpen(true) },
            { label: 'Study Set', onClick: () => setCreateStudySetOpen(true) },
          ]}
        />
      </div>

      {/* Content area */}
      <div className="mt-6 space-y-8">
        {/* Assets */}
        {showAssets && assets.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-secondary">
              Learning Materials
            </h2>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'flex flex-col gap-3'
              }
            >
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
        )}

        {/* Study Sets */}
        {showStudySets && studySets.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-secondary">
              Study Sets
            </h2>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'flex flex-col gap-3'
              }
            >
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
        )}

        {/* Flashcard Sets (all levels) */}
        {showFlashcards && (
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-secondary">
              Flashcard Sets
            </h2>
            {allFlashcardSets.length === 0 ? (
              <p className="rounded-lg border border-border px-4 py-8 text-center text-sm text-text-secondary">
                No flashcard sets generated yet for this topic.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {allFlashcardSets.map((fs) => (
                  <div
                    key={fs.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                      <Layers className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {fs.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                          {scopeLabel(fs.scope, assetNameMap, ktNameMap)}
                        </span>
                        <span className="text-xs text-text-disabled">
                          {fs.cards.length} cards &middot; {formatDate(fs.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => navigate(`/flashcards/${fs.id}/session`)}
                    >
                      Study
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Quizzes (all levels) */}
        {showQuizzes && (
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-secondary">
              Quizzes
            </h2>
            {allQuizzes.length === 0 ? (
              <p className="rounded-lg border border-border px-4 py-8 text-center text-sm text-text-secondary">
                No quizzes generated yet for this topic.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {allQuizzes.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                      <ClipboardCheck className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {q.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                          {scopeLabel(q.scope, assetNameMap, ktNameMap)}
                        </span>
                        <span className="text-xs text-text-disabled">
                          {q.questions.length} questions &middot; {formatDate(q.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => navigate(`/quiz/${q.id}/session`)}
                    >
                      Take
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Mind Maps (all levels) */}
        {showMindMaps && (
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-secondary">
              Mind Maps
            </h2>
            {allMindMaps.length === 0 ? (
              <p className="rounded-lg border border-border px-4 py-8 text-center text-sm text-text-secondary">
                No mind maps generated yet for this topic.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {allMindMaps.map((mm) => (
                  <div
                    key={mm.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                      <Network className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {mm.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                          {scopeLabel(mm.scope, assetNameMap, ktNameMap)}
                        </span>
                        <span className="text-xs text-text-disabled">
                          {mm.nodes.length} nodes &middot; {formatDate(mm.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => navigate(`/mindmap/${mm.id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Empty state */}
        {showAssets && assets.length === 0 && showStudySets && studySets.length === 0 && (
          <p className="rounded-lg border border-border px-4 py-12 text-center text-sm text-text-secondary">
            No content in this folio yet. Add learning materials to get started.
          </p>
        )}
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

      {/* Generation modal */}
      {generationScope && (
        <GenerationModal
          isOpen={generationModal.isOpen}
          onClose={closeGenerationModal}
          onSuccess={(result) => {
            fetchData()
            if (result.modalityType === 'flashcards') navigate(`/flashcards/${result.id}/session`)
            else if (result.modalityType === 'quiz') navigate(`/quiz/${result.id}/session`)
            else if (result.modalityType === 'mindmap') navigate(`/mindmap/${result.id}`)
          }}
          modalityType={generationModal.modalityType}
          scope={generationScope}
          scopeTitle={topic.name}
          assets={readyAssets}
        />
      )}

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
