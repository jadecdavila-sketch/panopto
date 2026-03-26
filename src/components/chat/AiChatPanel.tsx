import { useState, useRef, useEffect } from 'react'
import type { KnowledgeTouchpoint } from '../../types/domain'
import { useAiChat } from '../../hooks/useAiChat'
import { Button } from '../ui/Button'

interface AiChatPanelProps {
  isOpen: boolean
  onClose: () => void
  assetTitle: string
  knowledgeTouchpoints: KnowledgeTouchpoint[]
}

export function AiChatPanel({
  isOpen,
  onClose,
  assetTitle,
  knowledgeTouchpoints,
}: AiChatPanelProps) {
  const { messages, sendMessage, isTyping } = useAiChat({
    assetTitle,
    knowledgeTouchpoints,
  })
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    sendMessage(text)
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <aside
      className="flex w-[340px] shrink-0 flex-col border-l border-border bg-background"
      role="complementary"
      aria-label="Folio AI chat panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-forest">Folio AI</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="Close chat panel"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" role="log" aria-label="Chat messages">
        <div className="mb-4 rounded-lg bg-surface px-3 py-2 text-sm text-text-secondary">
          Ask me anything about {assetTitle}. I can help you understand the key concepts.
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={[
                'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                msg.role === 'user'
                  ? 'bg-primary/15 text-text-primary'
                  : 'bg-surface text-text-primary',
              ].join(' ')}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="mb-3 flex justify-start">
            <div className="rounded-lg bg-surface px-3 py-2 text-sm text-text-secondary">
              <span className="inline-flex gap-1" aria-label="AI is typing">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Folio AI..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Chat message input"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </Button>
        </div>
      </div>
    </aside>
  )
}
