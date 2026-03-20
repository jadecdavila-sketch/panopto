# Panopto Learning Assistant — V3 Feature Specification

## What You're Building

The **Panopto Learning Assistant** is a web-based, student-facing learning tool that helps students study more effectively from their course materials. Students upload or import Learning Assets (PDFs, videos, Panopto recordings) into Topics. The app generates AI-powered summaries broken into Knowledge Touchpoints — bite-sized, citable segments of the material. From those, students generate study modalities: Flashcards, Quizzes, and Mind Maps. Study Sets let students group multiple assets and generate study modalities across them as a unit.

This is a **frontend-only prototype** — all data is mocked. There is no real backend. The purpose is to demonstrate the full user experience to stakeholders with realistic interactions and data.

**Client:** Panopto Inc.
**Contractor:** Unosquare
**Engagement:** Fixed-price, 11-week SOW

---

## Tech Stack

- **React 18** with TypeScript (strict mode)
- **Vite** as build tool
- **Tailwind CSS** for styling
- **React Router v6** for routing
- **Vitest + React Testing Library** for tests

---

## Vocabulary

| Term | Definition |
|------|-----------|
| **Knowledge Touchpoint (KT)** | A single AI-generated segment of a Learning Asset's summary. 2–4 sentences, with citations linking to the source. The atomic unit of study. |
| **Learning Asset** | A resource uploaded or imported by the student — a PDF, video, or Panopto recording. Contains Knowledge Touchpoints. |
| **Study Set** | A named group of Learning Assets within a Topic. AI can summarize a Study Set into Knowledge Touchpoints just like a single asset. Study modalities can be generated at the Study Set level. |
| **Topic** | The top-level container. Equivalent to a course or subject. Contains Learning Assets and Study Sets. |
| **Study Modality** | Any generated study tool: Flashcards, Quiz, or Mind Map. Can be created at the Topic, Study Set, or Learning Asset level. |

---

## Core Mental Model

**Learning Assets are the primary content container.** A student adds a Learning Asset to a Topic. The app processes it and generates Knowledge Touchpoints — AI-summarized segments with citations. From those KTs, students generate study modalities.

**Study Sets are a grouping layer.** A Study Set is a named collection of Learning Assets inside a Topic. The AI synthesizes a Study Set into Knowledge Touchpoints just like a single asset. Study modalities created from a Study Set draw on all assets in it.

**Study modalities are fractal.** Flashcards, Quizzes, and Mind Maps can be generated at any level:

| Level | Knowledge Touchpoints | Flashcards | Quiz | Mind Map |
|-------|-----------------------|------------|------|----------|
| **Knowledge Touchpoint** | *Is* the KT itself | Generate from this KT | Generate from this KT | Generate from this KT |
| **Learning Asset** | Auto-generated on upload | From selected KTs | From selected KTs | From selected KTs |
| **Study Set** | Auto-generated from all assets in set | From set's KTs | From set's KTs | From set's KTs |
| **Topic** | None — no KTs displayed at topic level | Generated from assets in topic | Generated from assets in topic | Generated from assets in topic |

**KPIs cascade upward:** KT → Learning Asset → Study Set → Topic → Dashboard.

---

## Information Architecture

```
Dashboard
├── [Empty state: welcome + 2 graphical CTAs]
└── [Active state: KPIs + Hot Topics + Recent Activity]

Library
├── All Topics
└── All Learning Assets (flat view)

Topic  ← no Knowledge Touchpoints at this level
├── Learning Assets (card view, toggleable to list)
├── Study Sets (named groups of assets within the topic)
└── Study Modalities (flashcards/quizzes/mind maps generated from topic's assets)

Learning Asset
├── Knowledge Touchpoints (AI summary segments)
│   └── Study Modalities per KT
└── Study Modalities (for all or selected KTs)

Study Set
├── Knowledge Touchpoints (synthesized across all assets in set)
└── Study Modalities (for all or selected KTs)
```

---

## Navigation

**Two tabs only:**
- **Dashboard** — home, KPIs, Hot Topics, Recent Activity
- **Library** — all Topics and Learning Assets

No other top-level navigation. No onboarding flow.

**Shell:**
- Header: Panopto logo (left) · Global search (center) · `+ New` button (right) · User avatar (right)
- Desktop: left sidebar with Dashboard and Library
- Mobile: bottom tab bar with Dashboard and Library

