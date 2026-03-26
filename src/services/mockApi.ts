import type {
  Topic,
  LearningAsset,
  StudySet,
  FlashcardSet,
  Flashcard,
  Quiz,
  QuizQuestion,
  MindMap,
  MindMapNode,
  FlashcardSession,
  QuizSession,
  RecentActivityItem,
  DashboardKPI,
  TopicKPI,
  AssetKPI,
  GenerationScope,
  PanoptoVideo,
  KnowledgeTouchpoint,
  Citation,
} from '../types/domain'

import { getKTPerformance } from '../utils/ktPerformance'

import {
  topics as initialTopics,
  learningAssets as initialAssets,
  studySets as initialStudySets,
} from '../data/mockData'

import {
  flashcardSets as initialFlashcardSets,
  quizzes as initialQuizzes,
  mindMaps as initialMindMaps,
} from '../data/mockModalities'

import {
  flashcardSessions as initialFlashcardSessions,
  quizSessions as initialQuizSessions,
  recentActivity as initialRecentActivity,
} from '../data/mockSessions'

import { panoptoCatalog } from '../data/mockPanopto'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const delay = (ms?: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms ?? 120 + Math.random() * 260))

let idCounter = 1000
const nextId = (prefix: string): string => `${prefix}-${++idCounter}`

const clone = <T>(v: T): T => structuredClone(v)

/* ------------------------------------------------------------------ */
/*  Mutable in-memory store                                            */
/* ------------------------------------------------------------------ */

// Default to empty state so new users land on EmptyDashboard after onboarding.
// Dev toggle sets mock:seeded to '1' to load sample data.
const isEmpty = typeof window === 'undefined' || localStorage.getItem('mock:seeded') !== '1'

// Pre-seed with demo data so library and dashboard show content on load
const topics: Topic[] = isEmpty ? [] : clone(initialTopics)
const assets: LearningAsset[] = isEmpty ? [] : clone(initialAssets)
const studySets: StudySet[] = isEmpty ? [] : clone(initialStudySets)
const flashcardSets: FlashcardSet[] = isEmpty ? [] : clone(initialFlashcardSets)
const quizzes: Quiz[] = isEmpty ? [] : clone(initialQuizzes)
const mindMaps: MindMap[] = isEmpty ? [] : clone(initialMindMaps)
const fcSessions: FlashcardSession[] = isEmpty ? [] : clone(initialFlashcardSessions)
const qzSessions: QuizSession[] = isEmpty ? [] : clone(initialQuizSessions)
const recentActivity: RecentActivityItem[] = isEmpty ? [] : clone(initialRecentActivity)

/** Track first-call failures for translateKTs */
const translationAttempted = new Set<string>()

/* ------------------------------------------------------------------ */
/*  Global Search                                                      */
/* ------------------------------------------------------------------ */

export type SearchResultType = 'topic' | 'asset' | 'flashcardSet' | 'quiz' | 'mindmap'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  /** Route path for navigation */
  href: string
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  await delay(60)
  const q = query.toLowerCase().trim()
  if (!q) return []

  const results: SearchResult[] = []

  // Search topics (folios)
  for (const t of topics) {
    if (t.name.toLowerCase().includes(q)) {
      results.push({
        id: t.id,
        type: 'topic',
        title: t.name,
        subtitle: t.archived ? 'Archived folio' : 'Folio',
        href: `/topics/${t.id}`,
      })
    }
  }

  // Search learning assets
  for (const a of assets) {
    if (a.isDeleted) continue
    if (a.title.toLowerCase().includes(q)) {
      results.push({
        id: a.id,
        type: 'asset',
        title: a.title,
        subtitle: `${a.type.charAt(0).toUpperCase() + a.type.slice(1)} · ${a.sourceLabel}`,
        href: `/assets/${a.id}`,
      })
    }
  }

  // Search mind maps
  for (const mm of mindMaps) {
    if (mm.title.toLowerCase().includes(q)) {
      results.push({
        id: mm.id,
        type: 'mindmap',
        title: mm.title,
        subtitle: `Mind Map · ${mm.nodes.length} nodes`,
        href: `/mindmap/${mm.id}`,
      })
    }
  }

  return results.slice(0, 20)
}

/* ------------------------------------------------------------------ */
/*  Topics                                                             */
/* ------------------------------------------------------------------ */

export async function listTopics(): Promise<Topic[]> {
  await delay()
  return clone(topics.filter((t) => !t.archived))
}

export async function listAllTopics(): Promise<Topic[]> {
  await delay()
  return clone(topics)
}

export async function createTopic(name: string): Promise<Topic> {
  await delay()
  const topic: Topic = {
    id: nextId('topic'),
    name,
    archived: false,
    createdAt: new Date().toISOString(),
  }
  topics.push(topic)
  return clone(topic)
}

export async function renameTopic(
  topicId: string,
  name: string
): Promise<Topic> {
  await delay()
  const t = topics.find((x) => x.id === topicId)
  if (!t) throw new Error(`Topic ${topicId} not found`)
  t.name = name
  return clone(t)
}

export async function archiveTopic(topicId: string): Promise<Topic> {
  await delay()
  const t = topics.find((x) => x.id === topicId)
  if (!t) throw new Error(`Topic ${topicId} not found`)
  t.archived = true
  return clone(t)
}

export async function unarchiveTopic(topicId: string): Promise<Topic> {
  await delay()
  const t = topics.find((x) => x.id === topicId)
  if (!t) throw new Error(`Topic ${topicId} not found`)
  t.archived = false
  return clone(t)
}

export async function getTopicDetail(
  topicId: string
): Promise<{
  topic: Topic
  assets: LearningAsset[]
  studySets: StudySet[]
}> {
  await delay()
  const topic = topics.find((x) => x.id === topicId)
  if (!topic) throw new Error(`Topic ${topicId} not found`)
  const topicAssets = assets.filter(
    (a) => a.topicId === topicId && !a.isDeleted
  )
  const topicSets = studySets.filter(
    (s) => s.topicId === topicId && !s.isDeleted
  )
  return {
    topic: clone(topic),
    assets: clone(topicAssets),
    studySets: clone(topicSets),
  }
}

