import { useState, useRef, useEffect } from 'react'
import { Layers, ClipboardCheck, Network, Lightbulb } from 'lucide-react'
import type { KnowledgeTouchpoint, Citation } from '../../types/domain'
import { Button } from '../ui/Button'

const COLLAPSED_HEIGHT = 96 // ~4.5 lines — enough to show faded next sentence

interface KnowledgeTouchpointCardProps {
  kt: KnowledgeTouchpoint
  citations: Citation[]
  onCitationClick?: (citation: Citation) => void
  onGenerateFlashcards?: (ktId: string) => void
  onGenerateQuiz?: (ktId: string) => void
  onGenerateMindMap?: (ktId: string) => void
  onStudyFlashcards?: (setId: string) => void
  onTakeQuiz?: (quizId: string) => void
  onViewMindMap?: (mindmapId: string) => void
}

export function KnowledgeTouchpointCard({
  kt,
  citations,
  onCitationClick,
  onGenerateFlashcards,
  onGenerateQuiz,
  onGenerateMindMap,
  onStudyFlashcards,
  onTakeQuiz,
  onViewMindMap,
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
        {kt.flashcardSetId ? (
          <Button
            variant="success"
            size="sm"
            leftIcon={<Layers className="h-4 w-4 text-status-ready" />}
            onClick={() => onStudyFlashcards?.(kt.flashcardSetId!)}
          >
            Study flashcards
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Layers className="h-4 w-4" />}
            onClick={() => onGenerateFlashcards?.(kt.id)}
          >
            Generate flashcards
          </Button>
        )}

        {kt.quizId ? (
          <Button
            variant="success"
            size="sm"
            leftIcon={<ClipboardCheck className="h-4 w-4 text-status-ready" />}
            onClick={() => onTakeQuiz?.(kt.quizId!)}
          >
            Take quiz
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ClipboardCheck className="h-4 w-4" />}
            onClick={() => onGenerateQuiz?.(kt.id)}
          >
            Generate quiz
          </Button>
        )}

        {kt.mindmapId ? (
          <Button
            variant="success"
            size="sm"
            leftIcon={<Network className="h-4 w-4 text-status-ready" />}
            onClick={() => onViewMindMap?.(kt.mindmapId!)}
          >
            View mind map
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Network className="h-4 w-4" />}
            onClick={() => onGenerateMindMap?.(kt.id)}
          >
            Generate mind map
          </Button>
        )}
      </div>
    </article>
  )
}