**`+ New` dropdown (context-aware):**
- **Topic** — always shown; opens Topic creation dialog
- **Learning Asset** — always shown; opens Add Learning Asset modal (Panopto tab default)
- **Study Set** — shown only on Topic pages; opens Study Set creation dialog scoped to current topic

> **Placement principle:** All `+ New` buttons and creation actions are anchored at the top of their context — never at the bottom of a list.

---

## Feature Specifications

---

### 1. Dashboard

**Route:** `/`
**No onboarding flow.** The dashboard adapts based on whether the student has any data.

---

#### Empty State (first login / no data)

Shown when the student has no Topics or Learning Assets yet.

- Panopto logo at top
- Welcome headline — e.g. "Welcome to Panopto Learning Assistant"
- Value prop — 1–2 sentences: what the product does and why it matters
- Two large graphical CTAs — not standard buttons. Think card-sized clickable areas with an illustration or icon, a label, and a short description:

  **Add a Topic**
  Icon: folder or collection visual
  Description: "Organize your learning by subject or course"
  Action: Opens Topic creation dialog

  **Add a Learning Asset**
  Icon: upload or document visual
  Description: "Import a Panopto video or upload a file to get started"
  Action: Opens Add Learning Asset modal

- These two CTAs should be visually prominent and feel like a designed entry point, not afterthoughts. Use the mint tint `#F1FDF8` background with green accents.

---

#### Active State (student has data)

**KPI strip** — 3 stat cards across the top:
- Study streak (consecutive days with any activity)
- Overall flashcard accuracy %
- Overall quiz best score %

No Knowledge Touchpoints are shown on the Dashboard at any point.

**Hot Topics** — grid of Topic cards:
- Topic name
- Asset count
- Flashcard accuracy % or "No activity yet"
- Quiz best score % or "No activity yet"
- Last studied date or "Not started"
- Clicking → Topic page

**Recent Activity** — last 5 study sessions:
- Modality type icon + asset/set title + score/accuracy + time ago
- Clicking → the relevant modality session or result

---

### 2. Library

**Route:** `/library`

Two sections, each independently browseable:

**Topics section**
- List or grid of all active topics
- Each topic card: name, asset count, last activity
- Click → Topic page
- Archived topics accessible via toggle

**Learning Assets section**
- Search bar at top (filters by title and topic name)
- Desktop: sortable table (Title, Topic, Type, Date Added, Last Accessed, Status)
- Mobile: card grid
- Filters: Type (Document / Video / Panopto), Topic, Status (Pending / Processing / Ready / Failed)
- Sort: Title A–Z/Z–A · Date added · Last accessed
- Preferences persisted: `pla.libraryPrefs.v3`
- Click item → Learning Asset detail page
- ⋯ menu: Rename, Move to topic, Delete

---

### 3. Topic Page

**Route:** `/topics/:topicId`

The primary organizational surface. A Topic contains Learning Assets, Study Sets, and topic-level study modalities.

**Header**
- Back link → Library or Dashboard
- Topic name (h1)
- Topic KPIs (once any activity exists): Assets · Flashcard accuracy · Quiz best score · Streak · Last studied
- `+ New` button (context-aware: shows Topic/Learning Asset/Study Set options)
- Archived banner if applicable

**View toggle:** Card view (default) ↔ List view

**Filter chips:** All · Assets · Study Sets · Flashcards · Quizzes · Mind Maps
- Rendered as small selectable pill chips, not tabs — sit inline above the content grid
- "All" selected by default
- Selecting a chip filters the card/list view to that content type
- Only one chip active at a time

**Learning Asset cards** (card view)
- Type icon + left accent strip (amber=document, sky=video, green=panopto)
- Title (→ Learning Asset page)
- Processing status badge if not ready
- KPI line if studied: "Flashcards: 72% · Quiz: 65% · Last studied 2d ago"
- KPI line if not studied: "Not studied yet — ready when you are."
- ⋯ menu: Rename, Move, Add to Study Set, Delete

**Study Set cards**
- Layers icon + "Study Set" label
- Name (→ Study Set page)
- Asset count ("3 learning assets")
- KPI line if studied
- ⋯ menu: Rename, Edit assets, Delete

