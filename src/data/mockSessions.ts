import type {
  FlashcardSession,
  QuizSession,
  RecentActivityItem,
} from '../types/domain'

const daysAgo = (d: number): string =>
  new Date(Date.now() - d * 86_400_000).toISOString()

/* ------------------------------------------------------------------ */
/*  Flashcard Sessions                                                 */
/* ------------------------------------------------------------------ */
export const flashcardSessions: FlashcardSession[] = [
  // fset-1 sessions (3) — accuracy: 60%, 72%, 85%
  {
    id: 'fs-1',
    setId: 'fset-1',
    scope: { level: 'asset', assetId: 'asset-doc-1' },
    completedAt: daysAgo(6),
    accuracy: 0.6,
    cardResults: [
      { cardId: 'fc-1-1', correct: true },
      { cardId: 'fc-1-2', correct: false },
      { cardId: 'fc-1-3', correct: true },
      { cardId: 'fc-1-4', correct: false },
      { cardId: 'fc-1-5', correct: true },
      { cardId: 'fc-1-6', correct: false },
      { cardId: 'fc-1-7', correct: true },
      { cardId: 'fc-1-8', correct: false },
      { cardId: 'fc-1-9', correct: true },
      { cardId: 'fc-1-10', correct: true },
    ],
  },
  {
    id: 'fs-2',
    setId: 'fset-1',
    scope: { level: 'asset', assetId: 'asset-doc-1' },
    completedAt: daysAgo(4),
    accuracy: 0.72,
    cardResults: [
      { cardId: 'fc-1-1', correct: true },
      { cardId: 'fc-1-2', correct: true },
      { cardId: 'fc-1-3', correct: true },
      { cardId: 'fc-1-4', correct: false },
      { cardId: 'fc-1-5', correct: true },
      { cardId: 'fc-1-6', correct: true },
      { cardId: 'fc-1-7', correct: false },
      { cardId: 'fc-1-8', correct: false },
      { cardId: 'fc-1-9', correct: true },
      { cardId: 'fc-1-10', correct: true },
    ],
    confidenceRating: 3,
  },
  {
    id: 'fs-3',
    setId: 'fset-1',
    scope: { level: 'asset', assetId: 'asset-doc-1' },
    completedAt: daysAgo(1),
    accuracy: 0.85,
    cardResults: [
      { cardId: 'fc-1-1', correct: true },
      { cardId: 'fc-1-2', correct: true },
      { cardId: 'fc-1-3', correct: true },
      { cardId: 'fc-1-4', correct: true },
      { cardId: 'fc-1-5', correct: true },
      { cardId: 'fc-1-6', correct: true },
      { cardId: 'fc-1-7', correct: false },
      { cardId: 'fc-1-8', correct: true },
      { cardId: 'fc-1-9', correct: true },
      { cardId: 'fc-1-10', correct: false },
    ],
    confidenceRating: 4,
    reflection: 'Feeling more confident on the epigenetics section. Need to review alternative splicing details.',
  },

  // fset-2 sessions (2)
  {
    id: 'fs-4',
    setId: 'fset-2',
    scope: { level: 'asset', assetId: 'asset-panopto-1' },
    completedAt: daysAgo(5),
    accuracy: 0.625,
    cardResults: [
      { cardId: 'fc-2-1', correct: true },
      { cardId: 'fc-2-2', correct: false },
      { cardId: 'fc-2-3', correct: true },
      { cardId: 'fc-2-4', correct: false },
      { cardId: 'fc-2-5', correct: true },
      { cardId: 'fc-2-6', correct: true },
      { cardId: 'fc-2-7', correct: false },
      { cardId: 'fc-2-8', correct: true },
    ],
  },
  {
    id: 'fs-5',
    setId: 'fset-2',
    scope: { level: 'asset', assetId: 'asset-panopto-1' },
    completedAt: daysAgo(2),
    accuracy: 0.75,
    cardResults: [
      { cardId: 'fc-2-1', correct: true },
      { cardId: 'fc-2-2', correct: true },
      { cardId: 'fc-2-3', correct: true },
      { cardId: 'fc-2-4', correct: false },
      { cardId: 'fc-2-5', correct: true },
      { cardId: 'fc-2-6', correct: true },
      { cardId: 'fc-2-7', correct: false },
      { cardId: 'fc-2-8', correct: true },
    ],
    confidenceRating: 3,
    reflection: 'Ribosome structure questions are getting easier. Still struggling with Kozak sequence details.',
  },
]

