import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import type { Flashcard, KnowledgeTouchpoint } from '../types/domain'
import {
  generateFlashcardFromKT,
  getKTsForTopic,
  getKTsForStudySet,
  getKTsForAssets,
} from '../services/mockApi'
import { selectAdaptiveKTs } from '../utils/adaptiveSelection'
import {
  getKTPerformance,
  updateKTPerformance,
  batchUpdateConfidence,
} from '../utils/ktPerformance'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { CircularGauge } from '../components/ui/CircularGauge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FlashcardCard } from '../components/study/FlashcardCard'
import { ConfidenceCheckIn } from '../components/study/ConfidenceCheckIn'
import { AiChatFab } from '../components/chat/AiChatFab'
import { AiChatPanel } from '../components/chat/AiChatPanel'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SessionPhase = 'studying' | 'results'

interface AdaptiveCard extends Flashcard {
  ktId: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const BATCH_SIZE = 10

export default function FlashcardSessionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  usePageTitle('Flashcards')

  // Parse scope from URL search params
  const scopeLevel = searchParams.get('scope') as string
  const topicId = searchParams.get('topicId')
  const studySetId = searchParams.get('studySetId')
  const assetId = searchParams.get('assetId')
  const ktId = searchParams.get('ktId')
  const assetIdsParam = searchParams.get('assetIds') // comma-separated, from content picker
  const returnTo = searchParams.get('returnTo') ?? '/'

  // --- Session state ---
  const [phase, setPhase] = useState<SessionPhase>('studying')
  const [studyCards, setStudyCards] = useState<AdaptiveCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [batchResults, setBatchResults] = useState<{ ktId: string; correct: boolean }[]>([])
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Keep-going loop state ---
  const [allSeenKtIds, setAllSeenKtIds] = useState<string[]>([])
  const [totalStudiedThisSitting, setTotalStudiedThisSitting] = useState(0)
  const [roundNumber, setRoundNumber] = useState(1)

  // --- Results state ---
  const [showCelebration, setShowCelebration] = useState(false)
  const [confidenceRating, setConfidenceRating] = useState<number | null>(null)

  // --- Chat state (closed by default) ---
  const [chatOpen, setChatOpen] = useState(false)

  // KT pool reference
  const ktPoolRef = useRef<KnowledgeTouchpoint[]>([])

  // Ref to prevent double-grading
  const gradingRef = useRef(false)