/* ------------------------------------------------------------------ */
/*  Learning Assets                                                    */
/* ------------------------------------------------------------------ */

export async function listAssets(topicId?: string): Promise<LearningAsset[]> {
  await delay()
  let result = assets.filter((a) => !a.isDeleted)
  if (topicId) result = result.filter((a) => a.topicId === topicId)
  return clone(result)
}

export async function listRecentAssets(
  limit = 10
): Promise<LearningAsset[]> {
  await delay()
  const sorted = assets
    .filter((a) => !a.isDeleted)
    .sort(
      (a, b) =>
        new Date(b.lastOpenedAt).getTime() -
        new Date(a.lastOpenedAt).getTime()
    )
  return clone(sorted.slice(0, limit))
}

export async function getAssetDetail(
  assetId: string
): Promise<LearningAsset> {
  await delay()
  const asset = assets.find((a) => a.id === assetId && !a.isDeleted)
  if (!asset) throw new Error(`Asset ${assetId} not found`)
  asset.lastOpenedAt = new Date().toISOString()
  return clone(asset)
}

export interface StartUploadInput {
  title: string
  type: 'document' | 'video' | 'panopto'
  topicId: string | null
  studySetId?: string | null
  sourceLabel: string
  originalUrl: string
  durationMinutes?: number
  pages?: number
}

export async function startUpload(
  inputs: StartUploadInput[]
): Promise<LearningAsset[]> {
  await delay()
  const created: LearningAsset[] = inputs.map((input) => {
    const asset: LearningAsset = {
      id: nextId('asset'),
      title: input.title,
      type: input.type,
      topicId: input.topicId,
      studySetId: input.studySetId ?? null,
      addedAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
      processingStatus: 'pending',
      sourceLabel: input.sourceLabel,
      originalUrl: input.originalUrl,
      durationMinutes: input.durationMinutes,
      pages: input.pages,
      knowledgeTouchpoints: [],
      citations: [],
    }
    assets.push(asset)
    return asset
  })
  return clone(created)
}

export async function renameAsset(
  assetId: string,
  title: string
): Promise<LearningAsset> {
  await delay()
  const a = assets.find((x) => x.id === assetId)
  if (!a) throw new Error(`Asset ${assetId} not found`)
  a.title = title
  return clone(a)
}

export async function moveAsset(
  assetId: string,
  topicId: string | null
): Promise<LearningAsset> {
  await delay()
  const a = assets.find((x) => x.id === assetId)
  if (!a) throw new Error(`Asset ${assetId} not found`)
  a.topicId = topicId
  return clone(a)
}

export async function removeAsset(assetId: string): Promise<void> {
  await delay()
  const a = assets.find((x) => x.id === assetId)
  if (!a) throw new Error(`Asset ${assetId} not found`)
  a.isDeleted = true
}

export async function retryAssetProcessing(
  assetId: string
): Promise<LearningAsset> {
  await delay()
  const a = assets.find((x) => x.id === assetId)
  if (!a) throw new Error(`Asset ${assetId} not found`)
  a.processingStatus = 'processing'
  return clone(a)
}

/**
 * Advances processing status for one or all pending/processing assets.
 * pending -> processing -> ready (or failed if title contains "RNA Sequencing")
 */
export async function advanceProcessingStatus(
  assetId?: string
): Promise<LearningAsset[]> {
  await delay()
  const targets = assetId
    ? assets.filter((a) => a.id === assetId)
    : assets.filter(
        (a) =>
          a.processingStatus === 'pending' ||
          a.processingStatus === 'processing'
      )

  const advanced: LearningAsset[] = []

  for (const a of targets) {
    if (a.processingStatus === 'pending') {
      a.processingStatus = 'processing'
      advanced.push(a)
    } else if (a.processingStatus === 'processing') {
      if (a.title.includes('RNA Sequencing')) {
        a.processingStatus = 'failed'
      } else {
        a.processingStatus = 'ready'
        // Generate placeholder KTs if none exist
        if (a.knowledgeTouchpoints.length === 0) {
          const kts = generatePlaceholderKTs(a.id, a.title)
          a.knowledgeTouchpoints = kts.kts
          a.citations = kts.citations
        }
      }
      advanced.push(a)
    }
  }

  return clone(advanced)
}

function generatePlaceholderKTs(
  assetId: string,
  title: string
): { kts: KnowledgeTouchpoint[]; citations: Citation[] } {
  const kts: KnowledgeTouchpoint[] = []
  const cits: Citation[] = []
  const headings = [
    `Key concepts in ${title}`,
    `Methodology and approaches`,
    `Practical applications`,
  ]
  for (let i = 0; i < 3; i++) {
    const citId = nextId('cit')
    cits.push({
      id: citId,
      label: `[${i + 1}]`,
      snippet: `Reference material from ${title}, section ${i + 1}.`,
      page: i + 1,
      sourceAssetId: assetId,
    })
    kts.push({
      id: nextId('kt'),
      assetId,
      index: i,
      heading: headings[i],
      body: `This section covers the fundamental aspects of ${headings[i].toLowerCase()}. The material provides a thorough overview suitable for exam preparation and conceptual understanding.`,
      citationIds: [citId],
    })
  }
  return { kts, citations: cits }
}

/* ------------------------------------------------------------------ */
/*  Panopto Catalog                                                    */
/* ------------------------------------------------------------------ */

export async function searchPanopto(query: string): Promise<PanoptoVideo[]> {
  await delay()
  const q = query.toLowerCase()
  return clone(panoptoCatalog.filter((v) => v.title.toLowerCase().includes(q)))
}

