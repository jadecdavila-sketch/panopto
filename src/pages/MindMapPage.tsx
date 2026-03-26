import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import type { MindMap, MindMapNode, KnowledgeTouchpoint } from '../types/domain'
import { getMindMap, getAssetDetail } from '../services/mockApi'
import { getKTPerformance, computeNeedsReview } from '../utils/ktPerformance'
import { Button } from '../components/ui/Button'
import { MindMapViewer } from '../components/study/MindMapViewer'
import { AiChatFab } from '../components/chat/AiChatFab'
import { AiChatPanel } from '../components/chat/AiChatPanel'
import { useToast } from '../context/ToastContext'

export default function MindMapPage() {
  const { mindmapId } = useParams<{ mindmapId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [mindMap, setMindMap] = useState<MindMap | null>(null)
  usePageTitle(mindMap ? `Mind Map — ${mindMap.title}` : 'Mind Map')
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)

  // Side panel state
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null)
  const [ktDetail, setKtDetail] = useState<KnowledgeTouchpoint | null>(null)
  const [loadingKt, setLoadingKt] = useState(false)

  /* ---------------------------------------------------------------- */
  /*  Load mind map                                                    */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!mindmapId) return

    async function load() {
      try {
        setLoading(true)
        const mm = await getMindMap(mindmapId!)
        setMindMap(mm)
      } catch {
        toast.error('Failed to load mind map')
        navigate(-1)
      } finally {
        setLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mindmapId])

  /* ---------------------------------------------------------------- */
  /*  Node click -> load KT detail                                     */
  /* ---------------------------------------------------------------- */

  const handleNodeClick = useCallback(
    async (node: MindMapNode) => {
      if (!node.ktId || !mindMap) return

      setSelectedNode(node)
      setKtDetail(null)
      setLoadingKt(true)

      try {
        // Find the asset that contains this KT by looking at the scope
        let assetId: string | null = null
        if (mindMap.scope.level === 'asset') {
          assetId = mindMap.scope.assetId
        } else if (mindMap.scope.level === 'kt') {
          assetId = mindMap.scope.assetId
        }

        if (assetId) {
          try {
            const asset = await getAssetDetail(assetId)
            const kt = asset.knowledgeTouchpoints.find(
              (k) => k.id === node.ktId,
            )
            if (kt) {
              setKtDetail(kt)
              setLoadingKt(false)
              return
            }
          } catch {
            // Asset may not be found — fall through to broad search
          }
          // Fallback: search via getKTsForAssets
          const { getKTsForAssets } = await import('../services/mockApi')
          const kts = getKTsForAssets([assetId])
          const kt = kts.find((k) => k.id === node.ktId)
          if (kt) {
            setKtDetail(kt)
          }
        } else {
          // Topic or studyset scope — search all assets for the KT
          const { getKTsForTopic, getKTsForStudySet } = await import('../services/mockApi')
          let kts: import('../types/domain').KnowledgeTouchpoint[] = []
          if (mindMap.scope.level === 'topic') {
            kts = getKTsForTopic(mindMap.scope.topicId)
          } else if (mindMap.scope.level === 'studyset') {
            kts = getKTsForStudySet(mindMap.scope.studySetId)
          }
          const kt = kts.find((k) => k.id === node.ktId)
          if (kt) {
            setKtDetail(kt)
          }
        }
      } catch {
        toast.error('Failed to load details')
      } finally {
        setLoadingKt(false)
      }
    },
    [mindMap, toast],
  )

  /* ---------------------------------------------------------------- */
  /*  Export mock                                                       */
  /* ---------------------------------------------------------------- */

  function handleExport() {
    toast.success('Mind map exported successfully')
  }

  /* ---------------------------------------------------------------- */
  /*  Close panel                                                      */
  /* ---------------------------------------------------------------- */

  function closePanel() {
    setSelectedNode(null)
    setKtDetail(null)
  }

  /* ---------------------------------------------------------------- */
  /*  Keyboard: Escape to close panel                                  */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedNode) {
        closePanel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode])

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */

  // Check if any nodes need review
  const hasReviewNodes = useMemo(() => {
    if (!mindMap) return false
    return mindMap.nodes.some((node) => {
      if (!node.ktId) return false
      const record = getKTPerformance(node.ktId)
      return computeNeedsReview(record)
    })
  }, [mindMap])

  if (loading || !mindMap) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        {/* Skeleton */}
        <div className="flex flex-col items-center gap-4">
          <div className="h-6 w-48 animate-pulse rounded bg-surface" />
          <div className="h-64 w-64 animate-pulse rounded-full bg-surface" />
          <div className="h-4 w-32 animate-pulse rounded bg-surface" />
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-screen">
    <main className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Close mind map"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <h1 className="text-sm font-semibold text-text-primary truncate max-w-[40%]">
          {mindMap.title}
        </h1>

        <div className="flex items-center gap-3">
          {hasReviewNodes && (
            <span className="flex items-center gap-1.5 rounded-full border border-[#FDE68A] bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#92400E]">
              <span>⚠</span> Needs more practice
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={handleExport}>
            Export as PNG
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Mind map viewer */}
        <div className="flex-1">
          <MindMapViewer mindMap={mindMap} onNodeClick={handleNodeClick} />
        </div>

        {/* Side panel - desktop */}
        {selectedNode && (
          <>
            {/* Desktop: slide-in panel */}
            <aside
              className="hidden md:flex w-80 shrink-0 flex-col border-l border-border bg-background"
              role="complementary"
              aria-label="Knowledge touchpoint details"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-text-primary truncate">
                  {selectedNode.label}
                </h2>
                <button
                  onClick={closePanel}
                  aria-label="Close panel"
                  className="flex h-6 w-6 items-center justify-center rounded text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 4L4 12M4 4l8 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {loadingKt && (
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-full animate-pulse rounded bg-surface" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-surface" />
                  </div>
                )}
                {ktDetail && (
                  <>
                    <h3 className="mb-3 text-sm font-semibold text-text-primary">
                      {ktDetail.heading}
                    </h3>
                    <p className="text-sm leading-relaxed text-text-secondary">
                      {ktDetail.body}
                    </p>
                  </>
                )}
                {!loadingKt && !ktDetail && (
                  <p className="text-sm text-text-secondary">
                    No additional details available.
                  </p>
                )}
              </div>
            </aside>

            {/* Mobile: full-screen overlay */}
            <div
              className="fixed inset-0 z-50 flex flex-col bg-background md:hidden"
              role="dialog"
              aria-label="Knowledge touchpoint details"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-text-primary truncate">
                  {selectedNode.label}
                </h2>
                <button
                  onClick={closePanel}
                  aria-label="Close panel"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M15 5L5 15M5 5l10 10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {loadingKt && (
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-full animate-pulse rounded bg-surface" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-surface" />
                  </div>
                )}
                {ktDetail && (
                  <>
                    <h3 className="mb-3 text-sm font-semibold text-text-primary">
                      {ktDetail.heading}
                    </h3>
                    <p className="text-sm leading-relaxed text-text-secondary">
                      {ktDetail.body}
                    </p>
                  </>
                )}
                {!loadingKt && !ktDetail && (
                  <p className="text-sm text-text-secondary">
                    No additional details available.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

    </main>
    {!chatOpen && <AiChatFab onClick={() => setChatOpen(true)} />}
    <AiChatPanel
      isOpen={chatOpen}
      onClose={() => setChatOpen(false)}
      assetTitle={mindMap.title}
      knowledgeTouchpoints={[]}
    />
    </div>
  )
}
