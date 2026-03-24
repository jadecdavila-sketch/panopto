import { useSyncExternalStore, useCallback } from 'react'

/**
 * Returns true when the given media query string matches.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    [query],
  )

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches
  }, [query])

  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Convenience hook: returns true when viewport width is 767px or below.
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}
