import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getStudySetDetail,
  listAssets,
  updateStudySet,
  listFlashcardSets,
  listQuizzes,
  listMindMaps,
} from '../services/mockApi'
import type {
  StudySet,
  LearningAsset,
  Citation,
  GenerationScope,
  FlashcardSet,
  Quiz,
  MindMap,
} from '../types/domain'
import { Layers, ClipboardCheck, Network } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { InlineError } from '../components/ui/InlineError'
import { KnowledgeTouchpointCard } from '../components/asset/KnowledgeTouchpointCard'
import { AssetCard } from '../components/asset/AssetCard'
import { Modal } from '../components/ui/Modal'
import { GenerationModal } from '../components/asset/GenerationModal'
import { AiChatFab } from '../components/chat/AiChatFab'
import { AiChatPanel } from '../components/chat/AiChatPanel'

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Edit Assets Modal                                                  */
/* ------------------------------------------------------------------ */

function EditAssetsModal({
  isOpen,
  onClose,
  topicId,
  currentAssetIds,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  topicId: string
  currentAssetIds: string[]
  onSave: (assetIds: string[]) => void
}) {
  const [allAssets, setAllAssets] = useState<LearningAsset[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set(currentAssetIds))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    setSelected(new Set(currentAssetIds))
    setLoading(true)
    listAssets(topicId).then((assets) => {
      setAllAssets(assets.filter((a) => !a.isSynthesis))
      setLoading(false)
    })
  }, [isOpen, topicId, currentAssetIds])

  function toggleAsset(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleSave() {
    onSave(Array.from(selected))
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit assets in study set" size="md">
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rect" width="100%" height={40} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {allAssets.length === 0 && (
            <p className="text-sm text-text-secondary">No assets available in this topic.</p>
          )}
          {allAssets.map((asset) => (
            <label
              key={asset.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface"
            >
              <input
                type="checkbox"
                checked={selected.has(asset.id)}
                onChange={() => toggleAsset(asset.id)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-text-primary">{asset.title}</span>
            </label>
          ))}
        </div>
      )}
      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          Save
        </Button>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function StudySetPage() {
  const { topicId, setId } = useParams<{ topicId: string; setId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  // Data state
  const [studySet, setStudySet] = useState<StudySet | null>(null)
  const [synthesisAsset, setSynthesisAsset] = useState<LearningAsset | null>(null)
  const [setAssets, setSetAssets] = useState<LearningAsset[]>([])
  const [ssFlashcardSets, setSsFlashcardSets] = useState<FlashcardSet[]>([])
  const [ssQuizzes, setSsQuizzes] = useState<Quiz[]>([])
  const [ssMindMaps, setSsMindMaps] = useState<MindMap[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [assetsExpanded, setAssetsExpanded] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Chat state (open by default)
  const [chatOpen, setChatOpen] = useState(true)

  // Generation modal state
  const [genModalOpen, setGenModalOpen] = useState(false)
  const [genScope, setGenScope] = useState<GenerationScope | null>(null)
  const [genModality, setGenModality] = useState<'flashcards' | 'quiz' | 'mindmap' | null>(null)
  const [genScopeTitle, setGenScopeTitle] = useState('')

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!setId) return
    try {
      setLoading(true)
      setError(null)
      const detail = await getStudySetDetail(setId)
      setStudySet(detail.studySet)
      setSynthesisAsset(detail.synthesisAsset)

      // Fetch modalities for this study set
      const scope = { level: 'studyset' as const, studySetId: setId, topicId: detail.studySet.topicId }
      const [fSets, qList, mList] = await Promise.all([
        listFlashcardSets(scope),
        listQuizzes(scope),
        listMindMaps(scope),
      ])
      setSsFlashcardSets(fSets)
      setSsQuizzes(qList)
      setSsMindMaps(mList)

      // Fetch full asset objects for the set
      if (detail.studySet.topicId) {
        const allAssets = await listAssets(detail.studySet.topicId)
        const filtered = allAssets.filter(
          (a) => detail.studySet.assetIds.includes(a.id) && !a.isSynthesis,
        )
        setSetAssets(filtered)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study set')
    } finally {
      setLoading(false)
    }
  }, [setId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handlers
  async function handleUpdateAssets(newAssetIds: string[]) {
    if (!setId) return
    try {
      await updateStudySet(setId, newAssetIds)
      toast.success('Study set updated')
      fetchData()
    } catch {
      toast.error('Failed to update study set')
    }
  }

  function openGenerationModal(
    scope: GenerationScope,
    modality: 'flashcards' | 'quiz' | 'mindmap',
    scopeTitle?: string,
  ) {
    setGenScope(scope)
    setGenModality(modality)
    setGenScopeTitle(scopeTitle ?? studySet?.name ?? 'Study Set')
    setGenModalOpen(true)
  }

  function handleGenerationSuccess(result: { modalityType: string; id: string }) {
    setGenModalOpen(false)
    fetchData()
    if (result.modalityType === 'flashcards') navigate(`/flashcards/${result.id}/session`)
    else if (result.modalityType === 'quiz') navigate(`/quiz/${result.id}/session`)
    else if (result.modalityType === 'mindmap') navigate(`/mindmap/${result.id}`)
  }

  function handleCitationClick(_citation: Citation) {
    // For study set, citations may reference source assets
    // In a full implementation, this could open the asset page
  }

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Skeleton variant="text" width={120} height={16} />
        <div className="mt-4">
          <Skeleton variant="text" width="50%" height={32} />
        </div>
        <div className="mt-6 flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rect" width="100%" height={100} />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error || !studySet) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <InlineError
          message={error ?? 'Study set not found'}
          onRetry={fetchData}
        />
      </div>
    )
  }

  const synthesisReady = synthesisAsset?.processingStatus === 'ready'
  const kts = synthesisAsset?.knowledgeTouchpoints ?? []
  const citations = synthesisAsset?.citations ?? []
  const someProcessing = setAssets.some(
    (a) => a.processingStatus === 'pending' || a.processingStatus === 'processing',
  )

  const studySetScope: GenerationScope = {
    level: 'studyset',
    studySetId: studySet.id,
    topicId: studySet.topicId,
  }

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl">
      {/* Header */}
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
                    Folio
                  </Link>
                </li>
                <li aria-hidden="true" className="text-text-disabled">/</li>
              </>
            )}
            <li aria-current="page" className="font-medium text-text-primary truncate max-w-[200px]">
              {studySet.name}
            </li>
          </ol>
        </nav>

        <div className="flex items-center gap-2 text-text-secondary">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M3.196 12.87l6.4 3.56a.75.75 0 00.708 0l6.4-3.56a.75.75 0 00-.354-1.42H3.55a.75.75 0 00-.354 1.42z" />
            <path d="M3.196 8.87l6.4 3.56a.75.75 0 00.708 0l6.4-3.56a.75.75 0 000-1.32l-6.4-3.56a.75.75 0 00-.708 0l-6.4 3.56a.75.75 0 000 1.32z" />
          </svg>
          <p className="text-xs font-medium uppercase tracking-wide">Study Set</p>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">{studySet.name}</h1>
        {setAssets.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {setAssets.map((a) => (
              <li key={a.id} className="text-sm text-text-secondary">
                {a.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Learning Materials panel */}
      <div className="mt-6 rounded-lg border border-border bg-background">
        <button
          type="button"
          onClick={() => setAssetsExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-expanded={assetsExpanded}
        >
          <span className="text-sm font-medium text-text-primary">
            {setAssets.length} Learning Material{setAssets.length !== 1 ? 's' : ''}
          </span>
          <ChevronIcon expanded={assetsExpanded} />
        </button>

        {assetsExpanded && (
          <div className="border-t border-border px-5 pb-5 pt-3">
            <div className="flex flex-col gap-3">
              {setAssets.map((asset) => (
                <div
                  key={asset.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/assets/${asset.id}?fromSet=${studySet?.id}&topicId=${topicId}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/assets/${asset.id}?fromSet=${studySet?.id}&topicId=${topicId}`)
                    }
                  }}
                  className="cursor-pointer"
                >
                  <AssetCard asset={asset} />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditModalOpen(true)}
              >
                Edit assets
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Knowledge Touchpoints section */}
      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Knowledge Touchpoints
        </h2>

        {someProcessing && (
          <div
            className="mb-4 rounded-lg border border-status-pending/30 bg-status-pending/10 px-4 py-3"
            role="status"
          >
            <p className="text-sm text-text-secondary">
              Some assets are still processing — KTs will update when ready.
            </p>
          </div>
        )}

        {synthesisReady && kts.length > 0 ? (
          <>
            {/* Study modality generation / study panel */}
            <div className="mb-8 rounded-xl border border-border bg-primary-tint p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-forest">
                Study this set
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {ssFlashcardSets.length > 0 ? (
                  <Button
                    variant="success"
                    leftIcon={<Layers className="h-4 w-4 text-status-ready" />}
                    onClick={() => navigate(`/flashcards/${ssFlashcardSets[0].id}/session`)}
                  >
                    Study flashcards
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    leftIcon={<Layers className="h-4 w-4" />}
                    onClick={() => openGenerationModal(studySetScope, 'flashcards')}
                  >
                    Generate flashcards
                  </Button>
                )}
                {ssQuizzes.length > 0 ? (
                  <Button
                    variant="success"
                    leftIcon={<ClipboardCheck className="h-4 w-4 text-status-ready" />}
                    onClick={() => navigate(`/quiz/${ssQuizzes[0].id}/session`)}
                  >
                    Take quiz
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    leftIcon={<ClipboardCheck className="h-4 w-4" />}
                    onClick={() => openGenerationModal(studySetScope, 'quiz')}
                  >
                    Generate quiz
                  </Button>
                )}
                {ssMindMaps.length > 0 ? (
                  <Button
                    variant="success"
                    leftIcon={<Network className="h-4 w-4 text-status-ready" />}
                    onClick={() => navigate(`/mindmap/${ssMindMaps[0].id}`)}
                  >
                    View mind map
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    leftIcon={<Network className="h-4 w-4" />}
                    onClick={() => openGenerationModal(studySetScope, 'mindmap')}
                  >
                    Generate mind map
                  </Button>
                )}
              </div>
            </div>

            {/* KT cards */}
            <h2 className="text-lg font-semibold text-text-primary mb-2">Knowledge Touchpoints</h2>
            <div className="flex flex-col gap-4">
              {kts.map((kt) => (
                <KnowledgeTouchpointCard
                  key={kt.id}
                  kt={kt}
                  citations={citations}
                  onCitationClick={handleCitationClick}
                  onGenerateFlashcards={(ktId) =>
                    openGenerationModal(
                      {
                        level: 'kt',
                        ktId,
                        assetId: synthesisAsset!.id,
                      },
                      'flashcards',
                      kt.heading,
                    )
                  }
                  onGenerateQuiz={(ktId) =>
                    openGenerationModal(
                      {
                        level: 'kt',
                        ktId,
                        assetId: synthesisAsset!.id,
                      },
                      'quiz',
                      kt.heading,
                    )
                  }
                  onGenerateMindMap={(ktId) =>
                    openGenerationModal(
                      {
                        level: 'kt',
                        ktId,
                        assetId: synthesisAsset!.id,
                      },
                      'mindmap',
                      kt.heading,
                    )
                  }
                  onStudyFlashcards={(setId) =>
                    navigate(`/flashcards/${setId}/session`)
                  }
                  onTakeQuiz={(quizId) => navigate(`/quiz/${quizId}/session`)}
                  onViewMindMap={(mindmapId) => navigate(`/mindmap/${mindmapId}`)}
                />
              ))}
            </div>
          </>
        ) : (
          !someProcessing && (
            <p className="text-sm text-text-secondary">
              No Knowledge Touchpoints available yet. Add assets to this study set to get started.
            </p>
          )
        )}
      </div>

      {/* Edit Assets Modal */}
      <EditAssetsModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        topicId={studySet.topicId}
        currentAssetIds={studySet.assetIds}
        onSave={handleUpdateAssets}
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
          knowledgeTouchpoints={synthesisAsset?.knowledgeTouchpoints}
          assets={setAssets}
        />
      )}

      </div>
      </div>

      {/* Folio AI */}
      {!chatOpen && <AiChatFab onClick={() => setChatOpen(true)} />}
      <AiChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        assetTitle={studySet.name}
        knowledgeTouchpoints={synthesisAsset?.knowledgeTouchpoints ?? []}
      />
    </div>
  )
}
