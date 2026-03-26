# Implementation Guide: Adaptive Smart Study System

## Overview

Replace the current static flashcard/quiz generation model with an **adaptive, session-based study system**. Study modality CTAs (Flashcards, Quiz, Mind Map) are always present at every level. Clicking any of them immediately starts a session — no generation step, no save step, no library of saved sets. Every session is bespoke, generated on the fly based on the student's history.

This guide covers:
1. The adaptive session model
2. The "keep going" loop
3. KT performance tracking
4. Adaptive weighting algorithm
5. Mind map V1 with review highlighting
6. What to remove from the current build

---

## Core Principles

- **No saved sets.** Flashcard sets and quizzes are not saved artifacts. There is nothing to name, store, or recall. The CTAs always just say "Flashcards", "Quiz", "Mind Map" — not "Generate" or "Study".
- **Always 10 items to start.** Every session opens with exactly 10 cards or questions, selected adaptively from the available KTs in scope. No configuration modal.
- **Infinite "keep going" loop.** At the end of every session, the student is asked if they want to keep going. Saying yes generates another 10 items, smarter than the last batch.
- **Same concept, new phrasing.** Weak KTs don't get shown the same card again — the system generates a freshly worded card from the same KT, approaching it from a different angle.
- **Session history is the source of truth.** All adaptation is based on accumulated session history stored in localStorage.

---

## Part 1 — KT Performance Tracking

### Data model

Every KT gets a performance record maintained in localStorage:

```typescript
interface KTPerformanceRecord {
  ktId: string;
  assetId: string;

  // Flashcard history
  flashcardAttempts: number;        // total times shown as a flashcard
  flashcardCorrect: number;         // times marked "Got it"
  flashcardLastSeen: string | null; // ISO date

  // Quiz history
  quizAttempts: number;
  quizCorrect: number;
  quizLastSeen: string | null;

  // Confidence (from end-of-session check-in, 1-5)
  lastConfidenceRating: number | null;

  // Computed
  needsReview: boolean; // true if accuracy < 70% OR confidence <= 2
}
```

### localStorage key

```typescript
`pla.ktPerformance.v3.${ktId}`
```

### Utility: `src/utils/ktPerformance.ts`

```typescript
export function getKTPerformance(ktId: string): KTPerformanceRecord
export function updateKTPerformance(ktId: string, result: {
  modality: 'flashcard' | 'quiz';
  correct: boolean;
  confidenceRating?: number;
}): void
export function getKTWeight(record: KTPerformanceRecord, modality: 'flashcard' | 'quiz'): number
export function needsReview(record: KTPerformanceRecord): boolean
```

### Weight calculation

`getKTWeight()` returns a number 1-10. Higher weight = more likely to be selected.

```typescript
export function getKTWeight(record: KTPerformanceRecord, modality: 'flashcard' | 'quiz'): number {
  const attempts = modality === 'flashcard' ? record.flashcardAttempts : record.quizAttempts;
  const correct  = modality === 'flashcard' ? record.flashcardCorrect  : record.quizCorrect;
  const lastSeen = modality === 'flashcard' ? record.flashcardLastSeen : record.quizLastSeen;

  // Never seen: highest weight
  if (attempts === 0) return 10;

  const accuracy = correct / attempts; // 0.0-1.0

  // Days since last seen (recency decay)
  const daysSince = lastSeen
    ? (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  // Base weight from accuracy (inverted - lower accuracy = higher weight)
  let weight = Math.round((1 - accuracy) * 8) + 1; // 1-9

  // Boost for low confidence
  if (record.lastConfidenceRating !== null && record.lastConfidenceRating <= 2) {
    weight = Math.min(weight + 2, 10);
  }

  // Boost for not seen in a while (spaced repetition)
  if (daysSince > 3) weight = Math.min(weight + 1, 10);
  if (daysSince > 7) weight = Math.min(weight + 1, 10);

  return weight;
}
```

### `needsReview()` — used by mind map highlighting

```typescript
export function needsReview(record: KTPerformanceRecord): boolean {
  if (record.flashcardAttempts === 0 && record.quizAttempts === 0) return false;
  const totalAttempts = record.flashcardAttempts + record.quizAttempts;
  const totalCorrect  = record.flashcardCorrect  + record.quizCorrect;
  const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
  return accuracy < 0.70 || (record.lastConfidenceRating !== null && record.lastConfidenceRating <= 2);
}
```

---

## Part 2 — Adaptive Session Selection

### `src/utils/adaptiveSelection.ts`

