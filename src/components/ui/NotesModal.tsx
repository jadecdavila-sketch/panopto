import { useState, useEffect, useRef, useCallback } from 'react'
import { PenLine } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { getNote, saveNote, type NoteLevel } from '../../utils/notes'

interface NotesModalProps {
  open: boolean
  level: NoteLevel
  id: string
  scopeName: string
  onClose: () => void
}

const DEBOUNCE_MS = 500

export function NotesModal({ open, level, id, scopeName, onClose }: NotesModalProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load note on open
  useEffect(() => {
    if (open) {
      setText(getNote(level, id))
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open, level, id])

  // Debounced save
  const scheduleSave = useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        saveNote(level, id, value)
      }, DEBOUNCE_MS)
    },
    [level, id],
  )

  // Flush on close
  function handleClose() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    saveNote(level, id, text)
    onClose()
  }

  function handleChange(value: string) {
    setText(value)
    scheduleSave(value)
  }

  return (
    <Modal isOpen={open} onClose={handleClose} title="" size="md">
      <div className="flex items-center gap-2 text-text-primary">
        <PenLine className="h-5 w-5 text-text-secondary" />
        <div>
          <h2 className="text-base font-semibold">Notes</h2>
          <p className="text-xs text-text-secondary">{scopeName}</p>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Write anything — questions, connections, things to come back to…"
        className="mt-4 w-full border-none bg-transparent p-0 text-[15px] leading-relaxed text-text-primary outline-none placeholder:text-text-disabled"
        style={{ minHeight: 240, resize: 'none' }}
      />

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-text-disabled">
          {text.length} character{text.length !== 1 ? 's' : ''}
        </span>
        <Button variant="secondary" size="sm" onClick={handleClose}>
          Done
        </Button>
      </div>
    </Modal>
  )
}