**Topic-level study modality generation**
- Prominent section or panel: "Study this entire topic"
- Three CTA buttons: "Generate flashcards" · "Generate quiz" · "Generate mind map"
- Each opens a generation modal listing all ready Learning Assets in the topic — student selects which assets to include
- No Knowledge Touchpoints are shown or selectable at the topic level — asset is the lowest granularity of selection here
- Generated modalities appear in the relevant tab (Flashcards / Quizzes / Mind Maps)

---

### 4. Learning Asset Page

**Route:** `/assets/:assetId`

**Header card**
- Type icon + badge + processing status badge
- Title (h1) · Source label
- Asset KPIs if studied; "Start studying below" if not
- "Show original" toggle (collapsed by default on desktop)

**Layout**
- Desktop: single panel by default (KTs only). "Show original" expands right panel.
- Mobile: tabs — Summary · Original

**Processing states**
- pending/processing: skeleton KT cards + "Generating your Knowledge Touchpoints…"
- failed: InlineError + retry

**Study modality generation** (above KT list)
- "Generate flashcards" · "Generate quiz" · "Generate mind map"
- All open the generation modal with all KTs pre-selected
- Disabled if asset not ready

**Knowledge Touchpoint cards**
```
┌─────────────────────────────────────────┐
│ Heading                                 │
│ Body (2–4 sentences)                    │
│ [1] Page 3    [2] Timestamp 3:25        │
│                                         │
│ 📚 [Generate flashcards]                │  → [Study] once generated
│ 📝 [Generate quiz]                      │  → [Take] once generated
│ 🗺️ [Generate mind map]                  │  → [View] once generated
└─────────────────────────────────────────┘
```
- Citation chips → jump original viewer to source location
- Once generated, CTAs change: flashcards → "Study", quiz → "Take", mind map → "View" — each links to the full-screen session or viewer

**Original Viewer panel** (right / Original tab)
- Document: page navigation, placeholder page content
- Video: native `<video>`, jump-to-timestamp on citation click
- Panopto: embedded iframe, "Open in Panopto" link

**AI Chat FAB**
- Bottom-right, available when asset is ready
- Slide-in panel, Q&A grounded in KT content, mock responses

---

### 5. Study Set Page

**Route:** `/topics/:topicId/study-sets/:setId`

A Study Set is a named collection of Learning Assets within a Topic, treated by the AI as a unified resource with synthesized Knowledge Touchpoints.

**Header**
- Back link → Topic page
- Study Set name (h1)
- Set KPIs if studied

**Learning Assets panel (expandable, collapsed by default)**
- A collapsed row showing "N Learning Assets" with an expand toggle
- Expanded: shows a full asset card for each asset in the set — same card design as Topic page
- Each asset card is clickable → navigates to that Learning Asset page for asset-level study
- Assets are **references, not copies** — they live at the Topic level and are shared by reference here. Renaming, updating, or deleting an asset at the Topic level is immediately reflected in all Study Sets that reference it. An asset can belong to multiple Study Sets within a topic without duplication. Session history and KPIs are unified — studying an asset from within a Study Set page contributes to the same stats as studying it directly from the Topic page.
- "Edit assets" button at the bottom of the expanded panel — opens a checklist of all Topic assets to add/remove from the set. Saving re-triggers synthesis KT generation.

**Knowledge Touchpoints section**
- Auto-generated synthesis KTs across all referenced assets in the set
- Same KT card design as Learning Asset page
- If any referenced assets are still processing: "Some assets are still processing — KTs will update when ready."

**Study modality generation**
- "Generate flashcards" · "Generate quiz" · "Generate mind map" — same pattern as asset level
- Scoped to this study set's synthesized KTs

---

### 6. Generation Modal

Shared modal used across all levels (KT, Asset, Study Set, Topic). The title and pre-selection state change based on entry point.

**Entry points and pre-selection:**
| Entry point | KT selection shown? | Behaviour |
|-------------|-------------------|-----------|
| Single KT "Generate" button | No — skip KT selection step entirely | That KT is implied; modal opens directly to name + options |
| Asset bulk "Generate" buttons | Yes | All KTs pre-selected, student can deselect |
| Study Set "Generate" buttons | Yes | All KTs across all assets in set pre-selected |
| Topic "Generate" buttons | No — asset selection instead | All assets pre-selected, student selects which assets to include |

