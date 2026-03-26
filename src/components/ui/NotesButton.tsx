import { useState, useCallback } from 'react'
import { PenLine } from 'lucide-react'
import { NotesModal } from './NotesModal'
import { hasNote, type NoteLevel } from '../../utils/notes'

interface NotesButtonProps {
  level: NoteLevel
  id: string
  scopeName: string
}

export function NotesButton({ level, id, scopeName }: NotesButtonProps) {
  const [open, setOpen] = useState(false)
  const [noteExists, setNoteExists] = useState(() => hasNote(level, id))

  const handleClose = useCallback(() => {
    setOpen(false)
    setNoteExists(hasNote(level, id))
  }, [level, id])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          noteExists
            ? 'border border-primary bg-primary-tint text-text-primary'
            : 'text-text-secondary hover:bg-surface',
        ].join(' ')}
        aria-label={`Notes for ${scopeName}`}
      >
        <span className="relative">
          <PenLine className="h-3.5 w-3.5" />
          {noteExists && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </span>
        Notes
      </button>

      <NotesModal
        open={open}
        level={level}
        id={id}
        scopeName={scopeName}
        onClose={handleClose}
      />
    </>
  )
}
