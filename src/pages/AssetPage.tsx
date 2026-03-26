import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import {
  getAssetDetail,
  getAssetKPIs,
  retryAssetProcessing,
  renameAsset,
  removeAsset,
  getTopicDetail,
  getStudySetDetail,
} from '../services/mockApi'
import type { LearningAsset, AssetKPI, Citation, GenerationScope } from '../types/domain'
import { useProcessingPoller } from '../hooks/useProcessingPoller'
import { useToast } from '../context/ToastContext'
import { Layers, ClipboardCheck, Network } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { AssetBadge, StatusBadge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { InlineError } from '../components/ui/InlineError'

import { KnowledgeTouchpointCard } from '../components/asset/KnowledgeTouchpointCard'
import { OriginalViewer } from '../components/asset/OriginalViewer'
import { AiChatFab } from '../components/chat/AiChatFab'
import { AiChatPanel } from '../components/chat/AiChatPanel'
import { GenerationModal } from '../components/asset/GenerationModal'
import { NotesButton } from '../components/ui/NotesButton'
import { DropdownMenu } from '../components/ui/DropdownMenu'
import { RenameDialog } from '../components/ui/RenameDialog'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ResizableDrawer } from '../components/ui/ResizableDrawer'

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function TypeIcon({ type }: { type: LearningAsset['type'] }) {
  const cls = 'h-6 w-6'
  switch (type) {
    case 'document':
      return (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'video':
      return (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
      )
    case 'panopto':
      return (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5z"
            clipRule="evenodd"
          />
        </svg>
      )
  }
}

/* ------------------------------------------------------------------ */
/*  Skeleton KT cards                                                  */
/* ------------------------------------------------------------------ */

function SkeletonKTCards() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading knowledge touchpoints">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-background p-5">
          <Skeleton variant="text" width="60%" height={24} />
          <div className="mt-3">
            <Skeleton variant="text" width="100%" height={14} />
          </div>
          <div className="mt-1">
            <Skeleton variant="text" width="90%" height={14} />
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton variant="rect" width={120} height={32} />
            <Skeleton variant="rect" width={100} height={32} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function AssetPage() {
  const { assetId } = useParams<{ assetId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  // Context from navigation (e.g. coming from a study set)
  const fromSetId = searchParams.get('fromSet')
  const fromTopicId = searchParams.get('topicId')

  // Breadcrumb names
  const [topicName, setTopicName] = useState<string | null>(null)
  const [studySetName, setStudySetName] = useState<string | null>(null)

  // Data state
  const [asset, setAsset] = useState<LearningAsset | null>(null)
  usePageTitle(asset?.title ?? 'Asset')
  const [kpis, setKpis] = useState<AssetKPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [showOriginal, setShowOriginal] = useState(false)
  const [activeCitation, setActiveCitation] = useState<Citation | undefined>()

  const [chatOpen, setChatOpen] = useState(true)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  // Generation modal state
  const [genModalOpen, setGenModalOpen] = useState(false)
  const [genScope, setGenScope] = useState<GenerationScope | null>(null)
  const [genModality, setGenModality] = useState<'flashcards' | 'quiz' | 'mindmap' | null>(null)
  const [genScopeTitle, setGenScopeTitle] = useState('')

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!assetId) return
    try {
      setLoading(true)
      setError(null)
      const [assetData, kpiData] = await Promise.all([
        getAssetDetail(assetId),
        getAssetKPIs(assetId),
      ])
      setAsset(assetData)
      setKpis(kpiData)

      // Fetch breadcrumb names
      const resolvedTopicId = fromTopicId || assetData.topicId
      if (resolvedTopicId) {
        getTopicDetail(resolvedTopicId)
          .then((d) => setTopicName(d.topic.name))
          .catch(() => setTopicName(null))
      }
      if (fromSetId) {
        getStudySetDetail(fromSetId)
          .then((d) => setStudySetName(d.studySet.name))
          .catch(() => setStudySetName(null))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load asset')
    } finally {
      setLoading(false)
    }
  }, [assetId, fromTopicId, fromSetId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Processing poller
  const isProcessing =
    asset?.processingStatus === 'pending' || asset?.processingStatus === 'processing'

  const { assets: pollerStatuses } = useProcessingPoller({
    assetIds: assetId && isProcessing ? [assetId] : [],
    enabled: isProcessing,
  })

  // React to poller status changes
  useEffect(() => {
    if (!assetId) return
    const polledStatus = pollerStatuses.get(assetId)
    if (polledStatus === 'ready' || polledStatus === 'failed') {
      fetchData()
    }
  }, [pollerStatuses, assetId, fetchData])

  // Handlers
  async function handleRetry() {
    if (!assetId) return
    try {
      const updated = await retryAssetProcessing(assetId)
      setAsset(updated)
      toast.success('Processing restarted')
    } catch {
      toast.error('Failed to restart processing')
    }
  }

  function handleCitationClick(citation: Citation) {
    setActiveCitation(citation)
    setShowOriginal(true)
  }

  function openGenerationModal(
    scope: GenerationScope,
    modality: 'flashcards' | 'quiz' | 'mindmap',
    scopeTitle?: string,
  ) {
    setGenScope(scope)
    setGenModality(modality)
    setGenScopeTitle(scopeTitle ?? asset?.title ?? 'Asset')
    setGenModalOpen(true)
  }

  async function handleRename(newTitle: string) {
    if (!assetId) return
    try {
      const updated = await renameAsset(assetId, newTitle)
      setAsset(updated)
      toast.success('Material renamed')
    } catch {
      toast.error('Failed to rename material')
    }
  }

  async function handleDelete() {
    if (!assetId) return
    try {
      await removeAsset(assetId)
      toast.success('Material deleted')
      navigate(-1)
    } catch {
      toast.error('Failed to delete material')
    }
  }

  function handleGenerationSuccess(result: { modalityType: string; id: string }) {
    setGenModalOpen(false)
    fetchData()
    if (result.modalityType === 'mindmap') navigate(`/mindmap/${result.id}`)
  }

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Skeleton variant="text" width={120} height={16} />
        <div className="mt-4">
          <Skeleton variant="text" width="70%" height={32} />
        </div>
        <div className="mt-6">
          <SkeletonKTCards />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !asset) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <InlineError
          message={error ?? 'Asset not found'}
          onRetry={fetchData}
        />
      </div>
    )
  }

  const isReady = asset.processingStatus === 'ready'
  const isFailed = asset.processingStatus === 'failed'
  const hasStudied = kpis?.lastStudiedAt != null
  const topicId = fromTopicId || asset.topicId

  const assetScope: GenerationScope = { level: 'asset', assetId: asset.id }

  // KT list content
  const ktContent = (
    <>
      {/* Processing states */}
      {isProcessing && (
        <div className="mb-6">
          <p className="mb-4 text-sm text-text-secondary">
            Generating your Knowledge Touchpoints...
          </p>
          <SkeletonKTCards />
        </div>
      )}

      {isFailed && (
        <div className="mb-6">
          <InlineError
            message="Processing failed. You can retry to generate Knowledge Touchpoints."
            onRetry={handleRetry}
          />
        </div>
      )}

      {isReady && (
        <>
          {/* KT cards */}
          <h2 className="text-lg font-semibold text-text-primary mb-2">Knowledge Touchpoints</h2>
          <div className="flex flex-col gap-4">
            {asset.knowledgeTouchpoints.map((kt) => (
              <KnowledgeTouchpointCard
                key={kt.id}
                kt={kt}
                citations={asset.citations}
                onCitationClick={handleCitationClick}
                onGenerateFlashcards={(ktId) => {
                  const params = new URLSearchParams({
                    scope: 'kt',
                    ktId,
                    assetId: asset.id,
                    returnTo: `/assets/${asset.id}`,
                  })
                  navigate(`/study/flashcards?${params.toString()}`)
                }}
                onGenerateQuiz={(ktId) => {
                  const params = new URLSearchParams({
                    scope: 'kt',
                    ktId,
                    assetId: asset.id,
                    returnTo: `/assets/${asset.id}`,
                  })
                  navigate(`/study/quiz?${params.toString()}`)
                }}
                onGenerateMindMap={(ktId) =>
                  openGenerationModal(
                    { level: 'kt', ktId, assetId: asset.id },
                    'mindmap',
                    kt.heading,
                  )
                }
              />
            ))}
          </div>

          {asset.knowledgeTouchpoints.length === 0 && (
            <p className="text-sm text-text-secondary">
              No Knowledge Touchpoints available for this asset.
            </p>
          )}
        </>
      )}
    </>
  )

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl">
      {/* Header card */}
      <div className="rounded-lg border border-border bg-background p-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-text-secondary">
            {topicId && (
              <>
                <li>
                  <Link
                    to={`/topics/${topicId}`}
                    className="hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {topicName ?? 'Folio'}
                  </Link>
                </li>
                <li aria-hidden="true" className="text-text-disabled">/</li>
              </>
            )}
            {fromSetId && topicId && (
              <>
                <li>
                  <Link
                    to={`/topics/${topicId}/study-sets/${fromSetId}`}
                    className="hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {studySetName ?? 'Study Set'}
                  </Link>
                </li>
                <li aria-hidden="true" className="text-text-disabled">/</li>
              </>
            )}
            <li aria-current="page" className="font-medium text-text-primary truncate max-w-[200px]">
              {asset.title}
            </li>
          </ol>
        </nav>

        {/* Title row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-text-secondary">
            <TypeIcon type={asset.type} />
          </span>
          <AssetBadge assetType={asset.type} />
          {!isReady && <StatusBadge status={asset.processingStatus} />}
        </div>

        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">{asset.title}</h1>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-sm text-text-secondary">{asset.sourceLabel}</p>
              {isReady && (
                <button
                  type="button"
                  onClick={() => setShowOriginal((v) => !v)}
                  aria-pressed={showOriginal}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  {showOriginal ? 'Hide original' : 'View original'}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {assetId && <NotesButton level="material" id={assetId} scopeName={asset.title} />}
            <DropdownMenu
              trigger={
                <button
                  type="button"
                  className="rounded-full p-1.5 text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label="Material actions"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                  </svg>
                </button>
              }
              items={[
                { label: 'Rename', onClick: () => setRenameOpen(true) },
                { label: 'Delete', onClick: () => setDeleteConfirmOpen(true), danger: true },
              ]}
            />
          </div>
        </div>

        {/* KPIs (compact, right-aligned) */}
        {isReady && hasStudied && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-xs text-text-secondary">
            {kpis?.flashcardAccuracy != null && (
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M2 4.5A2.5 2.5 0 014.5 2h5A2.5 2.5 0 0112 4.5v11a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 012 15.5v-11z" />
                  <path d="M8 4.5A2.5 2.5 0 0110.5 2h5A2.5 2.5 0 0118 4.5v11a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 018 15.5v-11z" opacity="0.5" />
                </svg>
                Flashcard accuracy <span className="font-semibold text-text-primary">{kpis.flashcardAccuracy}%</span>
              </span>
            )}
            {kpis?.quizBestScore != null && (
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 1l2.928 6.472L20 8.417l-5.236 4.614L16.18 20 10 16.472 3.82 20l1.416-6.969L0 8.417l7.072-.945L10 1z" clipRule="evenodd" />
                </svg>
                Quiz best <span className="font-semibold text-text-primary">{kpis.quizBestScore}%</span>
              </span>
            )}
            {((kpis?.flashcardSessions ?? 0) + (kpis?.quizAttempts ?? 0)) > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Sessions <span className="font-semibold text-text-primary">{(kpis?.flashcardSessions ?? 0) + (kpis?.quizAttempts ?? 0)}</span>
              </span>
            )}
            {kpis?.lastStudiedAt && (
              <span>Last studied <span className="font-semibold text-text-primary">{new Date(kpis.lastStudiedAt).toLocaleDateString()}</span></span>
            )}
          </div>
        )}

        {/* Study this asset */}
        {isReady && (
          <div className="mt-5 rounded-xl border border-border bg-primary-tint p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-forest">
              Study this asset
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button
                variant="secondary"
                leftIcon={<Layers className="h-4 w-4" />}
                onClick={() => {
                  const params = new URLSearchParams({
                    scope: 'asset',
                    assetId: asset.id,
                    returnTo: `/assets/${asset.id}`,
                  })
                  navigate(`/study/flashcards?${params.toString()}`)
                }}
              >
                Flashcards
              </Button>
              <Button
                variant="secondary"
                leftIcon={<ClipboardCheck className="h-4 w-4" />}
                onClick={() => {
                  const params = new URLSearchParams({
                    scope: 'asset',
                    assetId: asset.id,
                    returnTo: `/assets/${asset.id}`,
                  })
                  navigate(`/study/quiz?${params.toString()}`)
                }}
              >
                Quiz
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Network className="h-4 w-4" />}
                onClick={() => openGenerationModal(assetScope, 'mindmap')}
              >
                Mind Map
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Main content area */}
      <div className="mt-6">
        {ktContent}
      </div>

      {/* Bottom drawer for original viewer */}
      {isReady && showOriginal && (
        <ResizableDrawer onClose={() => setShowOriginal(false)}>
          <OriginalViewer asset={asset} activeCitation={activeCitation} />
        </ResizableDrawer>
      )}

      {/* Rename / Delete dialogs */}
      {asset && (
        <RenameDialog
          isOpen={renameOpen}
          onClose={() => setRenameOpen(false)}
          onRename={handleRename}
          currentName={asset.title}
          title="Rename material"
          label="Title"
        />
      )}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete material"
        message={`Are you sure you want to delete "${asset?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Generation modal */}
      {genModalOpen && genScope && genModality && (
        <GenerationModal
          isOpen={genModalOpen}
          onClose={() => setGenModalOpen(false)}
          onSuccess={handleGenerationSuccess}
          modalityType={genModality}
          scope={genScope}
          scopeTitle={genScopeTitle}
          knowledgeTouchpoints={asset.knowledgeTouchpoints}
        />
      )}
      </div>
      </div>

      {/* Folio AI */}
      {isReady && !chatOpen && <AiChatFab onClick={() => setChatOpen(true)} />}
      {isReady && (
        <AiChatPanel
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          assetTitle={asset.title}
          knowledgeTouchpoints={asset.knowledgeTouchpoints}
        />
      )}
    </div>
  )
}