**Modal content:**

```
Generate Flashcards  [or Quiz / Mind Map]
Scope: [Asset title / Study Set name / Topic name]

Select Knowledge Touchpoints:
[✓] Regulatory architecture
[✓] Negative and positive control
[ ] Experimental implications

Number of cards   [10 ▼]  (5–50, step 5)   ← flashcards only
Number of questions [10 ▼] (5–30, step 5)  ← quiz only
Difficulty        ○ Easy  ● Medium  ○ Hard  ← flashcards + quiz
Name              [smart default, editable ]

                    [Generate]
```

**Smart name defaults** — pre-filled based on scope and modality type, always editable:

| Entry point | Modality | Default name |
|-------------|----------|--------------|
| KT: "Regulatory architecture" | Flashcards | "Regulatory architecture — Flashcards" |
| KT: "Regulatory architecture" | Quiz | "Regulatory architecture — Quiz" |
| KT: "Regulatory architecture" | Mind Map | "Regulatory architecture — Mind Map" |
| Asset: "Gene Expression Notes" | Flashcards | "Gene Expression Notes — Flashcards" |
| Asset: "Gene Expression Notes" | Quiz | "Gene Expression Notes — Quiz" |
| Study Set: "Week 3 Materials" | Flashcards | "Week 3 Materials — Flashcards" |
| Topic: "Molecular Genetics" | Flashcards | "Molecular Genetics — Flashcards" |

Pattern: . Learner can edit before generating or rename afterwards.

- Minimum 1 KT must remain selected
- Mind Map modal: KT selection (same as flashcards/quiz) + name. No card count or difficulty.
- On success: modal closes, modality appears in relevant section and the triggering CTA changes to "Study" (flashcards), "Take" (quiz), or "View" (mind map)
- On error: InlineError inline, modal stays open

---

### 7. Add Learning Asset Modal

**Trigger:** `+ New` → "Learning Asset" from any page.

**Shell:** Centered, max-width 672px, border-radius 24px, Escape closes.

**Tab bar:** `Panopto` (default) | `Upload`

**Panopto tab (default)**
- Search input (300ms debounce, min 2 chars); below threshold shows recent videos
- Video list: title, duration, recorded date — **multi-select** with checkboxes; each row is independently selectable
- Selected videos shown as a count badge: "3 selected"
- Topic selector + Study Set selector (optional, shown when topic selected)
- "Add" button — adds all selected videos as separate Learning Assets

**Upload tab**
- Drag-and-drop zone
- Accepted: PDF, DOCX, PPTX, TXT, MD, MP4, MOV, WEBM
- Size limits: 25MB documents, 500MB video
- Multi-file queue with remove buttons
- Topic selector + Study Set selector (optional)
- "Add" button — success auto-closes after 1.5s

**Processing:** `pending → processing → ready` (or `failed`). 6-second polling. Assets with "RNA Sequencing" in the title always fail — intentional for demo.

---

### 8. Flashcard Session

**Route:** `/assets/:assetId/flashcards/:setId` or `/study-sets/:setId/flashcards/:setId` or `/topics/:topicId/flashcards/:setId`
**Full-screen, no shell.**

- Pre-session: study all or random subset, shuffled
- Card flip: tap or Space/Enter to reveal answer
- Self-grade: Got it ✓ / Missed it ✗
- Progress bar: Card N of M
- End Session button → confirmation dialog

**Results screen**
- Accuracy gauge (circular)
- Correct/incorrect breakdown
- Missed cards list (expandable, shows front + back)
- Comparison to previous session
- Confidence check-in: 1–5 rating (skippable)
- Reflection prompt: appears for ratings 3–5
- CTAs: "Study again" · "Regenerate set" · "Back"
  - "Regenerate set": confirmation → `regenerateFlashcardSet(setId)` → navigate to new set. Session history preserved.

- Session saved via `saveFlashcardSession()`
- Keyboard: Space/Enter flip · K/→ correct · J/← missed · Escape end (confirmation)
- `prefers-reduced-motion`: disable flip animation

---

### 9. Quiz Session