```typescript
/**
 * Selects `count` KT IDs from the available pool, weighted by performance.
 * Uses weighted random sampling without replacement.
 */
export function selectAdaptiveKTs(
  availableKtIds: string[],
  modality: 'flashcard' | 'quiz',
  count: number,
  excludeKtIds: string[] = []  // KTs shown in this session already (for "keep going")
): string[] {
  const pool = availableKtIds.filter(id => !excludeKtIds.includes(id));

  // If pool is smaller than count, allow repeats from already-seen KTs
  const source = pool.length >= count ? pool : [...pool, ...excludeKtIds];

  const weighted = source.map(id => ({
    id,
    weight: getKTWeight(getKTPerformance(id), modality)
  }));

  const selected: string[] = [];
  const remaining = [...weighted];

  while (selected.length < count && remaining.length > 0) {
    const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < remaining.length; i++) {
      rand -= remaining[i].weight;
      if (rand <= 0) {
        selected.push(remaining[i].id);
        remaining.splice(i, 1);
        break;
      }
    }
  }

  return selected;
}
```

---

## Part 3 — Session Flow

### Flashcard session

**Entry:** Student clicks "Flashcards" at any level (Folio, Study Set, Learning Material, KT).

**Step 1 — Content picker (Folio and Study Set level only)**

At the Folio and Study Set level, clicking Flashcards or Quiz opens a lightweight pre-session picker before starting:

- Title: "What do you want to study?" + scope name (e.g. "Molecular Genetics")
- Lists all Learning Materials in scope as checkboxes — all checked by default
- "Start" button (primary, disabled if nothing checked)
- "Select all" / "Deselect all" toggle link
- No card count, no difficulty, no other options — just material selection
- If the learner hits Start without changing anything: full adaptive pool across all materials (identical behavior to auto-start)
- If the learner deselects some materials: KT pool is scoped to only the checked materials

At the **Learning Material and KT level**: skip the picker entirely — start immediately. Scope is already narrow and implied.

**Step 2 — Adaptive start**
- Determine the KT pool from selected scope
- Call `selectAdaptiveKTs(pool, 'flashcard', 10)`
- For each selected KT, call `generateFlashcardFromKT(kt, attemptNumber)` where `attemptNumber` = `record.flashcardAttempts` for that KT
- Navigate to flashcard session page immediately — no loading screen needed in prototype (mock delay is acceptable)

**Step 2 — Session (unchanged interaction)**
- Card flip, Got it / Missed it, progress bar (Card 1 of 10)
- After each card: call `updateKTPerformance(ktId, { modality: 'flashcard', correct })`

**Step 3 — Results screen**
- Accuracy gauge
- Missed KTs list (show KT heading, not card front/back)
- Confidence check-in (1-5) — applies to the whole batch
- On confidence submit: call `updateKTPerformance` for all KTs in this batch with the confidence rating

**Step 4 — "Keep going?" (replaces current end CTAs)**

```
You studied 10 concepts.    72% accuracy

[ Keep going — 10 more ]        [ I'm done for now ]
```

- **"Keep going"**: calls `selectAdaptiveKTs(pool, 'flashcard', 10, alreadySeenKtIds)` where `alreadySeenKtIds` is the running list of all KTs seen across all rounds in this sitting. Starts the next 10-card batch immediately. Progress bar resets. A small muted counter shows total studied this sitting: "30 concepts studied this session".
- **"I'm done for now"**: navigates back to originating page.

The loop is infinite. As the pool exhausts, previously seen KTs are eligible again, prioritized by lowest accuracy in this sitting. Since cards are freshly generated, the student gets new phrasing rather than the same card repeated.

---

### Quiz session

Identical adaptive model. Same content picker at Folio and Study Set level (all materials checked by default). Immediate start at Learning Material and KT level. Questions generated fresh per KT via `generateQuizQuestionFromKT(kt, attemptNumber)`.

End screen: same "Keep going / I'm done" pattern.

---

## Part 4 — Mock API additions

### `generateFlashcardFromKT(kt: KnowledgeTouchpoint, attemptNumber: number): Flashcard`

Returns a flashcard with phrasing that varies by attempt number:
- Attempt 0: definition — "What is [key concept]?"
- Attempt 1: application — "How would you apply [concept] to...?"
- Attempt 2: comparison — "How does [X] differ from [Y]?"
- Attempt 3+: synthesis — "Give an example of [concept] in context."

This gives the impression the system is genuinely generating fresh content per session.

### `generateQuizQuestionFromKT(kt: KnowledgeTouchpoint, attemptNumber: number): QuizQuestion`

