import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import type {
  Quiz,
  QuizSession,
} from '../types/domain'
import {
  getQuiz,
  getQuizSessions,
  getQuizProgress,
  saveQuizProgress,
  saveQuizSession,
  regenerateQuiz,
} from '../services/mockApi'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { CircularGauge } from '../components/ui/CircularGauge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { QuizQuestion } from '../components/study/QuizQuestion'
import { ConfidenceCheckIn } from '../components/study/ConfidenceCheckIn'
import { ReflectionPrompt } from '../components/study/ReflectionPrompt'
import { useToast } from '../context/ToastContext'

/* ------------------------------------------------------------------ */
/*  Saved progress shape                                               */
/* ------------------------------------------------------------------ */

interface SavedProgress {
  answers: AnswerRecord[]
  currentIndex: number
  elapsedSec: number
}

interface AnswerRecord {
  questionId: string
  selectedIndex: number
  correct: boolean
}

/* ------------------------------------------------------------------ */
/*  Phase enum                                                         */
/* ------------------------------------------------------------------ */

type Phase = 'loading' | 'resume-prompt' | 'session' | 'results'

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function QuizSessionPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  // Data
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  usePageTitle(quiz ? `Quiz — ${quiz.title}` : 'Quiz')
  const [pastSessions, setPastSessions] = useState<QuizSession[]>([])
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null)

  // Session state
  const [phase, setPhase] = useState<Phase>('loading')
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const elapsedOffset = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Results state
  const [confidenceRating, setConfidenceRating] = useState<number | undefined>(
    undefined,
  )
  const [reflection, setReflection] = useState<string | undefined>(undefined)
  const [showReflection, setShowReflection] = useState(false)
  const [resultsFinalized, setResultsFinalized] = useState(false)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)

  // Confirm dialogs
  const [confirmExit, setConfirmExit] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)

  // Auto-advance timer ref
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ---------------------------------------------------------------- */
  /*  Load data                                                        */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!quizId) return

    async function load() {
      try {
        const [q, sessions, progress] = await Promise.all([
          getQuiz(quizId!),
          getQuizSessions(quizId!),
          getQuizProgress(quizId!),
        ])
        setQuiz(q)
        setPastSessions(sessions)

        if (progress && isValidProgress(progress)) {
          setSavedProgress(progress as SavedProgress)
          setPhase('resume-prompt')
        } else {
          setPhase('session')
        }
      } catch {
        toast.error('Failed to load quiz')
        navigate(-1)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId])

  function isValidProgress(p: unknown): p is SavedProgress {
    if (!p || typeof p !== 'object') return false
    const obj = p as Record<string, unknown>
    return (
      Array.isArray(obj.answers) &&
      typeof obj.currentIndex === 'number' &&
      typeof obj.elapsedSec === 'number'
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Timer                                                            */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (phase === 'session') {
      timerRef.current = setInterval(() => {
        setElapsedSec((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [phase])

  /* ---------------------------------------------------------------- */
  /*  Keyboard shortcuts                                               */
  /* ---------------------------------------------------------------- */

  const handleNextQuestion = useCallback(() => {
    if (!quiz || !isAnswered) return

    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }

    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedIndex(null)
      setIsAnswered(false)
    } else {
      // Quiz complete
      finishQuiz()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, isAnswered, currentIndex, answers])

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

  /* ---------------------------------------------------------------- */
  /*  Answer handling                                                  */
  /* ---------------------------------------------------------------- */

  function handleSelect(index: number) {
    if (isAnswered || !quiz) return

    setSelectedIndex(index)
    setIsAnswered(true)

    const question = quiz.questions[currentIndex]
    const correct = index === question.correctIndex
    const newAnswer: AnswerRecord = {
      questionId: question.id,
      selectedIndex: index,
      correct,
    }
    const updatedAnswers = [...answers, newAnswer]
    setAnswers(updatedAnswers)

    // Auto-save progress
    saveQuizProgress(quizId!, {
      answers: updatedAnswers,
      currentIndex: currentIndex,
      elapsedSec: elapsedSec + elapsedOffset.current,
    })

    // Auto-advance for correct answers after 2s
    if (correct && currentIndex < quiz.questions.length - 1) {
      autoAdvanceRef.current = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        setSelectedIndex(null)
        setIsAnswered(false)
        autoAdvanceRef.current = null
      }, 2000)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Finish / Save                                                    */
  /* ---------------------------------------------------------------- */

  async function finishQuiz() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setPhase('results')
  }

  async function saveSession() {
    if (!quiz || resultsFinalized) return

    const totalCorrect = answers.filter((a) => a.correct).length
    const score = Math.round((totalCorrect / quiz.questions.length) * 100)
    const totalTime = elapsedSec + elapsedOffset.current

    try {
      await saveQuizSession({
        quizId: quiz.id,
        scope: quiz.scope,
        completedAt: new Date().toISOString(),
        score,
        timeTakenSec: totalTime,
        questionResults: answers,
        confidenceRating,
        reflection,
      })
      await saveQuizProgress(quizId!, null)
      setResultsFinalized(true)
      toast.success('Quiz session saved!')
    } catch {
      toast.error('Failed to save quiz session')
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Resume / Restart                                                 */
  /* ---------------------------------------------------------------- */

  function handleResume() {
    if (!savedProgress) return
    setAnswers(savedProgress.answers)
    setCurrentIndex(savedProgress.currentIndex + 1)
    elapsedOffset.current = savedProgress.elapsedSec
    setElapsedSec(savedProgress.elapsedSec)
    setPhase('session')
  }

  function handleStartOver() {
    setAnswers([])
    setCurrentIndex(0)
    setSelectedIndex(null)
    setIsAnswered(false)
    elapsedOffset.current = 0
    setElapsedSec(0)
    setSavedProgress(null)
    setPhase('session')
  }

  function handleRetake() {
    setAnswers([])
    setCurrentIndex(0)
    setSelectedIndex(null)
    setIsAnswered(false)
    elapsedOffset.current = 0
    setElapsedSec(0)
    setConfidenceRating(undefined)
    setReflection(undefined)
    setShowReflection(false)
    setResultsFinalized(false)
    setExpandedQuestion(null)
    setPhase('session')
  }

  async function handleRegenerate() {
    if (!quizId) return
    try {
      const newQuiz = await regenerateQuiz(quizId)
      setQuiz(newQuiz)
      handleRetake()
      toast.success('Quiz regenerated!')
    } catch {
      toast.error('Failed to regenerate quiz')
    }
  }

  function handleExit() {
    navigate(-1)
  }

  /* ---------------------------------------------------------------- */
  /*  Confidence / Reflection                                          */
  /* ---------------------------------------------------------------- */

  function handleConfidenceRate(rating: number) {
    setConfidenceRating(rating)
    if (rating >= 3) {
      setShowReflection(true)
    } else {
      saveSession()
    }
  }

  function handleConfidenceSkip() {
    saveSession()
  }

  function handleReflectionSubmit(text: string) {
    setReflection(text)
    // Save will be triggered after state update
    setTimeout(() => saveSession(), 0)
  }

  function handleReflectionSkip() {
    saveSession()
  }

  // Also save if reflection/confidence was provided (for state-based updates)
  useEffect(() => {
    if (reflection !== undefined && phase === 'results' && !resultsFinalized) {
      saveSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflection])

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                          */
  /* ---------------------------------------------------------------- */

  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function formatTimeLong(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    if (m === 0) return `${s} sec`
    return `${m} min ${s} sec`
  }

  function getBestScore(): number | null {
    if (pastSessions.length === 0) return null
    return Math.round(Math.max(...pastSessions.map((s) => s.score)) * 100)
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Loading                                                  */
  /* ---------------------------------------------------------------- */

  if (phase === 'loading' || !quiz) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-primary"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Loading quiz"
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
          <p className="text-sm text-text-secondary">Loading quiz...</p>
        </div>
      </main>
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Resume prompt                                            */
  /* ---------------------------------------------------------------- */

  if (phase === 'resume-prompt') {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex max-w-sm flex-col items-center gap-6 rounded-lg border border-border bg-background p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">
            Resume Quiz?
          </h2>
          <p className="text-center text-sm text-text-secondary">
            You have an in-progress quiz. Resume where you left off?
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleStartOver}>
              Start over
            </Button>
            <Button variant="primary" onClick={handleResume}>
              Resume
            </Button>
          </div>
        </div>
      </main>
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Results                                                  */
  /* ---------------------------------------------------------------- */

  if (phase === 'results') {
    const totalCorrect = answers.filter((a) => a.correct).length
    const score = Math.round((totalCorrect / quiz.questions.length) * 100)
    const totalTime = elapsedSec + elapsedOffset.current
    const bestScore = getBestScore()

    return (
      <main className="flex min-h-screen w-full flex-col bg-background">
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
          <span className="text-sm font-semibold text-text-primary">Quiz Results</span>
          <div className="w-8" />
        </header>

        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-4 py-8">
          {/* Score */}
          <CircularGauge value={score} size={160} strokeWidth={10} label="Score" />

          {/* Time */}
          <p className="text-sm text-text-secondary">
            Time: {formatTimeLong(totalTime)}
          </p>

          {/* Best score comparison */}
          <p className="text-sm text-text-secondary">
            {bestScore !== null
              ? `Best score: ${bestScore}%`
              : 'First attempt!'}
          </p>

          {/* Question breakdown */}
          <div className="w-full">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">
              Question Breakdown
            </h3>
            <div className="flex flex-col gap-1">
              {quiz.questions.map((q, i) => {
                const answer = answers[i]
                const isCorrect = answer?.correct ?? false
                const isExpanded = expandedQuestion === i

                return (
                  <div key={q.id} className="rounded-lg border border-border">
                    <button
                      onClick={() =>
                        setExpandedQuestion(isExpanded ? null : i)
                      }
                      aria-expanded={isExpanded}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <span className="text-text-primary">
                        Question {i + 1}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          isCorrect
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border px-4 py-3">
                        <p className="mb-2 text-sm font-medium text-text-primary">
                          {q.questionText}
                        </p>
                        <div className="flex flex-col gap-1">
                          {q.options.map((opt, oi) => {
                            let optClass = 'text-sm text-text-secondary'
                            if (oi === q.correctIndex) {
                              optClass =
                                'text-sm font-medium text-green-700'
                            } else if (oi === answer?.selectedIndex) {
                              optClass = 'text-sm font-medium text-red-600'
                            }
                            return (
                              <p key={oi} className={optClass}>
                                {oi + 1}. {opt}
                                {oi === q.correctIndex && ' (correct)'}
                                {oi === answer?.selectedIndex &&
                                  oi !== q.correctIndex &&
                                  ' (your answer)'}
                              </p>
                            )
                          })}
                        </div>
                        <p className="mt-2 text-xs text-text-secondary">
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Confidence + Reflection */}
          {!resultsFinalized && !showReflection && (
            <ConfidenceCheckIn
              onRate={handleConfidenceRate}
              onSkip={handleConfidenceSkip}
            />
          )}

          {!resultsFinalized && showReflection && (
            <ReflectionPrompt
              onSubmit={handleReflectionSubmit}
              onSkip={handleReflectionSkip}
            />
          )}

          {/* CTAs */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setConfirmRegenerate(true)}
            >
              Regenerate quiz
            </Button>
            <Button variant="primary" onClick={handleRetake}>
              Retake
            </Button>
          </div>
        </div>

        <ConfirmDialog
          isOpen={confirmRegenerate}
          onClose={() => setConfirmRegenerate(false)}
          onConfirm={handleRegenerate}
          title="Regenerate Quiz"
          message="This will generate new questions. Your current results will still be saved. Continue?"
          confirmLabel="Regenerate"
        />
      </main>
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Session                                                  */
  /* ---------------------------------------------------------------- */

  const currentQuestion = quiz.questions[currentIndex]
  const answeredCount = answers.length
  const progressPercent = (answeredCount / quiz.questions.length) * 100
  const isLastQuestion = currentIndex === quiz.questions.length - 1

  return (
    <main className="flex min-h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={() => setConfirmExit(true)}
          aria-label="Close quiz"
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

        <span className="text-sm font-medium text-text-primary tabular-nums">
          {formatTime(elapsedSec)}
        </span>

        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">
            Question {currentIndex + 1} of {quiz.questions.length}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirmExit(true)}
          >
            End Quiz
          </Button>
        </div>
      </header>

      {/* Progress bar */}
      <ProgressBar value={progressPercent} />

      {/* Question area */}
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <QuizQuestion
          question={currentQuestion}
          selectedIndex={selectedIndex}
          isAnswered={isAnswered}
          onSelect={handleSelect}
        />

        {/* Next button */}
        {isAnswered && (
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleNextQuestion}>
              {isLastQuestion ? 'Finish' : 'Next'}
            </Button>
          </div>
        )}
      </section>

      {/* Confirm exit */}
      <ConfirmDialog
        isOpen={confirmExit}
        onClose={() => setConfirmExit(false)}
        onConfirm={handleExit}
        title="End Quiz?"
        message="Your progress will be saved. You can resume later."
        confirmLabel="End quiz"
        variant="danger"
      />
    </main>
  )
}