**Route:** `/assets/:assetId/quiz/:quizId` or `/study-sets/:setId/quiz/:quizId` or `/topics/:topicId/quiz/:quizId`
**Full-screen, no shell.**

- Resume prompt if in-progress session exists in localStorage
- One question at a time, multiple choice (4 options)
- Immediate feedback: correct/incorrect highlight + explanation + citation chip
- Running elapsed timer in header
- Progress: Question N of M + answered/unanswered count
- Auto-save after each answer (`pla.quizProgress.${quizId}`)

**Results screen**
- Score % (large) + time taken
- Comparison to best previous score
- Question breakdown accordion
- Confidence check-in (1–5, skippable)
- Reflection prompt for ratings 3–5
- CTAs: "Retake" (reshuffles existing) · "Regenerate quiz" · "Back"
  - "Regenerate quiz": confirmation → `regenerateQuiz(quizId)`. History preserved.

- Session saved via `saveQuizSession()`; clears localStorage progress
- Keyboard: 1–4 select · Enter/→ next · Escape end (confirmation)

---

### 10. Mind Map

Mind Maps are a study modality generated from Knowledge Touchpoints. In this prototype, render a simplified visual representation — a central node (asset/set/topic title) with KT headings as branch nodes radiating outward, and key terms from KT bodies as leaf nodes.

**Route:** `/assets/:assetId/mindmap/:mindmapId` etc.
**Full-screen or embedded panel — TBD by designer.**

- Central node: title of the generating scope (asset, study set, or topic name)
- Branch nodes: KT headings
- Leaf nodes: 2–3 key terms extracted from each KT body
- Pan and zoom (mouse/touch)
- Click a node → shows the full KT body in a side panel
- Export as PNG (mock — show a download success message)
- "Regenerate" → same confirmation pattern as flashcards/quiz

Mock implementation: generate a deterministic tree structure from KT data. No third-party mind map library required for prototype — SVG or a simple canvas render is acceptable.

---

## Data Model

```typescript
type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed';
type AssetType = 'document' | 'video' | 'panopto';
type ModalityType = 'flashcards' | 'quiz' | 'mindmap';

// The scope that generated a study modality
type GenerationScope =
  | { level: 'kt'; ktId: string; assetId: string }
  | { level: 'asset'; assetId: string }
  | { level: 'studyset'; studySetId: string; topicId: string }
  | { level: 'topic'; topicId: string };

interface Citation {
  id: string;
  label: string;           // "[1]"
  snippet: string;
  page?: number;
  timestampSec?: number;
  sourceAssetId?: string;  // for study set / topic KTs
}

interface KnowledgeTouchpoint {
  id: string;
  assetId: string;         // parent asset (or synthesis asset for set/topic KTs)
  index: number;
  heading: string;
  body: string;            // 2–4 sentences
  citationIds: string[];
  flashcardSetId?: string; // set once generated at KT level
  quizId?: string;
}

interface LearningAsset {
  id: string;
  title: string;
  type: AssetType;
  topicId: string | null;
  studySetId?: string | null;
  addedAt: string;
  lastOpenedAt: string;
  processingStatus: ProcessingStatus;
  sourceLabel: string;
  originalUrl: string;
  durationMinutes?: number;
  pages?: number;
  knowledgeTouchpoints: KnowledgeTouchpoint[];
  citations: Citation[];
  isSynthesis?: boolean;         // true for study set / topic synthesis assets
  sourceAssetIds?: string[];     // populated for synthesis assets
  isDeleted?: boolean;
}

interface StudySet {
  id: string;
  topicId: string;
  name: string;
  assetIds: string[];            // references to LearningAsset ids — not copies. Assets live at Topic level.
  createdAt: string;
  synthesisAssetId?: string;     // the one piece of content owned exclusively by this Study Set — the AI synthesis asset generated from all referenced assets
  isDeleted?: boolean;
}

interface Topic {
  id: string;
  name: string;
  archived: boolean;
  createdAt: string;
}

interface FlashcardSet {
  id: string;
  scope: GenerationScope;
  title: string;
  cards: Flashcard[];
  createdAt: string;
  processingStatus: ProcessingStatus;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  citationIds: string[];
}

interface Quiz {
  id: string;
  scope: GenerationScope;
  title: string;
  questions: QuizQuestion[];
  createdAt: string;
  processingStatus: ProcessingStatus;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  citationIds: string[];
}

interface MindMap {
  id: string;
  scope: GenerationScope;
  title: string;
  nodes: MindMapNode[];
  createdAt: string;
}

interface MindMapNode {
  id: string;
  label: string;
  parentId: string | null;   // null = root node
  ktId?: string;             // links branch node to source KT
}

interface TopicKPI {
  assetCount: number;
  flashcardAccuracy: number | null;
  quizBestScore: number | null;
  studyStreak: number;
  lastStudiedAt: string | null;
}

interface AssetKPI {
  flashcardAccuracy: number | null;
  quizBestScore: number | null;
  quizAttempts: number;
  flashcardSessions: number;
  lastStudiedAt: string | null;
  ktsTotal: number;
  ktsWithFlashcards: number;
  ktsWithQuiz: number;
}

interface DashboardKPI {
  totalTopics: number;
  overallAccuracy: number | null;
  studyStreak: number;
  lastStudiedAt: string | null;
}

interface FlashcardSession {
  id: string;
  setId: string;
  scope: GenerationScope;
  completedAt: string;
  accuracy: number;
  cardResults: { cardId: string; correct: boolean }[];
  confidenceRating?: number;
  reflection?: string;
}

interface QuizSession {
  id: string;
  quizId: string;
  scope: GenerationScope;
  completedAt: string;
  score: number;
  timeTakenSec: number;
  questionResults: { questionId: string; selectedIndex: number; correct: boolean }[];
  confidenceRating?: number;
  reflection?: string;
}
```

