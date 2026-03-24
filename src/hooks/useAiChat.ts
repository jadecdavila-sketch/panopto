import { useState, useCallback, useRef } from 'react'
import type { KnowledgeTouchpoint } from '../types/domain'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface UseAiChatOptions {
  assetTitle: string
  knowledgeTouchpoints: KnowledgeTouchpoint[]
}

interface UseAiChatResult {
  messages: ChatMessage[]
  sendMessage: (text: string) => void
  isTyping: boolean
  clearMessages: () => void
}

function findRelevantKT(
  text: string,
  kts: KnowledgeTouchpoint[],
): KnowledgeTouchpoint | null {
  if (kts.length === 0) return null
  const lower = text.toLowerCase()
  const scored = kts.map((kt) => {
    const words = kt.heading.toLowerCase().split(/\s+/)
    const matches = words.filter((w) => w.length > 3 && lower.includes(w)).length
    return { kt, matches }
  })
  scored.sort((a, b) => b.matches - a.matches)
  if (scored[0].matches > 0) return scored[0].kt
  return kts[Math.floor(Math.random() * kts.length)]
}

function buildResponse(
  text: string,
  kts: KnowledgeTouchpoint[],
  assetTitle: string,
): string {
  const kt = findRelevantKT(text, kts)
  if (kt) {
    return `Based on the material about "${kt.heading}", ${kt.body.slice(0, 200)}${kt.body.length > 200 ? '...' : ''}`
  }
  return `That's a great question about "${assetTitle}". The material covers several important concepts. Could you be more specific about which aspect you'd like me to explain?`
}

export function useAiChat({
  assetTitle,
  knowledgeTouchpoints,
}: UseAiChatOptions): UseAiChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const counterRef = useRef(0)

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const userMsg: ChatMessage = {
        id: `msg-${++counterRef.current}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg])
      setIsTyping(true)

      const delay = 1000 + Math.random() * 1000
      timerRef.current = setTimeout(() => {
        const aiMsg: ChatMessage = {
          id: `msg-${++counterRef.current}`,
          role: 'assistant',
          content: buildResponse(trimmed, knowledgeTouchpoints, assetTitle),
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, aiMsg])
        setIsTyping(false)
      }, delay)
    },
    [assetTitle, knowledgeTouchpoints],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setIsTyping(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return { messages, sendMessage, isTyping, clearMessages }
}