export async function listRecentPanoptoVideos(): Promise<PanoptoVideo[]> {
  await delay()
  return clone(panoptoCatalog.slice(0, 5))
}

/* ------------------------------------------------------------------ */
/*  Study Sets                                                         */
/* ------------------------------------------------------------------ */

export async function createStudySet(
  topicId: string,
  name: string,
  assetIds: string[]
): Promise<StudySet> {
  await delay()
  const ss: StudySet = {
    id: nextId('studyset'),
    topicId,
    name,
    assetIds,
    createdAt: new Date().toISOString(),
  }
  studySets.push(ss)

  // Create synthesis asset
  const synthesisAsset = createSynthesisAsset(topicId, ss.id, name, assetIds)
  assets.push(synthesisAsset)
  ss.synthesisAssetId = synthesisAsset.id

  return clone(ss)
}

export async function updateStudySet(
  setId: string,
  assetIds: string[]
): Promise<StudySet> {
  await delay()
  const ss = studySets.find((s) => s.id === setId)
  if (!ss) throw new Error(`StudySet ${setId} not found`)
  ss.assetIds = assetIds

  // Regenerate synthesis asset
  if (ss.synthesisAssetId) {
    const old = assets.find((a) => a.id === ss.synthesisAssetId)
    if (old) old.isDeleted = true
  }
  const synthesisAsset = createSynthesisAsset(
    ss.topicId,
    ss.id,
    ss.name,
    assetIds
  )
  assets.push(synthesisAsset)
  ss.synthesisAssetId = synthesisAsset.id

  return clone(ss)
}

export async function renameStudySet(
  setId: string,
  name: string
): Promise<StudySet> {
  await delay()
  const ss = studySets.find((s) => s.id === setId)
  if (!ss) throw new Error(`StudySet ${setId} not found`)
  ss.name = name
  return clone(ss)
}

export async function deleteStudySet(setId: string): Promise<void> {
  await delay()
  const ss = studySets.find((s) => s.id === setId)
  if (!ss) throw new Error(`StudySet ${setId} not found`)
  ss.isDeleted = true
  // Also soft-delete synthesis asset
  if (ss.synthesisAssetId) {
    const syn = assets.find((a) => a.id === ss.synthesisAssetId)
    if (syn) syn.isDeleted = true
  }
}

export async function getStudySetDetail(
  setId: string
): Promise<{ studySet: StudySet; synthesisAsset: LearningAsset | null }> {
  await delay()
  const ss = studySets.find((s) => s.id === setId && !s.isDeleted)
  if (!ss) throw new Error(`StudySet ${setId} not found`)
  const synAsset = ss.synthesisAssetId
    ? assets.find((a) => a.id === ss.synthesisAssetId && !a.isDeleted) ?? null
    : null
  return { studySet: clone(ss), synthesisAsset: clone(synAsset) }
}

function createSynthesisAsset(
  topicId: string,
  studySetId: string,
  setName: string,
  assetIds: string[]
): LearningAsset {
  const id = nextId('asset-syn')
  const sourceAssets = assets.filter(
    (a) => assetIds.includes(a.id) && !a.isDeleted
  )
  const kts: KnowledgeTouchpoint[] = []
  const cits: Citation[] = []

  let ktIndex = 0
  for (const src of sourceAssets) {
    for (const kt of src.knowledgeTouchpoints.slice(0, 2)) {
      const citId = nextId('cit')
      cits.push({
        id: citId,
        label: `[${cits.length + 1}]`,
        snippet: `Synthesised from "${src.title}": ${kt.heading}`,
        sourceAssetId: src.id,
      })
      kts.push({
        id: nextId('kt'),
        assetId: id,
        index: ktIndex++,
        heading: `${kt.heading} (synthesised)`,
        body: `Drawing from "${src.title}", ${kt.body.slice(0, 150)}...`,
        citationIds: [citId],
      })
    }
  }

  return {
    id,
    title: `${setName} Synthesis`,
    type: 'document',
    topicId,
    studySetId,
    addedAt: new Date().toISOString(),
    lastOpenedAt: new Date().toISOString(),
    processingStatus: 'ready',
    sourceLabel: 'AI Synthesis',
    originalUrl: '',
    isSynthesis: true,
    sourceAssetIds: assetIds,
    knowledgeTouchpoints: kts,
    citations: cits,
  }
}

/* ------------------------------------------------------------------ */
/*  Flashcard Sets                                                     */
/* ------------------------------------------------------------------ */

export interface GenerateFlashcardOptions {
  count?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  name?: string
  ktIds?: string[]
}

export async function generateFlashcardSet(
  scope: GenerationScope,
  options: GenerateFlashcardOptions = {}
): Promise<FlashcardSet> {
  await delay(400 + Math.random() * 600)
  const count = options.count ?? 10
  const kts = resolveKTs(scope, options.ktIds)
  const title =
    options.name ?? buildDefaultName(scope, 'Flashcards')

  const cards: Flashcard[] = []
  for (let i = 0; i < count; i++) {
    const kt = kts[i % kts.length]
    cards.push({
      id: nextId('fc'),
      front: buildFlashcardFront(kt, i),
      back: buildFlashcardBack(kt, i),
      citationIds: kt.citationIds.slice(0, 1),
    })
  }

  const set: FlashcardSet = {
    id: nextId('fset'),
    scope,
    title,
    cards,
    createdAt: new Date().toISOString(),
    processingStatus: 'ready',
  }
  flashcardSets.push(set)

  // Link to KTs that were included in this generation
  if (scope.level === 'kt') {
    const asset = assets.find((a) => a.id === scope.assetId)
    const kt = asset?.knowledgeTouchpoints.find((k) => k.id === scope.ktId)
    if (kt) kt.flashcardSetId = set.id
  } else {
    for (const kt of kts) {
      if (!kt.flashcardSetId) kt.flashcardSetId = set.id
    }
  }

  return clone(set)
}

