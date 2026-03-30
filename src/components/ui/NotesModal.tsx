import { useState, useEffect, useRef, useCallback } from 'react'
import { PenLine } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { RichTextEditor } from './RichTextEditor'
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
  const [html, setHtml] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load note on open
  useEffect(() => {
    if (open) {
      setHtml(getNote(level, id))
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
    saveNote(level, id, html)
    onClose()
  }

  function handleChange(value: string) {
    setHtml(value)
    scheduleSave(value)
  }

  // Strip HTML tags for character count
  const plainLength = html.replace(/<[^>]*>/g, '').length

  return (
    <Modal isOpen={open} onClose={handleClose} title="" size="md">
      <div className="flex items-center gap-2 text-text-primary">
        <PenLine className="h-5 w-5 text-text-secondary" />
        <div>
          <h2 className="text-base font-semibold">Notes</h2>
          <p className="text-xs text-text-secondary">{scopeName}</p>
        </div>
      </div>

      <div className="mt-4">
        <RichTextEditor
          value={html}
          onChange={handleChange}
          placeholder="Write anything — questions, connections, things to come back to…"
          autoFocus={open}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-text-disabled">
          {plainLength} character{plainLength !== 1 ? 's' : ''}
        </span>
        <Button variant="secondary" size="sm" onClick={handleClose}>
          Done
        </Button>
      </div>
    </Modal>
  )
}