/* ------------------------------------------------------------------ */
/*  Quiz Sessions                                                      */
/* ------------------------------------------------------------------ */
export const quizSessions: QuizSession[] = [
  // quiz-1 sessions (2) — scores: 65%, 80%
  {
    id: 'qs-1',
    quizId: 'quiz-1',
    scope: { level: 'asset', assetId: 'asset-doc-1' },
    completedAt: daysAgo(5),
    score: 0.65,
    timeTakenSec: 420,
    questionResults: [
      { questionId: 'qq-1-1', selectedIndex: 2, correct: true },
      { questionId: 'qq-1-2', selectedIndex: 2, correct: true },
      { questionId: 'qq-1-3', selectedIndex: 1, correct: true },
      { questionId: 'qq-1-4', selectedIndex: 0, correct: false },
      { questionId: 'qq-1-5', selectedIndex: 2, correct: true },
      { questionId: 'qq-1-6', selectedIndex: 2, correct: true },
      { questionId: 'qq-1-7', selectedIndex: 2, correct: true },
      { questionId: 'qq-1-8', selectedIndex: 0, correct: false },
      { questionId: 'qq-1-9', selectedIndex: 0, correct: false },
      { questionId: 'qq-1-10', selectedIndex: 1, correct: false },
    ],
    confidenceRating: 2,
  },
  {
    id: 'qs-2',
    quizId: 'quiz-1',
    scope: { level: 'asset', assetId: 'asset-doc-1' },
    completedAt: daysAgo(2),
    score: 0.8,
    timeTakenSec: 350,
    questionResults: [
      { questionId: 'qq-1-1', selectedIndex: 2, correct: true },
      { questionId: 'qq-1-2', selectedIndex: 2, correct: true },
      { questionId: 'qq-1-3', selectedIndex: 1, correct: true },
      { questionId: 'qq-1-4', selectedIndex: 1, correct: true },
      { questionId: 'qq-1-5', selectedIndex: 2, correct: true },
      { questionId: 'qq-1-6', selectedIndex: 2, correct: true },
      { questionId: 'qq-1-7', selectedIndex: 2, correct: true },
      { questionId: 'qq-1-8', selectedIndex: 1, correct: true },
      { questionId: 'qq-1-9', selectedIndex: 0, correct: false },
      { questionId: 'qq-1-10', selectedIndex: 0, correct: false },
    ],
    confidenceRating: 4,
    reflection: 'Big improvement over last attempt. Epigenetic modifications section still needs work.',
  },

  // quiz-2 session (1)
  {
    id: 'qs-3',
    quizId: 'quiz-2',
    scope: { level: 'asset', assetId: 'asset-panopto-1' },
    completedAt: daysAgo(3),
    score: 0.75,
    timeTakenSec: 300,
    questionResults: [
      { questionId: 'qq-2-1', selectedIndex: 1, correct: true },
      { questionId: 'qq-2-2', selectedIndex: 2, correct: true },
      { questionId: 'qq-2-3', selectedIndex: 2, correct: true },
      { questionId: 'qq-2-4', selectedIndex: 1, correct: true },
      { questionId: 'qq-2-5', selectedIndex: 2, correct: true },
      { questionId: 'qq-2-6', selectedIndex: 1, correct: true },
      { questionId: 'qq-2-7', selectedIndex: 0, correct: false },
      { questionId: 'qq-2-8', selectedIndex: 0, correct: false },
    ],
    confidenceRating: 3,
  },
]

/* ------------------------------------------------------------------ */
/*  Recent Activity                                                    */
/* ------------------------------------------------------------------ */
export const recentActivity: RecentActivityItem[] = [
  {
    id: 'ra-1',
    modalityType: 'flashcards',
    title: 'Gene Expression Notes \u2014 Flashcards',
    score: 0.85,
    completedAt: daysAgo(1),
    route: '/flashcards/fset-1/session',
  },
  {
    id: 'ra-2',
    modalityType: 'quiz',
    title: 'Gene Expression Notes \u2014 Quiz',
    score: 0.8,
    completedAt: daysAgo(2),
    route: '/quiz/quiz-1/session',
  },
  {
    id: 'ra-3',
    modalityType: 'flashcards',
    title: 'Protein Synthesis Lecture \u2014 Flashcards',
    score: 0.75,
    completedAt: daysAgo(2),
    route: '/flashcards/fset-2/session',
  },
  {
    id: 'ra-4',
    modalityType: 'quiz',
    title: 'Protein Synthesis Lecture \u2014 Quiz',
    score: 0.75,
    completedAt: daysAgo(3),
    route: '/quiz/quiz-2/session',
  },
  {
    id: 'ra-5',
    modalityType: 'flashcards',
    title: 'Gene Expression Notes \u2014 Flashcards',
    score: 0.72,
    completedAt: daysAgo(4),
    route: '/flashcards/fset-1/session',
  },
]