  // --- Resolve KT pool and start first batch ---
  useEffect(() => {
    try {
      let kts: KnowledgeTouchpoint[] = []

      if (assetIdsParam) {
        // Content picker: scoped to selected assets
        kts = getKTsForAssets(assetIdsParam.split(','))
      } else if (scopeLevel === 'topic' && topicId) {
        kts = getKTsForTopic(topicId)
      } else if (scopeLevel === 'studyset' && studySetId) {
        kts = getKTsForStudySet(studySetId)
      } else if (scopeLevel === 'asset' && assetId) {
        kts = getKTsForAssets([assetId])
      } else if (scopeLevel === 'kt' && ktId && assetId) {
        const allKts = getKTsForAssets([assetId])
        kts = allKts.filter((k) => k.id === ktId)
      }

      if (kts.length === 0) {
        setError('No knowledge touchpoints available for this scope.')
        setLoading(false)
        return
      }

      ktPoolRef.current = kts
      const pool = kts.map((k) => k.id)
      const selected = selectAdaptiveKTs(pool, 'flashcard', BATCH_SIZE)
      const cards = generateCardsForKTs(kts, selected)

      setStudyCards(cards)
      setAllSeenKtIds(selected)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session')
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Celebration timer ---
  useEffect(() => {
    if (phase !== 'results') return
    setShowCelebration(true)
    const timer = setTimeout(() => setShowCelebration(false), 1000)
    return () => clearTimeout(timer)
  }, [phase])

  // --- Generate cards from selected KT IDs ---
  function generateCardsForKTs(
    kts: KnowledgeTouchpoint[],
    selectedIds: string[],
  ): AdaptiveCard[] {
    const ktMap = new Map(kts.map((k) => [k.id, k]))
    return selectedIds.map((id) => {
      const kt = ktMap.get(id)!
      const record = getKTPerformance(id, kt.assetId)
      const card = generateFlashcardFromKT(kt, record.flashcardAttempts)
      return { ...card, ktId: id }
    })
  }

  // --- Grade a card ---
  const handleGrade = useCallback(
    (correct: boolean) => {
      if (!isFlipped || gradingRef.current) return
      gradingRef.current = true

      const card = studyCards[currentIndex]
      const kt = ktPoolRef.current.find((k) => k.id === card.ktId)

      // Update KT performance immediately
      updateKTPerformance(card.ktId, {
        modality: 'flashcard',
        correct,
        assetId: kt?.assetId,
      })

      setBatchResults((prev) => [...prev, { ktId: card.ktId, correct }])

      setTimeout(() => {
        const nextIdx = currentIndex + 1
        if (nextIdx >= studyCards.length) {
          setPhase('results')
        } else {
          setCurrentIndex(nextIdx)
          setIsFlipped(false)
        }
        gradingRef.current = false
      }, 300)
    },
    [isFlipped, currentIndex, studyCards],
  )

  // --- Keyboard shortcuts ---
  useEffect(() => {
    if (phase !== 'studying') return

    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault()
          if (!isFlipped) setIsFlipped(true)
          break
        case 'k':
        case 'K':
        case 'ArrowRight':
          e.preventDefault()
          handleGrade(true)
          break
        case 'j':
        case 'J':
        case 'ArrowLeft':
          e.preventDefault()
          handleGrade(false)
          break
        case 'Escape':
          e.preventDefault()
          setShowEndConfirm(true)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, isFlipped, handleGrade])

  // --- Keep going ---
  function handleKeepGoing() {
    const kts = ktPoolRef.current
    const pool = kts.map((k) => k.id)
    const selected = selectAdaptiveKTs(pool, 'flashcard', BATCH_SIZE, allSeenKtIds)
    const cards = generateCardsForKTs(kts, selected)

    setTotalStudiedThisSitting((prev) => prev + batchResults.length)
    setAllSeenKtIds((prev) => [...prev, ...selected])
    setStudyCards(cards)
    setCurrentIndex(0)
    setIsFlipped(false)
    setBatchResults([])
    setConfidenceRating(null)
    setRoundNumber((r) => r + 1)
    setPhase('studying')
  }

  // --- Done ---
  function handleDone() {
    navigate(returnTo)
  }

  // --- End early ---
  function endSession() {
    if (batchResults.length > 0) {
      setPhase('results')
    } else {
      navigate(returnTo)
    }
  }

  // --- Confidence ---
  function handleConfidenceRate(rating: number) {
    setConfidenceRating(rating)
    const ktIds = batchResults.map((r) => r.ktId)
    batchUpdateConfidence(ktIds, rating)
  }

  // --- Derived values ---
  const correctCount = batchResults.filter((r) => r.correct).length
  const incorrectCount = batchResults.filter((r) => !r.correct).length
  const accuracy = batchResults.length > 0 ? Math.round((correctCount / batchResults.length) * 100) : 0

  const missedKtIds = batchResults
    .filter((r) => !r.correct)
    .map((r) => r.ktId)
  const missedKTs = ktPoolRef.current.filter((k) => missedKtIds.includes(k.id))

  // --- Loading ---
  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-primary"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Loading flashcards"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm text-text-secondary">Preparing flashcards...</p>
        </div>
      </main>
    )
  }

  // --- Error ---
  if (error) {
    return (
      <main className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-status-failed">{error}</p>
          <Button variant="secondary" onClick={() => navigate(returnTo)} aria-label="Go back">
            Go back
          </Button>
        </div>
      </main>
    )
  }

  // --- Study session ---
  if (phase === 'studying') {
    const currentCard = studyCards[currentIndex]
    const progress = (currentIndex / studyCards.length) * 100

    return (
      <div className="flex h-screen">
      <main className="flex flex-1 flex-col overflow-y-auto bg-background">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <button
            onClick={() => setShowEndConfirm(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Close session"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-text-primary">
              Card {currentIndex + 1} of {studyCards.length}
            </span>
            {roundNumber > 1 && (
              <span className="text-xs text-text-secondary">
                {totalStudiedThisSitting + currentIndex + 1} concepts studied this session
              </span>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowEndConfirm(true)}
            aria-label="End session"
          >
            End Session
          </Button>
        </header>

        <div className="px-4 py-2">
          <ProgressBar value={progress} />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <FlashcardCard
            front={currentCard.front}
            back={currentCard.back}
            isFlipped={isFlipped}
            onFlip={() => {
              if (!isFlipped) setIsFlipped(true)
            }}
          />

          <div
            className={[
              'flex gap-4 transition-opacity duration-200',
              isFlipped ? 'opacity-100' : 'pointer-events-none opacity-0',
            ].join(' ')}
            aria-hidden={!isFlipped}
          >
            <Button
              variant="primary"
              onClick={() => handleGrade(true)}
              aria-label="Mark as correct"
              className="bg-status-ready hover:opacity-90"
            >
              Got it
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleGrade(false)}
              aria-label="Mark as incorrect"
              className="border-status-failed text-status-failed hover:bg-status-failed/10"
            >
              Missed it
            </Button>
          </div>

          {!isFlipped && (
            <p className="text-xs text-text-secondary">
              Press <kbd className="rounded border border-border px-1.5 py-0.5 text-xs font-mono">Space</kbd> to flip
            </p>
          )}
        </div>

        <ConfirmDialog
          isOpen={showEndConfirm}
          onClose={() => setShowEndConfirm(false)}
          onConfirm={endSession}
          title="End session?"
          message="Progress will be saved."
          confirmLabel="End Session"
          cancelLabel="Continue"
        />

      </main>
      {!chatOpen && <AiChatFab onClick={() => setChatOpen(true)} />}
      <AiChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        assetTitle="Flashcards"
        knowledgeTouchpoints={ktPoolRef.current}
      />
      </div>
    )
  }

  // --- Results screen ---
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={handleDone}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="Close"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-text-primary">Session Complete</span>
        <div className="w-8" />
      </header>

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="animate-bounce">
            <svg className="h-24 w-24 text-status-ready" viewBox="0 0 24 24" fill="none" aria-label="Session complete">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-8">
        {/* Accuracy ring + stats row */}
        <div className="flex w-full items-center gap-7 rounded-xl border border-border p-6">
          <CircularGauge value={accuracy} size={100} label="Accuracy" />
          <div className="flex flex-1 flex-col divide-y divide-border">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-text-secondary">Got it</span>
              <span className="text-sm font-bold text-status-ready">{correctCount} cards</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-text-secondary">Missed</span>
              <span className="text-sm font-bold text-status-failed">{incorrectCount} cards</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-text-secondary">Confidence</span>
              {confidenceRating !== null && confidenceRating > 0 ? (
                <span className="text-sm font-bold text-text-primary">
                  {'★'.repeat(confidenceRating)}{'☆'.repeat(5 - confidenceRating)}
                </span>
              ) : (
                <span className="text-xs text-text-disabled">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Confidence check-in (inline, only if not yet rated) */}
        {confidenceRating === null && (
          <div className="mt-6 w-full">
            <ConfidenceCheckIn
              onRate={handleConfidenceRate}
              onSkip={() => setConfidenceRating(0)}
            />
          </div>
        )}

        {/* Missed KTs as chips */}
        {missedKTs.length > 0 && (
          <div className="mt-6 w-full">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-text-secondary">
              Needs more practice
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missedKTs.map((kt) => (
                <span
                  key={kt.id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-1 text-xs font-semibold text-[#92400E]"
                >
                  <span>⚠</span> {kt.heading}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Keep going / Done — always visible */}
        <div className="mt-8 flex w-full flex-col items-center gap-2">
          <button
            onClick={handleKeepGoing}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-text-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Keep going with 10 more cards"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1.5v11M7 1.5L4 4.5M7 1.5L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Keep going — 10 more
          </button>
          <button
            onClick={handleDone}
            className="flex w-full items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="I'm done for now"
          >
            I'm done for now
          </button>
          {totalStudiedThisSitting > 0 && (
            <p className="mt-3 text-center font-mono text-xs text-text-secondary">
              {totalStudiedThisSitting + batchResults.length} concepts studied this session
            </p>
          )}
        </div>
      </div>

    </main>
  )
}
