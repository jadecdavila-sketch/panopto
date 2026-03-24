import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import type { FlashcardSet, Flashcard, FlashcardSession } from '../types/domain'
import {
  getFlashcardSet,
  getFlashcardSessions,
  saveFlashcardSession,
  regenerateFlashcardSet,
} from '../services/mockApi'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { CircularGauge } from '../components/ui/CircularGauge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FlashcardCard } from '../components/study/FlashcardCard'
import { ConfidenceCheckIn } from '../components/study/ConfidenceCheckIn'
import { ReflectionPrompt } from '../components/study/ReflectionPrompt'
import { useToast } from '../context/ToastContext'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SessionPhase = 'pre' | 'studying' | 'results'
type SubsetOption = 'all' | 5 | 10 | 15 | 20

interface CardResult {
  cardId: string
  correct: boolean
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Fisher-Yates shuffle (returns new array) */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FlashcardSessionPage() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  // --- Data loading ---
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null)
  usePageTitle(flashcardSet ? `Flashcards — ${flashcardSet.title}` : 'Flashcards')
  const [pastSessions, setPastSessions] = useState<FlashcardSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Pre-session config ---
  const [subsetOption, setSubsetOption] = useState<SubsetOption>('all')
  const [shouldShuffle, setShouldShuffle] = useState(true)

  // --- Session state ---
  const [phase, setPhase] = useState<SessionPhase>('pre')
  const [studyCards, setStudyCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState<CardResult[]>([])
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // --- Results state ---
  const [showCelebration, setShowCelebration] = useState(true)
  const [confidenceRating, setConfidenceRating] = useState<number | null>(null)
  const [reflectionDone, setReflectionDone] = useState(false)
  const [missedExpanded, setMissedExpanded] = useState(false)
  const [savedSession, setSavedSession] = useState(false)

  // Ref to prevent double-grading
  const gradingRef = useRef(false)

  // --- Load data ---
  useEffect(() => {
    if (!setId) return
    let cancelled = false

    async function load() {
      try {
        const [set, sessions] = await Promise.all([
          getFlashcardSet(setId!),
          getFlashcardSessions(setId!),
        ])
        if (cancelled) return
        setFlashcardSet(set)
        setPastSessions(sessions)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load flashcard set')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [setId])

  // --- Celebration timer ---
  useEffect(() => {
    if (phase !== 'results') return
    const timer = setTimeout(() => setShowCelebration(false), 1000)
    return () => clearTimeout(timer)
  }, [phase])

  // --- Save session when results phase begins ---
  useEffect(() => {
    if (phase !== 'results' || savedSession || !flashcardSet || results.length === 0) return

    const correct = results.filter((r) => r.correct).length
    const accuracy = Math.round((correct / results.length) * 100)

    saveFlashcardSession({
      setId: flashcardSet.id,
      scope: flashcardSet.scope,
      completedAt: new Date().toISOString(),
      accuracy,
      cardResults: results,
    }).then(() => {
      setSavedSession(true)
    }).catch(() => {
      toast.error('Failed to save session results')
    })
  }, [phase, savedSession, flashcardSet, results, toast])

  // --- Keyboard shortcuts ---
  const handleGrade = useCallback(
    (correct: boolean) => {
      if (!isFlipped || gradingRef.current) return
      gradingRef.current = true

      const card = studyCards[currentIndex]
      setResults((prev) => [...prev, { cardId: card.id, correct }])

      setTimeout(() => {
        const nextIdx = currentIndex + 1
        if (nextIdx >= studyCards.length) {
          setPhase('results')
          setShowCelebration(true)
        } else {
          setCurrentIndex(nextIdx)
          setIsFlipped(false)
        }
        gradingRef.current = false
      }, 300)
    },
    [isFlipped, currentIndex, studyCards],
  )

  useEffect(() => {
    if (phase !== 'studying') return

    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

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

  // --- Actions ---
  function startSession() {
    if (!flashcardSet) return

    let cards = [...flashcardSet.cards]
    if (shouldShuffle) cards = shuffle(cards)
    if (subsetOption !== 'all') cards = cards.slice(0, subsetOption)

    setStudyCards(cards)
    setCurrentIndex(0)
    setIsFlipped(false)
    setResults([])
    setSavedSession(false)
    setConfidenceRating(null)
    setReflectionDone(false)
    setMissedExpanded(false)
    setPhase('studying')
  }

  function endSession() {
    if (results.length > 0) {
      setPhase('results')
      setShowCelebration(true)
    } else {
      setPhase('pre')
    }
  }

  async function handleRegenerate() {
    if (!setId) return
    setIsRegenerating(true)
    try {
      const newSet = await regenerateFlashcardSet(setId)
      setFlashcardSet(newSet)
      setPhase('pre')
      toast.success('Flashcard set regenerated')
    } catch {
      toast.error('Failed to regenerate flashcard set')
    } finally {
      setIsRegenerating(false)
    }
  }

  function handleConfidenceRate(rating: number) {
    setConfidenceRating(rating)
  }

  function handleReflectionSubmit(text: string) {
    setReflectionDone(true)
    // Update saved session with confidence + reflection
    if (flashcardSet && savedSession) {
      const correct = results.filter((r) => r.correct).length
      const accuracy = Math.round((correct / results.length) * 100)
      saveFlashcardSession({
        setId: flashcardSet.id,
        scope: flashcardSet.scope,
        completedAt: new Date().toISOString(),
        accuracy,
        cardResults: results,
        confidenceRating: confidenceRating ?? undefined,
        reflection: text,
      }).catch(() => {
        // Session already saved; this is a best-effort update
      })
    }
  }

  // --- Derived values ---
  const correctCount = results.filter((r) => r.correct).length
  const incorrectCount = results.filter((r) => !r.correct).length
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0
  const previousAccuracy = pastSessions.length > 0
    ? Math.round(pastSessions[pastSessions.length - 1].accuracy * 100)
    : null

  const missedCards = results
    .filter((r) => !r.correct)
    .map((r) => studyCards.find((c) => c.id === r.cardId))
    .filter(Boolean) as Flashcard[]

  // --- Loading ---
  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-primary"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Loading flashcard set"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <p className="text-sm text-text-secondary">Loading flashcards...</p>
        </div>
      </main>
    )
  }

  // --- Error ---
  if (error || !flashcardSet) {
    return (
      <main className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-status-failed">{error ?? 'Flashcard set not found'}</p>
          <Button variant="secondary" onClick={() => navigate(-1)} aria-label="Go back">
            Go back
          </Button>
        </div>
      </main>
    )
  }

  // --- Pre-session screen ---
  if (phase === 'pre') {
    return (
      <main className="flex min-h-screen flex-col bg-background">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-text-primary">{flashcardSet.title}</span>
          <div className="w-8" />
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <p className="text-sm text-text-secondary">
              {flashcardSet.cards.length} cards available
            </p>

            {/* Subset option */}
            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">
                Cards to study
              </label>
              <div className="flex flex-wrap gap-2">
                {(['all', 5, 10, 15, 20] as SubsetOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSubsetOption(opt)}
                    disabled={opt !== 'all' && opt > flashcardSet.cards.length}
                    aria-label={opt === 'all' ? 'Study all cards' : `Study ${opt} cards`}
                    className={[
                      'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                      subsetOption === opt
                        ? 'bg-primary text-[#1A1A1A]'
                        : 'border border-border bg-surface text-text-primary hover:bg-primary-tint',
                    ].join(' ')}
                  >
                    {opt === 'all' ? 'Study all' : opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Shuffle toggle */}
            <label className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <span className="text-sm font-medium text-text-primary">Shuffle cards</span>
              <input
                type="checkbox"
                checked={shouldShuffle}
                onChange={(e) => setShouldShuffle(e.target.checked)}
                className="h-4 w-4 accent-primary"
                aria-label="Toggle card shuffling"
              />
            </label>

            <Button size="lg" onClick={startSession} aria-label="Start study session">
              Start
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRegenConfirm(true)}
              isLoading={isRegenerating}
              aria-label="Regenerate flashcard set"
            >
              Regenerate flashcards
            </Button>
          </div>
        </div>

        {/* Regenerate confirm */}
        <ConfirmDialog
          isOpen={showRegenConfirm}
          onClose={() => setShowRegenConfirm(false)}
          onConfirm={handleRegenerate}
          title="Regenerate flashcard set?"
          message="This will replace the current cards with new ones generated from the same material."
          confirmLabel="Regenerate"
        />
      </main>
    )
  }

  // --- Study session ---
  if (phase === 'studying') {
    const currentCard = studyCards[currentIndex]
    const progress = ((currentIndex) / studyCards.length) * 100

    return (
      <main className="flex min-h-screen flex-col bg-background">
        {/* Header bar */}
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

          <span className="text-sm font-medium text-text-primary">
            Card {currentIndex + 1} of {studyCards.length}
          </span>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowEndConfirm(true)}
            aria-label="End session"
          >
            End Session
          </Button>
        </header>

        {/* Progress bar */}
        <div className="px-4 py-2">
          <ProgressBar value={progress} />
        </div>

        {/* Card area */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <FlashcardCard
            front={currentCard.front}
            back={currentCard.back}
            isFlipped={isFlipped}
            onFlip={() => {
              if (!isFlipped) setIsFlipped(true)
            }}
          />

          {/* Grade buttons - visible only after flip */}
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

          {/* Keyboard hint */}
          {!isFlipped && (
            <p className="text-xs text-text-secondary">
              Press <kbd className="rounded border border-border px-1.5 py-0.5 text-xs font-mono">Space</kbd> to flip
            </p>
          )}
        </div>

        {/* End session confirm */}
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
    )
  }

  // --- Results screen ---
  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={() => navigate(-1)}
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

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="animate-bounce">
            <svg
              className="h-24 w-24 text-status-ready"
              viewBox="0 0 24 24"
              fill="none"
              aria-label="Session complete"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-8 px-4 py-8">

        {/* Accuracy gauge */}
        <CircularGauge value={accuracy} size={140} label="Accuracy" />

        {/* Breakdown */}
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-status-ready">{correctCount}</span>
            <span className="text-xs text-text-secondary">Correct</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-status-failed">{incorrectCount}</span>
            <span className="text-xs text-text-secondary">Incorrect</span>
          </div>
        </div>

        {/* Previous comparison */}
        <p className="text-sm text-text-secondary">
          {previousAccuracy !== null
            ? `Previous session: ${previousAccuracy}%`
            : 'First session!'}
        </p>

        {/* Missed cards */}
        {missedCards.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setMissedExpanded((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary hover:bg-primary-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-expanded={missedExpanded}
              aria-label={`Missed cards (${missedCards.length})`}
            >
              <span>Missed cards ({missedCards.length})</span>
              <svg
                className={[
                  'h-4 w-4 transition-transform',
                  missedExpanded ? 'rotate-180' : '',
                ].join(' ')}
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {missedExpanded && (
              <ul className="mt-2 flex flex-col gap-2">
                {missedCards.map((card) => (
                  <li
                    key={card.id}
                    className="rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    <p className="text-sm font-medium text-text-primary">{card.front}</p>
                    <p className="mt-1 text-sm text-text-secondary">{card.back}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Confidence check-in */}
        {confidenceRating === null && (
          <ConfidenceCheckIn
            onRate={handleConfidenceRate}
            onSkip={() => setConfidenceRating(0)}
          />
        )}

        {/* Reflection prompt (only for confidence >= 3) */}
        {confidenceRating !== null && confidenceRating >= 3 && !reflectionDone && (
          <ReflectionPrompt
            onSubmit={handleReflectionSubmit}
            onSkip={() => setReflectionDone(true)}
          />
        )}

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Button variant="primary" onClick={startSession} aria-label="Study again">
            Study again
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowRegenConfirm(true)}
            isLoading={isRegenerating}
            aria-label="Regenerate flashcard set"
          >
            Regenerate set
          </Button>
        </div>
      </div>

      {/* Regenerate confirm */}
      <ConfirmDialog
        isOpen={showRegenConfirm}
        onClose={() => setShowRegenConfirm(false)}
        onConfirm={handleRegenerate}
        title="Regenerate flashcard set?"
        message="This will replace the current cards with new ones generated from the same material."
        confirmLabel="Regenerate"
        cancelLabel="Cancel"
      />
    </main>
  )
}
