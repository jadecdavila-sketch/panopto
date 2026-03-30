import { useRef, useEffect, useCallback } from 'react'
import { Bold, Italic, Underline, Strikethrough, List } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  compact?: boolean
  autoFocus?: boolean
}

interface ToolbarAction {
  command: string
  icon: React.ReactNode
  label: string
}

const ACTIONS: ToolbarAction[] = [
  { command: 'bold', icon: <Bold className="h-3.5 w-3.5" />, label: 'Bold' },
  { command: 'italic', icon: <Italic className="h-3.5 w-3.5" />, label: 'Italic' },
  { command: 'underline', icon: <Underline className="h-3.5 w-3.5" />, label: 'Underline' },
  { command: 'strikeThrough', icon: <Strikethrough className="h-3.5 w-3.5" />, label: 'Strikethrough' },
  { command: 'insertUnorderedList', icon: <List className="h-3.5 w-3.5" />, label: 'Bullet list' },
]

const SHORTCUTS: Record<string, string> = {
  b: 'bold',
  i: 'italic',
  u: 'underline',
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '',
  minHeight = 240,
  maxHeight,
  compact = false,
  autoFocus = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalUpdate = useRef(false)

  // Sync external value into the editor only when the value meaningfully changes
  // (e.g. on initial load, level/id change) — not on every keystroke
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    const el = editorRef.current
    if (el && el.innerHTML !== value) {
      el.innerHTML = value
    }
  }, [value])

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => editorRef.current?.focus(), 100)
    }
  }, [autoFocus])

  const handleInput = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    isInternalUpdate.current = true
    onChange(el.innerHTML)
  }, [onChange])

  function execCommand(command: string) {
    document.execCommand(command, false)
    editorRef.current?.focus()
    handleInput()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && SHORTCUTS[e.key]) {
      e.preventDefault()
      execCommand(SHORTCUTS[e.key])
    }
  }

  const toolbarHeight = compact ? 'h-8' : 'h-9'
  const btnSize = compact ? 'h-6 w-6' : 'h-7 w-7'

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      {/* Toolbar */}
      <div
        className={`flex items-center gap-0.5 border-b border-border bg-surface/50 px-2 ${toolbarHeight}`}
        role="toolbar"
        aria-label="Text formatting"
      >
        {ACTIONS.map(({ command, icon, label }) => (
          <button
            key={command}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault() // keep selection in editor
              execCommand(command)
            }}
            className={`inline-flex items-center justify-center rounded ${btnSize} text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary`}
            aria-label={label}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="rich-text-editor-body px-3 py-2 text-[15px] leading-relaxed text-text-primary outline-none overflow-y-auto"
        style={{ minHeight, maxHeight: maxHeight ?? undefined }}
        role="textbox"
        aria-multiline="true"
        aria-label="Note editor"
      />
    </div>
  )
}
