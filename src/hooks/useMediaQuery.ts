import { useState, useEffect } from 'react'

/**
 * Returns true when the given media query string matches.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)

    setMatches(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * Convenience hook: returns true when viewport width is 767px or below.
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}
