import type { KTPerformanceRecord } from '../types/domain'
import { getStorageItem, setStorageItem } from './storage'

const KEY_PREFIX = 'pla.ktPerformance.v3'

function storageKey(ktId: string): string {
  return `${KEY_PREFIX}.${ktId}`
}

const DEFAULT_RECORD: Omit<KTPerformanceRecord, 'ktId' | 'assetId'> = {
  flashcardAttempts: 0,
  flashcardCorrect: 0,
  flashcardLastSeen: null,
  quizAttempts: 0,
  quizCorrect: 0,
  quizLastSeen: null,
  lastConfidenceRating: null,
  needsReview: false,
}

export function getKTPerformance(ktId: string, assetId = ''): KTPerformanceRecord {
  return getStorageItem<KTPerformanceRecord>(storageKey(ktId), {
    ktId,
    assetId,
    ...DEFAULT_RECORD,
  })
}

export function updateKTPerformance(
  ktId: string,
  result: {
    modality: 'flashcard' | 'quiz'
    correct: boolean
    confidenceRating?: number
    assetId?: string
  },
): void {
  const record = getKTPerformance(ktId, result.assetId)

  if (result.assetId) record.assetId = result.assetId

  const now = new Date().toISOString()

  if (result.modality === 'flashcard') {
    record.flashcardAttempts += 1
    if (result.correct) record.flashcardCorrect += 1
    record.flashcardLastSeen = now
  } else {
    record.quizAttempts += 1
    if (result.correct) record.quizCorrect += 1
    record.quizLastSeen = now
  }

  if (result.confidenceRating !== undefined) {
    record.lastConfidenceRating = result.confidenceRating
  }

  record.needsReview = computeNeedsReview(record)

  setStorageItem(storageKey(ktId), record)
}

export function batchUpdateConfidence(
  ktIds: string[],
  confidenceRating: number,
): void {
  for (const ktId of ktIds) {
    const record = getKTPerformance(ktId)
    record.lastConfidenceRating = confidenceRating
    record.needsReview = computeNeedsReview(record)
    setStorageItem(storageKey(ktId), record)
  }
}

export function getKTWeight(
  record: KTPerformanceRecord,
  modality: 'flashcard' | 'quiz',
): number {
  const attempts = modality === 'flashcard' ? record.flashcardAttempts : record.quizAttempts
  const correct = modality === 'flashcard' ? record.flashcardCorrect : record.quizCorrect
  const lastSeen = modality === 'flashcard' ? record.flashcardLastSeen : record.quizLastSeen

  if (attempts === 0) return 10

  const accuracy = correct / attempts

  const daysSince = lastSeen
    ? (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24)
    : 999

  let weight = Math.round((1 - accuracy) * 8) + 1

  if (record.lastConfidenceRating !== null && record.lastConfidenceRating <= 2) {
    weight = Math.min(weight + 2, 10)
  }

  if (daysSince > 3) weight = Math.min(weight + 1, 10)
  if (daysSince > 7) weight = Math.min(weight + 1, 10)

  return weight
}

export function computeNeedsReview(record: KTPerformanceRecord): boolean {
  if (record.flashcardAttempts === 0 && record.quizAttempts === 0) return false
  const totalAttempts = record.flashcardAttempts + record.quizAttempts
  const totalCorrect = record.flashcardCorrect + record.quizCorrect
  const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0
  return accuracy < 0.7 || (record.lastConfidenceRating !== null && record.lastConfidenceRating <= 2)
}
