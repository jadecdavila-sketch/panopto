import { useState, useEffect, useRef } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

interface RenameDialogProps {
  isOpen: boolean
  onClose: () => void
  onRename: (newName: string) => void
  currentName: string
  title?: string
  label?: string
}

export function RenameDialog({
  isOpen,
  onClose,
  onRename,
  currentName,
  title = 'Rename',
  label = 'Name',
}: RenameDialogProps) {
  const [value, setValue] = useState(currentName)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset value when dialog opens
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync form state when dialog opens
    if (isOpen) setValue(currentName)
  }, [isOpen, currentName])

  // Focus and select text on open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isOpen])

  const trimmed = value.trim()
  const canSubmit = trimmed.length > 0 && trimmed !== currentName

  const handleSubmit = () => {
    if (!canSubmit) return
    onRename(trimmed)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <label className="mb-1.5 block text-sm font-medium text-text-primary">
          {label}
        </label>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mb-5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}
