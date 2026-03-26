import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import type { QuizQuestion as QuizQuestionType, KnowledgeTouchpoint } from '../types/domain'
import {
  generateQuizQuestionFromKT,
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
import { QuizQuestion } from '../components/study/QuizQuestion'
import { ConfidenceCheckIn } from '../components/study/ConfidenceCheckIn'
import { AiChatFab } from '../components/chat/AiChatFab'
import { AiChatPanel } from '../components/chat/AiChatPanel'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Phase = 'session' | 'results'

interface AdaptiveQuestion extends QuizQuestionType {
  ktId: string
}

interface AnswerRecord {
  ktId: string
  questionId: string
  selectedIndex: number
  correct: boolean
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const BATCH_SIZE = 10

export default function QuizSessionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  usePageTitle('Quiz')

  // Parse scope from URL search params
  const scopeLevel = searchParams.get('scope') as string
  const topicId = searchParams.get('topicId')
  const studySetId = searchParams.get('studySetId')
  const assetId = searchParams.get('assetId')
  const ktId = searchParams.get('ktId')
  const assetIdsParam = searchParams.get('assetIds')
  const returnTo = searchParams.get('returnTo') ?? '/'

  // --- Session state ---
  const [phase, setPhase] = useState<Phase>('session')
  const [questions, setQuestions] = useState<AdaptiveQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [elapsedSec, setElapsedSec] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)

  // --- Keep-going loop ---
  const [allSeenKtIds, setAllSeenKtIds] = useState<string[]>([])
  const [totalStudiedThisSitting, setTotalStudiedThisSitting] = useState(0)
  const [roundNumber, setRoundNumber] = useState(1)

  // --- Results state ---
  const [confidenceRating, setConfidenceRating] = useState<number | null>(null)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)

  // --- Chat state (closed by default) ---
  const [chatOpen, setChatOpen] = useState(false)

  // Auto-advance timer ref
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // KT pool reference
  const ktPoolRef = useRef<KnowledgeTouchpoint[]>([])

  // --- Resolve KT pool and generate first batch ---
  useEffect(() => {
    try {
      let kts: KnowledgeTouchpoint[] = []

      if (assetIdsParam) {
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
      const selected = selectAdaptiveKTs(pool, 'quiz', BATCH_SIZE)
      const qs = generateQuestionsForKTs(kts, selected)

      setQuestions(qs)
      setAllSeenKtIds(selected)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start quiz')
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Timer ---
  useEffect(() => {
    if (phase === 'session' && !loading) {
      timerRef.current = setInterval(() => setElapsedSec((prev) => prev + 1), 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [phase, loading])

  // --- Generate questions from selected KT IDs ---
  function generateQuestionsForKTs(
    kts: KnowledgeTouchpoint[],
    selectedIds: string[],
  ): AdaptiveQuestion[] {
    const ktMap = new Map(kts.map((k) => [k.id, k]))
    return selectedIds.map((id) => {
      const kt = ktMap.get(id)!
      const record = getKTPerformance(id, kt.assetId)
      const q = generateQuizQuestionFromKT(kt, record.quizAttempts)
      return { ...q, ktId: id }
    })
  }

  // --- Finish batch ---
  const finishBatch = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setPhase('results')
  }, [])

  // --- Next question ---
  const handleNextQuestion = useCallback(() => {
    if (!isAnswered) return

    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedIndex(null)
      setIsAnswered(false)
    } else {
      finishBatch()
    }
  }, [isAnswered, currentIndex, questions.length, finishBatch])

  // --- Keyboard shortcuts ---
  useEffect(() => {
    if (phase !== 'session') return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        if (isAnswered) {
          e.preventDefault()
          handleNextQuestion()
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setConfirmExit(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, isAnswered, handleNextQuestion])

  // --- Answer handling ---
  function handleSelect(index: number) {
    if (isAnswered || questions.length === 0) return

    setSelectedIndex(index)
    setIsAnswered(true)

    const question = questions[currentIndex]
    const correct = index === question.correctIndex
    const newAnswer: AnswerRecord = {
      ktId: question.ktId,
      questionId: question.id,
      selectedIndex: index,
      correct,
    }
    setAnswers((prev) => [...prev, newAnswer])

    // Update KT performance immediately
    const kt = ktPoolRef.current.find((k) => k.id === question.ktId)
    updateKTPerformance(question.ktId, {
      modality: 'quiz',
      correct,
      assetId: kt?.assetId,
    })

    // Auto-advance for correct answers
    if (correct && currentIndex < questions.length - 1) {
      autoAdvanceRef.current = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        setSelectedIndex(null)
        setIsAnswered(false)
        autoAdvanceRef.current = null
      }, 2000)
    }
  }

  // --- Keep going ---
  function handleKeepGoing() {
    const kts = ktPoolRef.current
    const pool = kts.map((k) => k.id)
    const selected = selectAdaptiveKTs(pool, 'quiz', BATCH_SIZE, allSeenKtIds)
    const qs = generateQuestionsForKTs(kts, selected)

    setTotalStudiedThisSitting((prev) => prev + answers.length)
    setAllSeenKtIds((prev) => [...prev, ...selected])
    setQuestions(qs)
    setCurrentIndex(0)
    setSelectedIndex(null)
    setIsAnswered(false)
    setAnswers([])
    setElapsedSec(0)
    setConfidenceRating(null)
    setExpandedQuestion(null)
    setRoundNumber((r) => r + 1)
    setPhase('session')
  }

  // --- Done ---
  function handleDone() {
    navigate(returnTo)
  }

  // --- End early ---
  function handleExit() {
    if (answers.length > 0) {
      finishBatch()
    } else {
      navigate(returnTo)
    }
  }

  // --- Confidence ---
  function handleConfidenceRate(rating: number) {
    setConfidenceRating(rating)
    const ktIds = answers.map((a) => a.ktId)
    batchUpdateConfidence(ktIds, rating)
  }

  // --- Helpers ---
  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // --- Derived ---
  const totalCorrect = answers.filter((a) => a.correct).length
  const score = answers.length > 0 ? Math.round((totalCorrect / answers.length) * 100) : 0

  const missedKtIds = answers.filter((a) => !a.correct).map((a) => a.ktId)
  const missedKTs = ktPoolRef.current.filter((k) => missedKtIds.includes(k.id))

  // --- Loading ---
  if (loading) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none" aria-label="Loading quiz">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm text-text-secondary">Preparing quiz...</p>
        </div>
      </main>
    )
  }

  // --- Error ---
  if (error) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-status-failed">{error}</p>
          <Button variant="secondary" onClick={() => navigate(returnTo)} aria-label="Go back">
            Go back
          </Button>
        </div>
      </main>
    )
  }

  // --- Results screen ---
  if (phase === 'results') {
    return (
      <main className="flex min-h-screen w-full flex-col bg-background">
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
          <span className="text-sm font-semibold text-text-primary">Quiz Results</span>
          <div className="w-8" />
        </header>

        <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-8">
          {/* Score ring + stats row */}
          <div className="flex w-full items-center gap-7 rounded-xl border border-border p-6">
            <CircularGauge value={score} size={100} strokeWidth={8} label="Score" />
            <div className="flex flex-1 flex-col divide-y divide-border">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-text-secondary">Correct</span>
                <span className="text-sm font-bold text-status-ready">{totalCorrect} questions</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-text-secondary">Incorrect</span>
                <span className="text-sm font-bold text-status-failed">{answers.length - totalCorrect} questions</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-text-secondary">Time</span>
                <span className="text-sm font-bold text-text-primary">{formatTime(elapsedSec)}</span>
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

          {/* Question breakdown */}
          <div className="mt-6 w-full">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Question Breakdown</h3>
            <div className="flex flex-col gap-1">
              {questions.map((q, i) => {
                const answer = answers[i]
                const isCorrect = answer?.correct ?? false
                const isExpanded = expandedQuestion === i

                return (
                  <div key={q.id} className="rounded-lg border border-border">
                    <button
                      onClick={() => setExpandedQuestion(isExpanded ? null : i)}
                      aria-expanded={isExpanded}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <span className="text-text-primary">Question {i + 1}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border px-4 py-3">
                        <p className="mb-2 text-sm font-medium text-text-primary">{q.questionText}</p>
                        <div className="flex flex-col gap-1">
                          {q.options.map((opt, oi) => {
                            let optClass = 'text-sm text-text-secondary'
                            if (oi === q.correctIndex) optClass = 'text-sm font-medium text-green-700'
                            else if (oi === answer?.selectedIndex) optClass = 'text-sm font-medium text-red-600'
                            return (
                              <p key={oi} className={optClass}>
                                {oi + 1}. {opt}
                                {oi === q.correctIndex && ' (correct)'}
                                {oi === answer?.selectedIndex && oi !== q.correctIndex && ' (your answer)'}
                              </p>
                            )
                          })}
                        </div>
                        <p className="mt-2 text-xs text-text-secondary">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Keep going / Done — always visible */}
          <div className="mt-8 flex w-full flex-col items-center gap-2">
            <button
              onClick={handleKeepGoing}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-text-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Keep going with 10 more questions"
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
                {totalStudiedThisSitting + answers.length} questions studied this session
              </p>
            )}
          </div>
        </div>

      </main>
    )
  }

  // --- Session ---
  const currentQuestion = questions[currentIndex]
  const progressPercent = (answers.length / questions.length) * 100
  const isLastQuestion = currentIndex === questions.length - 1

  return (
    <div className="flex h-screen">
    <main className="flex flex-1 flex-col overflow-y-auto bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={() => setConfirmExit(true)}
          aria-label="Close quiz"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-text-primary tabular-nums">{formatTime(elapsedSec)}</span>
          {roundNumber > 1 && (
            <span className="text-xs text-text-secondary">
              {totalStudiedThisSitting + currentIndex + 1} questions this session
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setConfirmExit(true)}>
            End Quiz
          </Button>
        </div>
      </header>

      <ProgressBar value={progressPercent} />

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <QuizQuestion
          question={currentQuestion}
          selectedIndex={selectedIndex}
          isAnswered={isAnswered}
          onSelect={handleSelect}
        />

        {isAnswered && (
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleNextQuestion}>
              {isLastQuestion ? 'Finish' : 'Next'}
            </Button>
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={confirmExit}
        onClose={() => setConfirmExit(false)}
        onConfirm={handleExit}
        title="End Quiz?"
        message="Your progress will be saved."
        confirmLabel="End quiz"
        variant="danger"
      />

    </main>
    {!chatOpen && <AiChatFab onClick={() => setChatOpen(true)} />}
    <AiChatPanel
      isOpen={chatOpen}
      onClose={() => setChatOpen(false)}
      assetTitle="Quiz"
      knowledgeTouchpoints={ktPoolRef.current}
    />
    </div>
  )
}
