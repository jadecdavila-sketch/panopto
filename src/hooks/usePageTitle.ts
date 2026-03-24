import { useEffect } from 'react'

const BASE_TITLE = 'Panopto Folio'

/**
 * Sets the document title. Resets to base title on unmount.
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE
    return () => {
      document.title = BASE_TITLE
    }
  }, [title])
}