---

## Mock API

All data simulated in `src/services/mockApi.ts`. Artificial delays 120–380ms. Deep copies prevent mutation.

| Function | Description |
|----------|-------------|
| `listTopics()` | All topics |
| `createTopic(name)` | Returns created topic |
| `renameTopic(topicId, name)` | |
| `archiveTopic(topicId)` | |
| `unarchiveTopic(topicId)` | |
| `getTopicDetail(topicId)` | Topic + assets + study sets |
| `listAssets(topicId?)` | All non-deleted assets, optionally scoped |
| `listRecentAssets(limit?)` | Sorted by lastOpenedAt |
| `getAssetDetail(assetId)` | Full asset with KTs + citations |
| `startUpload(inputs[])` | Creates pending assets |
| `renameAsset(assetId, title)` | |
| `moveAsset(assetId, topicId)` | |
| `removeAsset(assetId)` | Soft-delete |
| `retryAssetProcessing(assetId)` | Resets to processing |
| `advanceProcessingStatus(assetId?)` | pending→processing→ready (RNA Sequencing→failed) |
| `searchPanopto(query)` | Filtered mock Panopto catalog |
| `listRecentPanoptoVideos()` | Recently watched |
| `createStudySet(topicId, name, assetIds)` | Creates set + triggers synthesis asset generation |
| `updateStudySet(setId, assetIds)` | Add/remove assets, re-triggers synthesis |
| `renameStudySet(setId, name)` | |
| `deleteStudySet(setId)` | Soft-delete |
| `getStudySetDetail(setId)` | Set + synthesis asset |
| `generateFlashcardSet(scope, options)` | Creates FlashcardSet for given scope |
| `regenerateFlashcardSet(setId)` | Replaces cards, keeps history |
| `generateQuiz(scope, options)` | Creates Quiz |
| `regenerateQuiz(quizId)` | Replaces questions, keeps history |
| `generateMindMap(scope)` | Creates MindMap from KTs |
| `regenerateMindMap(mindmapId)` | |
| `getFlashcardSet(setId)` | |
| `getQuiz(quizId)` | |
| `getMindMap(mindmapId)` | |
| `saveFlashcardSession(session)` | |
| `getFlashcardSessions(setId)` | |
| `saveQuizSession(session)` | |
| `getQuizSessions(quizId)` | |
| `saveQuizProgress(quizId, partial)` | |
| `getQuizProgress(quizId)` | Returns null if none |
| `getDashboardKPIs()` | |
| `getTopicKPIs(topicId)` | |
| `getAssetKPIs(assetId)` | |
| `translateKTs(assetId, language)` | First attempt fails (error/retry demo), cached on success |
| `exportKTs(assetId, format)` | PDF/MD/TXT blob payload |

