export type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed'
export type AssetType = 'document' | 'video' | 'panopto'
export type ModalityType = 'flashcards' | 'quiz' | 'mindmap'

export type GenerationScope =
  | { level: 'kt'; ktId: string; assetId: string }
  | { level: 'asset'; assetId: string }
  | { level: 'studyset'; studySetId: string; topicId: string }
  | { level: 'topic'; topicId: string }

export interface Citation {
  id: string
  label: string
  snippet: string
  page?: number
  timestampSec?: number
  sourceAssetId?: string
}

export interface KnowledgeTouchpoint {
  id: string
  assetId: string
  index: number
  heading: string
  body: string
  citationIds: string[]
  flashcardSetId?: string
  quizId?: string
  mindmapId?: string
}

export interface LearningAsset {
  id: string
  title: string
  type: AssetType
  topicId: string | null
  studySetId?: string | null
  addedAt: string
  lastOpenedAt: string
  processingStatus: ProcessingStatus
  sourceLabel: string
  originalUrl: string
  durationMinutes?: number
  pages?: number
  knowledgeTouchpoints: KnowledgeTouchpoint[]
  citations: Citation[]
  isSynthesis?: boolean
  sourceAssetIds?: string[]
  isDeleted?: boolean
}

export interface StudySet {
  id: string
  topicId: string
  name: string
  assetIds: string[]
  createdAt: string
  synthesisAssetId?: string
  isDeleted?: boolean
}

export interface Topic {
  id: string
  name: string
  archived: boolean
  createdAt: string
}

export interface FlashcardSet {
  id: string
  scope: GenerationScope
  title: string
  cards: Flashcard[]
  createdAt: string
  processingStatus: ProcessingStatus
}

export interface Flashcard {
  id: string
  front: string
  back: string
  citationIds: string[]
}

export interface Quiz {
  id: string
  scope: GenerationScope
  title: string
  questions: QuizQuestion[]
  createdAt: string
  processingStatus: ProcessingStatus
}

export interface QuizQuestion {
  id: string
  questionText: string
  options: string[]
  correctIndex: number
  explanation: string
  citationIds: string[]
}

export interface MindMap {
  id: string
  scope: GenerationScope
  title: string
  nodes: MindMapNode[]
  createdAt: string
}

export interface MindMapNode {
  id: string
  label: string
  parentId: string | null
  ktId?: string
}

export interface TopicKPI {
  assetCount: number
  flashcardAccuracy: number | null
  quizBestScore: number | null
  studyStreak: number
  lastStudiedAt: string | null
}

export interface AssetKPI {
  flashcardAccuracy: number | null
  quizBestScore: number | null
  quizAttempts: number
  flashcardSessions: number
  lastStudiedAt: string | null
  ktsTotal: number
  ktsWithFlashcards: number
  ktsWithQuiz: number
}

export interface DashboardKPI {
  totalTopics: number
  overallAccuracy: number | null
  overallQuizBest: number | null
  studyStreak: number
  lastStudiedAt: string | null
}

export interface FlashcardSession {
  id: string
  setId: string
  scope: GenerationScope
  completedAt: string
  accuracy: number
  cardResults: { cardId: string; correct: boolean }[]
  confidenceRating?: number
  reflection?: string
}

export interface QuizSession {
  id: string
  quizId: string
  scope: GenerationScope
  completedAt: string
  score: number
  timeTakenSec: number
  questionResults: { questionId: string; selectedIndex: number; correct: boolean }[]
  confidenceRating?: number
  reflection?: string
}

export interface RecentActivityItem {
  id: string
  modalityType: ModalityType
  title: string
  score: number
  completedAt: string
  route: string
}

export interface KTPerformanceRecord {
  ktId: string
  assetId: string
  flashcardAttempts: number
  flashcardCorrect: number
  flashcardLastSeen: string | null
  quizAttempts: number
  quizCorrect: number
  quizLastSeen: string | null
  lastConfidenceRating: number | null
  needsReview: boolean
}

export interface PanoptoVideo {
  id: string
  title: string
  duration: string
  recordedDate: string
  thumbnailUrl?: string
}