Same principle — question type and phrasing vary with attempt number. Options are reshuffled.

---

## Part 5 — Mind Map V1 with Review Highlighting

Mind maps remain **static** in V1 — always show all KTs in scope, no adaptive selection.

**New behaviour:** KT nodes where `needsReview()` returns `true` are visually flagged.

**Node styling:**
- Default node: white background, `#E8E8E8` border
- Needs review node: `#FEF3C7` background, `#F59E0B` border, small `⚠` indicator
- Legend at bottom of mind map: `⚠ Needs more practice` in muted small text
- KTs with no study history at all: no flag (can't need review if never studied)

---

## Part 6 — What to Remove

### Data model — remove entirely:
- `FlashcardSet` interface and all instances
- `Quiz` interface as a saved artifact
- `regenerateFlashcardSet()`, `regenerateQuiz()` mock API functions
- `getFlashcardSet()`, `saveFlashcardSession()`, `getFlashcardSessions()`
- `getQuiz()`, `saveQuizSession()`, `getQuizSessions()`
- `saveQuizProgress()` / `getQuizProgress()` localStorage resume pattern

### UI — remove:
- **Flashcards** and **Quizzes** filter chips on the Topic/Folio page — no saved artifacts to filter
- "Regenerate" button anywhere
- Any saved sets library view or list
- Session history lists showing named saved sets
- The generation modal (KT selection, card count, difficulty) — replaced by immediate adaptive start

### Keep:
- **Mind Maps** filter chip and Mind Map as a saved artifact
- **Study Sets** filter chip
- KPI cards (Flashcard accuracy, Quiz best score, Sessions, Last studied) — these now derive from KT performance records
- Confidence check-in and reflection prompt on results screens
- Session count KPI (each 10-card batch = 1 session for display purposes)

---

## Part 7 — Updated KPI Derivation

KPI values now computed from `KTPerformanceRecord` objects rather than saved set sessions:

```typescript
// Flashcard accuracy for a scope (e.g. a Folio)
const flashcardAccuracy = ktIds
  .map(id => getKTPerformance(id))
  .filter(r => r.flashcardAttempts > 0)
  .reduce((acc, r, _, arr) =>
    acc + (r.flashcardCorrect / r.flashcardAttempts) / arr.length, 0);

// Sessions: count of completed 10-card batches (track separately in localStorage)
// `pla.sessionCount.v3.${scopeId}` — increment by 1 each time "Keep going" completes or "I'm done" is tapped

// Last studied: max of all ktLastSeen values in scope
const lastStudied = ktIds
  .map(id => getKTPerformance(id))
  .map(r => r.flashcardLastSeen ?? r.quizLastSeen)
  .filter(Boolean)
  .sort()
  .at(-1) ?? null;
```

---

## Acceptance Criteria

- [ ] Clicking "Flashcards" or "Quiz" at the Folio or Study Set level opens a content picker first
- [ ] Content picker lists all Learning Materials with checkboxes, all checked by default
- [ ] "Start" button is disabled when nothing is checked
- [ ] "Select all" / "Deselect all" toggle available
- [ ] Starting with all materials checked produces identical behavior to auto-start
- [ ] KT pool is scoped to only the checked materials when some are deselected
- [ ] Clicking "Flashcards" or "Quiz" at the Learning Material or KT level starts immediately with no picker
- [ ] Cards are weighted by KT performance — never-seen KTs have highest priority
- [ ] Low accuracy KTs are weighted higher than high accuracy KTs
- [ ] Low confidence KTs get an additional weight boost
- [ ] Cards are freshly generated with phrasing that varies by how many times the KT has been seen
- [ ] Results screen shows "Keep going — 10 more" and "I'm done for now"
- [ ] "Keep going" generates another 10 adaptive items, deprioritizing already-seen KTs
- [ ] Running total of concepts studied this sitting is shown during keep-going sessions
- [ ] KT performance records update after every card result, not just end of session
- [ ] Confidence rating is applied to all KTs in the batch
- [ ] Quiz session follows the identical adaptive pattern
- [ ] Mind map nodes flagged by `needsReview()` render with amber highlight and warning indicator
- [ ] Mind map shows legend when flagged nodes exist
- [ ] KTs with no study history are not flagged on the mind map
- [ ] Flashcards and Quizzes filter chips removed from Folio page
- [ ] FlashcardSet and Quiz saved artifact entities removed from data model and mock API
- [ ] KPI cards derive values from KT performance records
- [ ] No TypeScript errors (strict mode)
