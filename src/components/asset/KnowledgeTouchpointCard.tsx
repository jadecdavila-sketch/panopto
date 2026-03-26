import { useState, useRef, useEffect, useCallback } from 'react'
import { Layers, ClipboardCheck, Network, Lightbulb, PenLine } from 'lucide-react'
import type { KnowledgeTouchpoint, Citation } from '../../types/domain'
import { Button } from '../ui/Button'
import { getNote, saveNote, hasNote } from '../../utils/notes'

const COLLAPSED_HEIGHT = 96 // ~4.5 lines — enough to show faded next sentence

interface KnowledgeTouchpointCardProps {
  kt: KnowledgeTouchpoint
  citations: Citation[]
  onCitationClick?: (citation: Citation) => void
  onGenerateFlashcards?: (ktId: string) => void
  onGenerateQuiz?: (ktId: string) => void
  onGenerateMindMap?: (ktId: string) => void
}

export function KnowledgeTouchpointCard({
  kt,
  citations,
  onCitationClick,
  onGenerateFlashcards,
  onGenerateQuiz,
  onGenerateMindMap,
}: KnowledgeTouchpointCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [needsTruncation, setNeedsTruncation] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bodyRef.current) {
      setNeedsTruncation(bodyRef.current.scrollHeight > COLLAPSED_HEIGHT + 8)
    }
  }, [kt.body])

  const ktCitations = citations.filter((c) => kt.citationIds.includes(c.id))

  function formatLocation(citation: Citation): string {
    if (citation.page != null) return `Page ${citation.page}`
    if (citation.timestampSec != null) {
      const m = Math.floor(citation.timestampSec / 60)
      const s = citation.timestampSec % 60
      return `${m}:${String(s).padStart(2, '0')}`
    }
    return ''
  }

  return (
    <article className="rounded-lg border border-border bg-background p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="flex items-center gap-2 text-[20px] font-semibold text-text-primary leading-snug">
          <Lightbulb className="h-5 w-5 shrink-0 text-text-secondary" />
          {kt.heading}
        </h3>

        {/* Citation chips */}
        {ktCitations.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2 shrink-0" role="list" aria-label="Citations">
            {ktCitations.map((citation) => {
              const location = formatLocation(citation)
              return (
                <button
                  key={citation.id}
                  role="listitem"
                  type="button"
                  onClick={() => onCitationClick?.(citation)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label={`Citation ${citation.label}${location ? `, ${location}` : ''}`}
                >
                  <span className="font-medium">{citation.label}</span>
                  {location && <span>{location}</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Body with expand/collapse */}
      <div
        className="relative mt-2 cursor-pointer"
        onClick={() => needsTruncation && setExpanded((v) => !v)}
        role={needsTruncation ? 'button' : undefined}
        tabIndex={needsTruncation ? 0 : undefined}
        onKeyDown={needsTruncation ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((v) => !v) } } : undefined}
        aria-expanded={needsTruncation ? expanded : undefined}
        aria-label={needsTruncation ? (expanded ? 'Collapse text' : 'Expand text') : undefined}
      >
        <div
          ref={bodyRef}
          className="text-sm text-text-secondary leading-relaxed overflow-hidden transition-[max-height] duration-200 ease-out"
          style={{ maxHeight: expanded || !needsTruncation ? '2000px' : `${COLLAPSED_HEIGHT}px` }}
        >
          {kt.body}
        </div>
        {needsTruncation && !expanded && (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background via-background/80 to-transparent"
            aria-hidden="true"
          />
        )}
      </div>

      {/* CTA buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Layers className="h-4 w-4" />}
          onClick={() => onGenerateFlashcards?.(kt.id)}
        >
          Flashcards
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ClipboardCheck className="h-4 w-4" />}
          onClick={() => onGenerateQuiz?.(kt.id)}
        >
          Quiz
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Network className="h-4 w-4" />}
          onClick={() => onGenerateMindMap?.(kt.id)}
        >
          Mind Map
        </Button>
      </div>

      {/* Inline note annotation */}
      <div className="mt-2">
        <KTNote ktId={kt.id} />
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/*  KT Inline Note                                                     */
/* ------------------------------------------------------------------ */

const NOTE_DEBOUNCE_MS = 500

function KTNote({ ktId }: { ktId: string }) {
  const [noteText, setNoteText] = useState(() => getNote('kt', ktId))
  const [editing, setEditing] = useState(false)
  const [noteExists, setNoteExists] = useState(() => hasNote('kt', ktId))
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleSave = useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        saveNote('kt', ktId, value)
        setNoteExists(value.trim() !== '')
      }, NOTE_DEBOUNCE_MS)
    },
    [ktId],
  )

  function handleChange(value: string) {
    setNoteText(value)
    scheduleSave(value)
  }

  function openEditor() {
    setEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function closeEditor() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    saveNote('kt', ktId, noteText)
    setNoteExists(noteText.trim() !== '')
    setEditing(false)
  }

  // No note, not editing — show "Add note" link
  if (!noteExists && !editing) {
    return (
      <button
        type="button"
        onClick={openEditor}
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-text-disabled hover:text-text-secondary transition-colors"
      >
        <PenLine className="h-4 w-4" />
        Add note
      </button>
    )
  }

  // Note exists but not editing — show preview
  if (noteExists && !editing) {
    return (
      <div className="mt-3 border-t border-border pt-3">
        <button
          type="button"
          onClick={openEditor}
          className="flex w-full items-start gap-2 text-left"
        >
          <PenLine className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="flex-1 truncate text-sm text-text-secondary">{noteText}</p>
        </button>
      </div>
    )
  }

  // Editing state
  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-sm text-text-secondary">
          <PenLine className="h-4 w-4" />
          Note
        </span>
        <button
          type="button"
          onClick={closeEditor}
          className="text-sm text-text-disabled hover:text-text-secondary"
          aria-label="Close note editor"
        >
          Done
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={noteText}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Your thoughts on this…"
        className="w-full rounded-lg border-none bg-[#FAFAFA] px-3 py-2 text-[13px] leading-relaxed text-text-secondary outline-none placeholder:text-text-disabled"
        style={{ minHeight: 64, maxHeight: 200, resize: 'none' }}
      />
    </div>
  )
}