### Mock data requirements

- **Topics:** 3 active, 1 archived
- **Learning Assets:** Mix of document/video/panopto. Include: 1 ready document (4+ KTs), 1 ready Panopto video (3+ KTs), 1 processing, 1 failed (title must contain "RNA Sequencing"), 1 synthesis asset from a Study Set
- **Study Sets:** At least 1 with 2+ assets and a generated synthesis asset
- **Flashcard sets and quizzes:** 2+ at asset level with session history, 1 at study set level
- **Sessions:** Enough to populate KPIs at all levels
- **Mind Maps:** At least 1 mock mind map with node structure

---

## Routes Summary

| Route | Page |
|-------|------|
| `/` | Dashboard |
| `/library` | Library |
| `/topics/:topicId` | Topic page |
| `/topics/:topicId/study-sets/:setId` | Study Set page |
| `/assets/:assetId` | Learning Asset page |
| `/flashcards/:setId/session` | Flashcard Session (full-screen) |
| `/quiz/:quizId/session` | Quiz Session (full-screen) |
| `/mindmap/:mindmapId` | Mind Map (full-screen or panel) |

---

## Cross-Cutting Capabilities

| Capability | Spec |
|-----------|------|
| **Responsive** | Mobile-first. Bottom tab nav <768px, left sidebar ≥768px |
| **Skeletons** | Shimmer placeholders on all async fetches |
| **Inline errors** | `<InlineError message onRetry />` throughout |
| **Confirm dialogs** | All destructive actions and regenerations |
| **Soft delete** | `isDeleted` on assets, study sets |
| **Processing pipeline** | 6s polling, pending→processing→ready/failed |
| **Persisted prefs** | Library: `pla.libraryPrefs.v3` · Quiz progress: `pla.quizProgress.${quizId}` |
| **Accessibility** | Semantic HTML, ARIA, focus traps, keyboard nav, `prefers-reduced-motion`. WCAG 2.1 AA. |
| **Auth** | Out of scope. Hardcoded "YK" avatar. |

---

## Design System

### Brand

