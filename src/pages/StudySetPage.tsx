import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import {
  getStudySetDetail,
  listAssets,
  updateStudySet,
  renameStudySet,
  deleteStudySet,
} from '../services/mockApi'
import type {
  StudySet,
  LearningAsset,
  Citation,
  GenerationScope,
} from '../types/domain'
import { Layers, ClipboardCheck, Network } from 'lucide-react'
import { NotesButton } from '../components/ui/NotesButton'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { InlineError } from '../components/ui/InlineError'
import { KnowledgeTouchpointCard } from '../components/asset/KnowledgeTouchpointCard'
import { StatusBadge } from '../components/ui/Badge'
import { DropdownMenu } from '../components/ui/DropdownMenu'
import { RenameDialog } from '../components/ui/RenameDialog'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { GenerationModal } from '../components/asset/GenerationModal'
import { ContentPickerModal } from '../components/study/ContentPickerModal'
import { AiChatFab } from '../components/chat/AiChatFab'
import { AiChatPanel } from '../components/chat/AiChatPanel'

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

const accentColors: Record<LearningAsset['type'], string> = {
  document: '#F59E0B',
  video: '#38BDF8',
  panopto: '#2AC271',
}

function CompactTypeIcon({ type }: { type: LearningAsset['type'] }) {
  const cls = 'h-4 w-4'
  switch (type) {
    case 'document':
      return (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
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
          <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5z" clipRule="evenodd" />
        </svg>
      )
  }
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
  const [selected, setSelected] = useState<Set<string>>(() => new Set(currentAssetIds))
  const [loading, setLoading] = useState(true)

  // Reset selection when the modal opens (via key) or asset list changes
  const currentIdsKey = currentAssetIds.join(',')
  useEffect(() => {
    if (!isOpen) return
    setSelected(new Set(currentAssetIds))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdsKey, isOpen])

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    listAssets(topicId).then((assets) => {
      setAllAssets(assets.filter((a) => !a.isSynthesis))
      setLoading(false)
    })
  }, [isOpen, topicId])

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
  usePageTitle(studySet?.name ?? 'Study Set')
  const [synthesisAsset, setSynthesisAsset] = useState<LearningAsset | null>(null)
  const [setAssets, setSetAssets] = useState<LearningAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Chat state (open by default)
  const [chatOpen, setChatOpen] = useState(true)

  // Generation modal state (mind map only)
  const [genModalOpen, setGenModalOpen] = useState(false)
  const [genScope, setGenScope] = useState<GenerationScope | null>(null)
  const [genModality, setGenModality] = useState<'flashcards' | 'quiz' | 'mindmap' | null>(null)
  const [genScopeTitle, setGenScopeTitle] = useState('')

  // Content picker state (flashcards/quiz)
  const [contentPicker, setContentPicker] = useState<{
    isOpen: boolean
    modality: 'flashcards' | 'quiz'
  }>({ isOpen: false, modality: 'flashcards' })

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!setId) return
    try {
      setLoading(true)
      setError(null)
      const detail = await getStudySetDetail(setId)
      setStudySet(detail.studySet)
      setSynthesisAsset(detail.synthesisAsset)

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

  async function handleRename(newName: string) {
    if (!setId) return
    try {
      const updated = await renameStudySet(setId, newName)
      setStudySet(updated)
      toast.success('Study set renamed')
    } catch {
      toast.error('Failed to rename study set')
    }
  }

  async function handleDelete() {
    if (!setId) return
    try {
      await deleteStudySet(setId)
      toast.success('Study set deleted')
      navigate(topicId ? `/topics/${topicId}` : '/')
    } catch {
      toast.error('Failed to delete study set')
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
    if (result.modalityType === 'mindmap') navigate(`/mindmap/${result.id}`)
  }

  function handleCitationClick(_: Citation) {
    // For study set, citations may reference source assets
    // In a full implementation, this could open the asset page
    void _
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
      <div className="rounded-xl border border-border bg-gradient-to-br from-background to-surface p-6">
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

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-text-secondary">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M3.196 12.87l6.4 3.56a.75.75 0 00.708 0l6.4-3.56a.75.75 0 00-.354-1.42H3.55a.75.75 0 00-.354 1.42z" />
                <path d="M3.196 8.87l6.4 3.56a.75.75 0 00.708 0l6.4-3.56a.75.75 0 000-1.32l-6.4-3.56a.75.75 0 00-.708 0l-6.4 3.56a.75.75 0 000 1.32z" />
              </svg>
              <p className="text-xs font-medium uppercase tracking-wide">Study Set</p>
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-text-primary">{studySet.name}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {setId && <NotesButton level="studyset" id={setId} scopeName={studySet.name} />}
            <DropdownMenu
              trigger={
                <button
                  type="button"
                  className="rounded-full p-1.5 text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label="Study set actions"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                  </svg>
                </button>
              }
              items={[
                { label: 'Rename', onClick: () => setRenameOpen(true) },
                { label: 'Edit materials', onClick: () => setEditModalOpen(true) },
                { label: 'Delete', onClick: () => setDeleteConfirmOpen(true), danger: true },
              ]}
            />
          </div>
        </div>

        {/* Included materials */}
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            {setAssets.length} Material{setAssets.length !== 1 ? 's' : ''} included
          </p>
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
          {setAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => navigate(`/assets/${asset.id}?fromSet=${studySet?.id}&topicId=${topicId}`)}
              className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                style={{ backgroundColor: `${accentColors[asset.type]}15`, color: accentColors[asset.type] }}
              >
                <CompactTypeIcon type={asset.type} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                {asset.title}
              </span>
              {asset.processingStatus !== 'ready' && (
                <StatusBadge status={asset.processingStatus} />
              )}
            </button>
          ))}
        </div>

        {/* Study this set */}
        {synthesisReady && kts.length > 0 && (
          <div className="mt-5 rounded-xl border border-border bg-primary-tint p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-forest">
              Study this set
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button
                variant="secondary"
                leftIcon={<Layers className="h-4 w-4" />}
                onClick={() => setContentPicker({ isOpen: true, modality: 'flashcards' })}
              >
                Flashcards
              </Button>
              <Button
                variant="secondary"
                leftIcon={<ClipboardCheck className="h-4 w-4" />}
                onClick={() => setContentPicker({ isOpen: true, modality: 'quiz' })}
              >
                Quiz
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Network className="h-4 w-4" />}
                onClick={() => openGenerationModal(studySetScope, 'mindmap')}
              >
                Mind Map
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Knowledge Touchpoints section */}
      <div className="mt-8">
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

            {/* KT cards */}
            <h2 className="text-lg font-semibold text-text-primary mb-2">Knowledge Touchpoints</h2>
            <div className="flex flex-col gap-4">
              {kts.map((kt) => (
                <KnowledgeTouchpointCard
                  key={kt.id}
                  kt={kt}
                  citations={citations}
                  onCitationClick={handleCitationClick}
                  onGenerateFlashcards={(ktId) => {
                    const params = new URLSearchParams({
                      scope: 'kt',
                      ktId,
                      assetId: synthesisAsset!.id,
                      returnTo: `/topics/${topicId}/study-sets/${setId}`,
                    })
                    navigate(`/study/flashcards?${params.toString()}`)
                  }}
                  onGenerateQuiz={(ktId) => {
                    const params = new URLSearchParams({
                      scope: 'kt',
                      ktId,
                      assetId: synthesisAsset!.id,
                      returnTo: `/topics/${topicId}/study-sets/${setId}`,
                    })
                    navigate(`/study/quiz?${params.toString()}`)
                  }}
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

      <RenameDialog
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        onRename={handleRename}
        currentName={studySet.name}
        title="Rename study set"
        label="Name"
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete study set"
        message={`Are you sure you want to delete "${studySet.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Generation modal (mind map only) */}
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

      {/* Content picker for adaptive flashcards/quiz */}
      <ContentPickerModal
        isOpen={contentPicker.isOpen}
        onClose={() => setContentPicker((prev) => ({ ...prev, isOpen: false }))}
        scopeName={studySet.name}
        modality={contentPicker.modality}
        assets={setAssets}
        onStart={(selectedAssetIds) => {
          setContentPicker((prev) => ({ ...prev, isOpen: false }))
          const route = contentPicker.modality === 'flashcards' ? '/study/flashcards' : '/study/quiz'
          const params = new URLSearchParams({
            scope: 'studyset',
            studySetId: studySet.id,
            assetIds: selectedAssetIds.join(','),
            returnTo: `/topics/${topicId}/study-sets/${setId}`,
          })
          navigate(`${route}?${params.toString()}`)
        }}
      />

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