export async function regenerateFlashcardSet(
  setId: string,
  ktIds?: string[],
): Promise<FlashcardSet> {
  await delay(400 + Math.random() * 600)
  const existing = flashcardSets.find((s) => s.id === setId)
  if (!existing) throw new Error(`FlashcardSet ${setId} not found`)

  const kts = resolveKTs(existing.scope, ktIds)
  const newCards: Flashcard[] = existing.cards.map((_, i) => {
    const kt = kts[i % kts.length]
    return {
      id: nextId('fc'),
      front: buildFlashcardFront(kt, i + 100),
      back: buildFlashcardBack(kt, i + 100),
      citationIds: kt.citationIds.slice(0, 1),
    }
  })
  existing.cards = newCards
  existing.createdAt = new Date().toISOString()
  return clone(existing)
}

export async function getFlashcardSet(
  setId: string
): Promise<FlashcardSet> {
  await delay()
  const set = flashcardSets.find((s) => s.id === setId)
  if (!set) throw new Error(`FlashcardSet ${setId} not found`)
  return clone(set)
}

/* ------------------------------------------------------------------ */
/*  Quizzes                                                            */
/* ------------------------------------------------------------------ */

export interface GenerateQuizOptions {
  count?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  name?: string
  ktIds?: string[]
}

export async function generateQuiz(
  scope: GenerationScope,
  options: GenerateQuizOptions = {}
): Promise<Quiz> {
  await delay(400 + Math.random() * 600)
  const count = options.count ?? 10
  const kts = resolveKTs(scope, options.ktIds)
  const title = options.name ?? buildDefaultName(scope, 'Quiz')

  const questions: QuizQuestion[] = []
  for (let i = 0; i < count; i++) {
    const kt = kts[i % kts.length]
    questions.push(buildQuizQuestion(kt, i))
  }

  const quiz: Quiz = {
    id: nextId('quiz'),
    scope,
    title,
    questions,
    createdAt: new Date().toISOString(),
    processingStatus: 'ready',
  }
  quizzes.push(quiz)

  if (scope.level === 'kt') {
    const asset = assets.find((a) => a.id === scope.assetId)
    const kt = asset?.knowledgeTouchpoints.find((k) => k.id === scope.ktId)
    if (kt) kt.quizId = quiz.id
  } else {
    for (const kt of kts) {
      if (!kt.quizId) kt.quizId = quiz.id
    }
  }

  return clone(quiz)
}

export async function regenerateQuiz(quizId: string, ktIds?: string[]): Promise<Quiz> {
  await delay(400 + Math.random() * 600)
  const existing = quizzes.find((q) => q.id === quizId)
  if (!existing) throw new Error(`Quiz ${quizId} not found`)

  const kts = resolveKTs(existing.scope, ktIds)
  const newQuestions: QuizQuestion[] = existing.questions.map((_, i) => {
    const kt = kts[i % kts.length]
    return buildQuizQuestion(kt, i + 200)
  })
  existing.questions = newQuestions
  existing.createdAt = new Date().toISOString()
  return clone(existing)
}

export async function getQuiz(quizId: string): Promise<Quiz> {
  await delay()
  const quiz = quizzes.find((q) => q.id === quizId)
  if (!quiz) throw new Error(`Quiz ${quizId} not found`)
  return clone(quiz)
}

/* ------------------------------------------------------------------ */
/*  Mind Maps                                                          */
/* ------------------------------------------------------------------ */

export async function generateMindMap(
  scope: GenerationScope,
  options?: { name?: string; ktIds?: string[] }
): Promise<MindMap> {
  await delay(300 + Math.random() * 400)
  const kts = resolveKTs(scope, options?.ktIds)
  const title = options?.name ?? buildDefaultName(scope, 'Mind Map')

  const rootId = nextId('mn')
  const nodes: MindMapNode[] = [
    { id: rootId, label: title.replace(/ \u2014 Mind Map$/, ''), parentId: null },
  ]

  for (const kt of kts) {
    const branchId = nextId('mn')
    nodes.push({
      id: branchId,
      label: kt.heading,
      parentId: rootId,
      ktId: kt.id,
    })
    // Extract 2-3 key terms from body
    const keyTerms = extractKeyTerms(kt.body, 3)
    for (const term of keyTerms) {
      nodes.push({
        id: nextId('mn'),
        label: term,
        parentId: branchId,
      })
    }
  }

  const mm: MindMap = {
    id: nextId('mindmap'),
    scope,
    title,
    nodes,
    createdAt: new Date().toISOString(),
  }
  mindMaps.push(mm)

  if (scope.level === 'kt') {
    const asset = assets.find((a) => a.id === scope.assetId)
    const kt = asset?.knowledgeTouchpoints.find((k) => k.id === scope.ktId)
    if (kt) kt.mindmapId = mm.id
  } else {
    for (const kt of kts) {
      if (!kt.mindmapId) kt.mindmapId = mm.id
    }
  }

  return clone(mm)
}

export async function regenerateMindMap(
  mindmapId: string,
  ktIds?: string[],
): Promise<MindMap> {
  await delay(300 + Math.random() * 400)
  const existing = mindMaps.find((m) => m.id === mindmapId)
  if (!existing) throw new Error(`MindMap ${mindmapId} not found`)

  const kts = resolveKTs(existing.scope, ktIds)
  const rootId = nextId('mn')
  const nodes: MindMapNode[] = [
    {
      id: rootId,
      label: existing.title.replace(/ \u2014 Mind Map$/, ''),
      parentId: null,
    },
  ]

  for (const kt of kts) {
    const branchId = nextId('mn')
    nodes.push({
      id: branchId,
      label: kt.heading,
      parentId: rootId,
      ktId: kt.id,
    })
    const keyTerms = extractKeyTerms(kt.body, 3)
    for (const term of keyTerms) {
      nodes.push({ id: nextId('mn'), label: term, parentId: branchId })
    }
  }

  existing.nodes = nodes
  existing.createdAt = new Date().toISOString()
  return clone(existing)
}