Panopto brand as foundation. Student-facing — warmer and more energizing than the corporate marketing site. All values extracted from [panopto.com](https://www.panopto.com).

### Colors

```css
--color-primary:        #2AC271;  /* CTA buttons, active states */
--color-primary-hover:  #24A860;
--color-primary-tint:   #F1FDF8;  /* mint — backgrounds, selected states, empty state */
--color-forest:         #004232;  /* dark sections, active nav, modal headers */
--color-forest-mid:     #066349;  /* links, secondary interactive */
--color-text-primary:   #1A1A1A;
--color-text-secondary: #6B6B6B;
--color-text-disabled:  #A0A0A0;
--color-background:     #FFFFFF;
--color-surface:        #F5F5F5;
--color-border:         #E8E8E8;
--color-border-strong:  #D0D0D0;

/* Status */
--color-pending:     #F59E0B;
--color-processing:  #38BDF8;
--color-ready:       #2AC271;
--color-failed:      #F87171;

/* Asset type accents (left border strips) */
--color-document:   #F59E0B;
--color-video:      #38BDF8;
--color-panopto:    #2AC271;
--color-synthesis:  #F97316;
```

### Typography

**Font:** `"Inter Tight", sans-serif`
```html
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

| Size | Weight | Usage |
|------|--------|-------|
| 48px | 300 | Display / empty state headline |
| 30px | 300 | Page titles |
| 24px | 600–700 | Modal titles, section headings |
| 20px | 600 | Card headings, KT headings |
| 16px | 400 | Body |
| 14px | 400 | Labels, metadata |
| 12px | 400–500 | Badges, chips |

### Borders & Radius

```css
--radius-sm:   8px;
--radius-md:   12px;    /* buttons */
--radius-lg:   16px;    /* cards */
--radius-xl:   24px;    /* modals */
--radius-full: 9999px;  /* pill CTAs */
```

### Buttons

| Variant | Style |
|---------|-------|
| Primary | bg `#2AC271`, text `#1A1A1A`, pill, weight 600. hover: `#24A860` |
| Secondary | transparent, border `#E8E8E8`, pill. hover: bg `#F5F5F5` |
| Ghost | transparent, text `#6B6B6B`. hover: bg `#F5F5F5` |
| Danger | bg `#F87171`, white text, pill |

### Component Patterns

**Asset type badges:**
- Document: bg `#FEF3C7`, text `#92400E`
- Video: bg `#E0F2FE`, text `#0369A1`
- Panopto: bg `#DCFCE7`, text `#166534`
- Synthesis: bg `#FFEDD5`, text `#9A3412`

**Status badges:** colored dot + label. Processing dot pulses.

**KPI stat cards:** white bg, 16px radius, `#E8E8E8` border. Large number in `#2AC271`, label in secondary.

**Skeletons:** shimmer gradient `#F5F5F5 → #EBEBEB → #F5F5F5`, 1.5s loop.

**Tab bars:** `#F5F5F5` container, white active tab with card shadow and `#2AC271` text.

**Modals:** `rgba(0,0,0,0.2)` backdrop. Large: `max-width 672px`. Mobile: full-width bottom sheet.

### Personality

- **Empty states:** encouraging, not clinical. "Nothing here yet — let's change that."
- **Empty Dashboard CTAs:** large graphical card areas with illustration/icon, not plain buttons. Use mint tint background.
- **Celebration:** brief success moment before results screen.
- **Zero KPIs:** show "—" with "Start studying to see your progress" — never blank.
- **Color confidence:** use mint `#F1FDF8` generously, forest `#004232` for authority moments.

### Motion

```css
--ease-out-cubic:   cubic-bezier(0.215, 0.61, 0.355, 1);
--ease-out-quart:   cubic-bezier(0.165, 0.84, 0.44, 1);
--ease-in-out-quad: cubic-bezier(0.455, 0.03, 0.515, 0.955);
```
Durations: 150ms micro · 250ms short · 300ms modal. Always implement `prefers-reduced-motion`.

---

## Suggested File Structure

```
src/
├── assets/
│   └── panopto-logo.svg
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── DropdownMenu.tsx
│   │   ├── EmptyState.tsx
│   │   ├── GraphicCTA.tsx        ← new: large graphical CTA for empty dashboard
│   │   ├── InlineError.tsx
│   │   ├── Modal.tsx
│   │   ├── RenameDialog.tsx
│   │   ├── Skeleton.tsx
│   │   └── Tabs.tsx
│   ├── asset/
│   │   ├── AddAssetModal.tsx
│   │   ├── AddAssetPanoptoTab.tsx
│   │   ├── AddAssetUploadTab.tsx
│   │   ├── AssetCard.tsx
│   │   ├── KnowledgeTouchpointCard.tsx
│   │   ├── GenerationModal.tsx
│   │   └── OriginalViewer.tsx
│   ├── study/
│   │   ├── FlashcardCard.tsx
│   │   ├── ConfidenceCheckIn.tsx
│   │   ├── ReflectionPrompt.tsx
│   │   └── MindMapViewer.tsx
│   ├── dashboard/
│   │   ├── KPICard.tsx
│   │   └── TopicCard.tsx
│   └── chat/
│       ├── AiChatFab.tsx
│       └── AiChatPanel.tsx
├── context/
│   └── AppContext.tsx
├── data/
│   ├── mockData.ts
│   ├── mockModalities.ts
│   └── mockSessions.ts
├── hooks/
│   ├── useMediaQuery.ts
│   └── useAiChat.ts
├── pages/
│   ├── DashboardPage.tsx
│   ├── LibraryPage.tsx
│   ├── TopicPage.tsx
│   ├── StudySetPage.tsx
│   ├── AssetPage.tsx
│   ├── FlashcardSessionPage.tsx
│   ├── QuizSessionPage.tsx
│   └── MindMapPage.tsx
├── services/
│   └── mockApi.ts
├── types/
│   └── domain.ts
└── utils/
    ├── date.ts
    ├── id.ts
    └── storage.ts
```

---

## Out of Scope — Do Not Build

- Real backend, database, or API calls
- Authentication or login screen
- Onboarding flow
- LTI integration
- Native mobile apps
- Instructor or admin screens
- Offline support or service workers
- Real PDF rendering (placeholder content only)
- Drag-and-drop organization
- Accessibility certification or VPAT
- Third-party mind map library (use SVG or canvas)
