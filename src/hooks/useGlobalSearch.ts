import { useState, useEffect, useRef, useCallback } from 'react'
import { globalSearch, type SearchResult } from '../services/mockApi'

const DEBOUNCE_MS = 250

interface UseGlobalSearchResult {
  query: string
  setQuery: (q: string) => void
  results: SearchResult[]
  isSearching: boolean
  clear: () => void
}

export function useGlobalSearch(): UseGlobalSearchResult {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef(0)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const callId = ++abortRef.current

    timerRef.current = setTimeout(async () => {
      try {
        const res = await globalSearch(trimmed)
        if (callId === abortRef.current) {
          setResults(res)
        }
      } finally {
        if (callId === abortRef.current) {
          setIsSearching(false)
        }
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  const clear = useCallback(() => {
    setQuery('')
    setResults([])
    setIsSearching(false)
  }, [])

  return { query, setQuery, results, isSearching, clear }
}