export async function getMindMap(mindmapId: string): Promise<MindMap> {
  await delay()
  const mm = mindMaps.find((m) => m.id === mindmapId)
  if (!mm) throw new Error(`MindMap ${mindmapId} not found`)
  return clone(mm)
}

/* ------------------------------------------------------------------ */
/*  Sessions                                                           */
/* ------------------------------------------------------------------ */

export async function saveFlashcardSession(
  session: Omit<FlashcardSession, 'id'>
): Promise<FlashcardSession> {
  await delay()
  const full: FlashcardSession = { ...session, id: nextId('fs') }
  fcSessions.push(full)
  addRecentActivity({
    id: nextId('ra'),
    modalityType: 'flashcards',
    title:
      flashcardSets.find((s) => s.id === session.setId)?.title ?? 'Flashcards',
    score: session.accuracy,
    completedAt: session.completedAt,
    route: `/flashcards/${session.setId}/session`,
  })
  return clone(full)
}

export async function getFlashcardSessions(
  setId: string
): Promise<FlashcardSession[]> {
  await delay()
  return clone(fcSessions.filter((s) => s.setId === setId))
}

export async function saveQuizSession(
  session: Omit<QuizSession, 'id'>
): Promise<QuizSession> {
  await delay()
  const full: QuizSession = { ...session, id: nextId('qs') }
  qzSessions.push(full)
  // Clear localStorage progress
  try {
    localStorage.removeItem(`pla.quizProgress.${session.quizId}`)
  } catch {
    // localStorage may not be available in tests
  }
  addRecentActivity({
    id: nextId('ra'),
    modalityType: 'quiz',
    title: quizzes.find((q) => q.id === session.quizId)?.title ?? 'Quiz',
    score: session.score,
    completedAt: session.completedAt,
    route: `/quiz/${session.quizId}/session`,
  })
  return clone(full)
}

export async function getQuizSessions(
  quizId: string
): Promise<QuizSession[]> {
  await delay()
  return clone(qzSessions.filter((s) => s.quizId === quizId))
}

export async function getAllFlashcardSessions(
  setIds: string[]
): Promise<FlashcardSession[]> {
  await delay()
  const idSet = new Set(setIds)
  return clone(fcSessions.filter((s) => idSet.has(s.setId)))
}

export async function getAllQuizSessions(
  quizIds: string[]
): Promise<QuizSession[]> {
  await delay()
  const idSet = new Set(quizIds)
  return clone(qzSessions.filter((s) => idSet.has(s.quizId)))
}

export async function saveQuizProgress(
  quizId: string,
  partial: unknown
): Promise<void> {
  await delay()
  try {
    localStorage.setItem(
      `pla.quizProgress.${quizId}`,
      JSON.stringify(partial)
    )
  } catch {
    // noop
  }
}

export async function getQuizProgress(
  quizId: string
): Promise<unknown | null> {
  await delay()
  try {
    const raw = localStorage.getItem(`pla.quizProgress.${quizId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function addRecentActivity(item: RecentActivityItem): void {
  recentActivity.unshift(item)
  if (recentActivity.length > 20) recentActivity.length = 20
}

/* ------------------------------------------------------------------ */
/*  KPIs                                                               */
/* ------------------------------------------------------------------ */

export async function getDashboardKPIs(): Promise<DashboardKPI> {
  await delay()
  const activeTopics = topics.filter((t) => !t.archived)

  // Derive from KT performance records
  const allKtIds = assets
    .filter((a) => !a.isDeleted && !a.isSynthesis && a.processingStatus === 'ready')
    .flatMap((a) => a.knowledgeTouchpoints.map((kt) => kt.id))
  const derived = deriveKPIsFromPerformance(allKtIds)

  // Streak still uses session dates from performance records
  const allDates = allKtIds
    .map((id) => getKTPerformance(id))
    .flatMap((r) => [r.flashcardLastSeen, r.quizLastSeen])
    .filter(Boolean) as string[]

  return {
    totalTopics: activeTopics.length,
    overallAccuracy: derived.flashcardAccuracy,
    overallQuizBest: derived.quizBestScore,
    studyStreak: computeStreak(allDates),
    lastStudiedAt: derived.lastStudiedAt,
  }
}

export async function getTopicKPIs(topicId: string): Promise<TopicKPI> {
  await delay()
  const topicAssetIds = assets
    .filter((a) => a.topicId === topicId && !a.isDeleted)
    .map((a) => a.id)

  const ktIds = getKTsForTopic(topicId).map((kt) => kt.id)
  const derived = deriveKPIsFromPerformance(ktIds)

  const allDates = ktIds
    .map((id) => getKTPerformance(id))
    .flatMap((r) => [r.flashcardLastSeen, r.quizLastSeen])
    .filter(Boolean) as string[]

  return {
    assetCount: topicAssetIds.length,
    flashcardAccuracy: derived.flashcardAccuracy,
    quizBestScore: derived.quizBestScore,
    studyStreak: computeStreak(allDates),
    lastStudiedAt: derived.lastStudiedAt,
  }
}

export async function getAssetKPIs(assetId: string): Promise<AssetKPI> {
  await delay()
  const asset = assets.find((a) => a.id === assetId)
  const kts = asset?.knowledgeTouchpoints ?? []
  const ktIds = kts.map((k) => k.id)
  const derived = deriveKPIsFromPerformance(ktIds)

  const records = ktIds.map((id) => getKTPerformance(id))
  const fcSessionCount = records.reduce((sum, r) => sum + r.flashcardAttempts, 0)
  const qzAttemptCount = records.reduce((sum, r) => sum + r.quizAttempts, 0)

  return {
    flashcardAccuracy: derived.flashcardAccuracy,
    quizBestScore: derived.quizBestScore,
    quizAttempts: qzAttemptCount,
    flashcardSessions: Math.ceil(fcSessionCount / 10),
    lastStudiedAt: derived.lastStudiedAt,
    ktsTotal: kts.length,
    ktsWithFlashcards: records.filter((r) => r.flashcardAttempts > 0).length,
    ktsWithQuiz: records.filter((r) => r.quizAttempts > 0).length,
  }
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const daySet = new Set(
    dates.map((d) => new Date(d).toISOString().slice(0, 10))
  )
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const check = new Date(today)
    check.setDate(check.getDate() - i)
    const key = check.toISOString().slice(0, 10)
    if (daySet.has(key)) {
      streak++
    } else if (i === 0) {
      // Today has no activity — that's OK, check yesterday
      continue
    } else {
      break
    }
  }
  return streak
}

/* ------------------------------------------------------------------ */
/*  Recent Activity                                                    */
/* ------------------------------------------------------------------ */

export async function getRecentActivity(): Promise<RecentActivityItem[]> {
  await delay()
  return clone(recentActivity.slice(0, 5))
}

/* ------------------------------------------------------------------ */
/*  Translate / Export KTs                                              */
/* ------------------------------------------------------------------ */

export async function translateKTs(
  assetId: string,
  language: string
): Promise<KnowledgeTouchpoint[]> {
  await delay(300)
  const key = `${assetId}:${language}`

  // First attempt always fails
  if (!translationAttempted.has(key)) {
    translationAttempted.add(key)
    throw new Error(
      `Translation to ${language} failed. Please try again.`
    )
  }

  // Subsequent attempts succeed
  const asset = assets.find((a) => a.id === assetId)
  if (!asset) throw new Error(`Asset ${assetId} not found`)

  const translated = asset.knowledgeTouchpoints.map((kt) => ({
    ...kt,
    heading: `[${language}] ${kt.heading}`,
    body: `[Translated to ${language}] ${kt.body}`,
  }))

  return clone(translated)
}

export async function exportKTs(
  assetId: string,
  format: 'pdf' | 'md' | 'txt'
): Promise<Blob> {
  await delay(200)
  const asset = assets.find((a) => a.id === assetId)
  if (!asset) throw new Error(`Asset ${assetId} not found`)

  const content = asset.knowledgeTouchpoints
    .map((kt) => `## ${kt.heading}\n\n${kt.body}\n`)
    .join('\n')

  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    md: 'text/markdown',
    txt: 'text/plain',
  }

  return new Blob([content], { type: mimeTypes[format] })
}

/* ------------------------------------------------------------------ */
/*  Shared helpers for generation                                      */
/* ------------------------------------------------------------------ */

function resolveKTs(
  scope: GenerationScope,
  filterKtIds?: string[]
): KnowledgeTouchpoint[] {
  let kts: KnowledgeTouchpoint[] = []

  switch (scope.level) {
    case 'kt': {
      const asset = assets.find((a) => a.id === scope.assetId)
      const kt = asset?.knowledgeTouchpoints.find(
        (k) => k.id === scope.ktId
      )
      if (kt) kts = [kt]
      break
    }
    case 'asset': {
      const asset = assets.find((a) => a.id === scope.assetId)
      kts = asset?.knowledgeTouchpoints ?? []
      break
    }
    case 'studyset': {
      const ss = studySets.find((s) => s.id === scope.studySetId)
      if (ss?.synthesisAssetId) {
        const synAsset = assets.find((a) => a.id === ss.synthesisAssetId)
        kts = synAsset?.knowledgeTouchpoints ?? []
      }
      if (kts.length === 0 && ss) {
        // Fallback: gather KTs from referenced assets
        for (const aid of ss.assetIds) {
          const a = assets.find((x) => x.id === aid)
          if (a) kts.push(...a.knowledgeTouchpoints)
        }
      }
      break
    }
    case 'topic': {
      const topicAssets = assets.filter(
        (a) =>
          a.topicId === scope.topicId &&
          !a.isDeleted &&
          !a.isSynthesis &&
          a.processingStatus === 'ready'
      )
      for (const a of topicAssets) {
        kts.push(...a.knowledgeTouchpoints)
      }
      break
    }
  }

  if (filterKtIds && filterKtIds.length > 0) {
    // Allow KTs from any asset, not just scope-resolved ones.
    // This supports "additional content" picked outside the normal scope.
    const allKTs = assets.flatMap((a) => a.knowledgeTouchpoints)
    const idSet = new Set(filterKtIds)
    kts = allKTs.filter((k) => idSet.has(k.id))
  }

  // Guarantee at least one KT for generation
  if (kts.length === 0) {
    kts = [
      {
        id: 'kt-fallback',
        assetId: '',
        index: 0,
        heading: 'General concepts',
        body: 'This section covers foundational concepts related to the selected material.',
        citationIds: [],
      },
    ]
  }

  return kts
}

function buildDefaultName(
  scope: GenerationScope,
  modality: string
): string {
  switch (scope.level) {
    case 'kt': {
      const asset = assets.find((a) => a.id === scope.assetId)
      const kt = asset?.knowledgeTouchpoints.find(
        (k) => k.id === scope.ktId
      )
      return `${kt?.heading ?? 'Knowledge Touchpoint'} \u2014 ${modality}`
    }
    case 'asset': {
      const asset = assets.find((a) => a.id === scope.assetId)
      return `${asset?.title ?? 'Asset'} \u2014 ${modality}`
    }
    case 'studyset': {
      const ss = studySets.find((s) => s.id === scope.studySetId)
      return `${ss?.name ?? 'Study Set'} \u2014 ${modality}`
    }
    case 'topic': {
      const t = topics.find((x) => x.id === scope.topicId)
      return `${t?.name ?? 'Topic'} \u2014 ${modality}`
    }
  }
}

function buildFlashcardFront(
  kt: KnowledgeTouchpoint,
  index: number,
): string {
  const prefixes = [
    'What is the significance of',
    'Explain the concept of',
    'How does',
    'Describe the role of',
    'What are the key features of',
    'Why is',
    'Compare and contrast aspects of',
    'What mechanism underlies',
    'Define and explain',
    'In what context is',
  ]
  const words = kt.heading.toLowerCase()
  return `${prefixes[index % prefixes.length]} ${words}?`
}

function buildFlashcardBack(
  kt: KnowledgeTouchpoint,
  index: number
): string {
  // Use a portion of the body as the answer
  const sentences = kt.body.split('. ')
  const start = index % Math.max(1, sentences.length)
  return sentences.slice(start, start + 2).join('. ') + '.'
}

function buildQuizQuestion(
  kt: KnowledgeTouchpoint,
  index: number,
): QuizQuestion {
  const sentences = kt.body.split('. ')
  const stem = sentences[0] ?? kt.body
  const correctAnswer = sentences[1] ?? sentences[0] ?? kt.heading

  // Generate plausible distractors
  const distractors = [
    `This process is unrelated to ${kt.heading.toLowerCase()}.`,
    `The opposite mechanism occurs: inhibition rather than activation.`,
    `Only prokaryotic organisms exhibit this behaviour.`,
  ]

  // Shuffle deterministically based on index
  const correctIndex = index % 4
  const shuffled = [...distractors]
  shuffled.splice(correctIndex, 0, correctAnswer)

  return {
    id: nextId('qq'),
    questionText: `Based on "${kt.heading}", which of the following statements is most accurate?`,
    options: shuffled.slice(0, 4),
    correctIndex,
    explanation: `${stem}. This is supported by the material covering ${kt.heading.toLowerCase()}.`,
    citationIds: kt.citationIds.slice(0, 1),
  }
}

/* ------------------------------------------------------------------ */
/*  Adaptive generation (single KT → single card/question)             */
/* ------------------------------------------------------------------ */

export function generateFlashcardFromKT(
  kt: KnowledgeTouchpoint,
  attemptNumber: number,
): Flashcard {
  const words = kt.heading.toLowerCase()
  let front: string
  let back: string
  const sentences = kt.body.split('. ')

  switch (attemptNumber % 4) {
    case 0: // definition
      front = `What is ${words}?`
      back = sentences.slice(0, 2).join('. ') + '.'
      break
    case 1: // application
      front = `How would you apply ${words} in a real-world scenario?`
      back = `${sentences[0]}. In practice, this means understanding how ${words} influences outcomes and processes.`
      break
    case 2: // comparison
      front = `How does ${words} differ from related concepts?`
      back = `${sentences.slice(0, 2).join('. ')}. The distinguishing feature is the specific mechanism described in this touchpoint.`
      break
    default: // synthesis
      front = `Give an example of ${words} in context.`
      back = `For instance, ${sentences[sentences.length - 1] ?? sentences[0]} This illustrates the core principle of ${words}.`
      break
  }

  return {
    id: nextId('fc'),
    front,
    back,
    citationIds: kt.citationIds.slice(0, 1),
  }
}

export function generateQuizQuestionFromKT(
  kt: KnowledgeTouchpoint,
  attemptNumber: number,
): QuizQuestion {
  const sentences = kt.body.split('. ')
  const stem = sentences[0] ?? kt.body
  const correctAnswer = sentences[1] ?? sentences[0] ?? kt.heading

  const distractorSets = [
    [
      `This process is unrelated to ${kt.heading.toLowerCase()}.`,
      `The opposite mechanism occurs: inhibition rather than activation.`,
      `Only prokaryotic organisms exhibit this behaviour.`,
    ],
    [
      `This concept applies exclusively to inorganic systems.`,
      `The described effect is negligible in most conditions.`,
      `This mechanism has been fully disproven by recent research.`,
    ],
    [
      `The reverse process is what actually occurs in vivo.`,
      `This only happens during early embryonic development.`,
      `External factors have no influence on this process.`,
    ],
    [
      `This pathway requires no energy input whatsoever.`,
      `The concept is a historical artifact with no modern relevance.`,
      `Only plant cells demonstrate this characteristic.`,
    ],
  ]

  const distractors = distractorSets[attemptNumber % distractorSets.length]
  const correctIndex = attemptNumber % 4

  const questionPrefixes = [
    `Based on "${kt.heading}", which of the following statements is most accurate?`,
    `Regarding ${kt.heading.toLowerCase()}, which statement best describes the concept?`,
    `Which of the following correctly explains an aspect of ${kt.heading.toLowerCase()}?`,
    `When considering ${kt.heading.toLowerCase()}, which is true?`,
  ]

  const shuffled = [...distractors]
  shuffled.splice(correctIndex, 0, correctAnswer)

  return {
    id: nextId('qq'),
    questionText: questionPrefixes[attemptNumber % questionPrefixes.length],
    options: shuffled.slice(0, 4),
    correctIndex,
    explanation: `${stem}. This is supported by the material covering ${kt.heading.toLowerCase()}.`,
    citationIds: kt.citationIds.slice(0, 1),
  }
}

/**
 * Given a list of asset IDs, returns all KTs from those assets.
 */
export function getKTsForAssets(assetIds: string[]): KnowledgeTouchpoint[] {
  const idSet = new Set(assetIds)
  return assets
    .filter((a) => idSet.has(a.id) && !a.isDeleted && a.processingStatus === 'ready')
    .flatMap((a) => a.knowledgeTouchpoints)
}

/**
 * Given a topic ID, returns all KTs from non-deleted, ready assets in the topic.
 */
export function getKTsForTopic(topicId: string): KnowledgeTouchpoint[] {
  return assets
    .filter(
      (a) =>
        a.topicId === topicId &&
        !a.isDeleted &&
        !a.isSynthesis &&
        a.processingStatus === 'ready',
    )
    .flatMap((a) => a.knowledgeTouchpoints)
}

/**
 * Given a study set ID, returns all KTs from its assets.
 */
export function getKTsForStudySet(studySetId: string): KnowledgeTouchpoint[] {
  const ss = studySets.find((s) => s.id === studySetId && !s.isDeleted)
  if (!ss) return []
  return getKTsForAssets(ss.assetIds)
}

/**
 * Get all assets for a topic (non-deleted, non-synthesis, ready).
 */
export function getTopicAssets(topicId: string): LearningAsset[] {
  return clone(
    assets.filter(
      (a) =>
        a.topicId === topicId &&
        !a.isDeleted &&
        !a.isSynthesis &&
        a.processingStatus === 'ready',
    ),
  )
}

/**
 * Get all assets for a study set.
 */
export function getStudySetAssets(studySetId: string): LearningAsset[] {
  const ss = studySets.find((s) => s.id === studySetId && !s.isDeleted)
  if (!ss) return []
  return clone(
    assets.filter((a) => ss.assetIds.includes(a.id) && !a.isDeleted),
  )
}

/**
 * Derive KPI values from KT performance records instead of saved sessions.
 */
export function deriveKPIsFromPerformance(ktIds: string[]): {
  flashcardAccuracy: number | null
  quizBestScore: number | null
  lastStudiedAt: string | null
  sessionCount: number
} {
  const records = ktIds.map((id) => getKTPerformance(id))
  const withFc = records.filter((r) => r.flashcardAttempts > 0)
  const withQz = records.filter((r) => r.quizAttempts > 0)

  const flashcardAccuracy =
    withFc.length > 0
      ? Math.round(
          (withFc.reduce((acc, r) => acc + r.flashcardCorrect / r.flashcardAttempts, 0) /
            withFc.length) *
            100,
        )
      : null

  const quizAccuracies = withQz.map((r) => r.quizCorrect / r.quizAttempts)
  const quizBestScore =
    quizAccuracies.length > 0 ? Math.round(Math.max(...quizAccuracies) * 100) : null

  const allDates = records
    .flatMap((r) => [r.flashcardLastSeen, r.quizLastSeen])
    .filter(Boolean) as string[]
  const lastStudiedAt = allDates.length > 0 ? allDates.sort().reverse()[0] : null

  const totalSessions = records.reduce(
    (sum, r) => sum + r.flashcardAttempts + r.quizAttempts,
    0,
  )
  const sessionCount = Math.ceil(totalSessions / 10)

  return { flashcardAccuracy, quizBestScore, lastStudiedAt, sessionCount }
}

function extractKeyTerms(body: string, count: number): string[] {
  // Simple extraction: pick capitalised multi-word terms or long words
  const candidates = body
    .replace(/[.,;:()]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 6 && w[0] === w[0])

  const unique = [...new Set(candidates)]
  const selected: string[] = []
  for (let i = 0; i < Math.min(count, unique.length); i++) {
    selected.push(unique[i])
  }

  // Fallback
  while (selected.length < count) {
    selected.push(`Concept ${selected.length + 1}`)
  }

  return selected
}

/* ------------------------------------------------------------------ */
/*  List modalities (for topic/asset/studyset pages)                   */
/* ------------------------------------------------------------------ */

export async function listFlashcardSets(
  scope?: Partial<GenerationScope>
): Promise<FlashcardSet[]> {
  await delay()
  if (!scope) return clone(flashcardSets)
  return clone(
    flashcardSets.filter((s) => matchesScope(s.scope, scope))
  )
}

export async function listQuizzes(
  scope?: Partial<GenerationScope>
): Promise<Quiz[]> {
  await delay()
  if (!scope) return clone(quizzes)
  return clone(quizzes.filter((q) => matchesScope(q.scope, scope)))
}

export async function listMindMaps(
  scope?: Partial<GenerationScope>
): Promise<MindMap[]> {
  await delay()
  if (!scope) return clone(mindMaps)
  return clone(mindMaps.filter((m) => matchesScope(m.scope, scope)))
}

/** Returns true if the scope belongs to a given topic (any level). */
function scopeBelongsToTopic(scope: GenerationScope, topicId: string): boolean {
  if (scope.level === 'topic' && scope.topicId === topicId) return true
  if (scope.level === 'studyset' && scope.topicId === topicId) return true
  if (scope.level === 'asset') {
    const a = assets.find((x) => x.id === scope.assetId)
    return a?.topicId === topicId
  }
  if (scope.level === 'kt') {
    const a = assets.find((x) => x.id === scope.assetId)
    return a?.topicId === topicId
  }
  return false
}

export async function listAllFlashcardSetsForTopic(
  topicId: string
): Promise<FlashcardSet[]> {
  await delay()
  return clone(flashcardSets.filter((s) => scopeBelongsToTopic(s.scope, topicId)))
}

export async function listAllQuizzesForTopic(
  topicId: string
): Promise<Quiz[]> {
  await delay()
  return clone(quizzes.filter((q) => scopeBelongsToTopic(q.scope, topicId)))
}

export async function listAllMindMapsForTopic(
  topicId: string
): Promise<MindMap[]> {
  await delay()
  return clone(mindMaps.filter((m) => scopeBelongsToTopic(m.scope, topicId)))
}

function matchesScope(
  actual: GenerationScope,
  filter: Partial<GenerationScope>
): boolean {
  if (filter.level && actual.level !== filter.level) return false
  if ('assetId' in filter && 'assetId' in actual) {
    if (filter.assetId && actual.assetId !== filter.assetId) return false
  }
  if ('topicId' in filter && 'topicId' in actual) {
    if (
      (filter as { topicId?: string }).topicId &&
      (actual as { topicId?: string }).topicId !==
        (filter as { topicId?: string }).topicId
    )
      return false
  }
  if ('studySetId' in filter && 'studySetId' in actual) {
    if (
      (filter as { studySetId?: string }).studySetId &&
      (actual as { studySetId?: string }).studySetId !==
        (filter as { studySetId?: string }).studySetId
    )
      return false
  }
  return true
}
