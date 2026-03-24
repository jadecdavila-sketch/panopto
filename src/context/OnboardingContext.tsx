import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage'
import { OnboardingModal } from '../components/onboarding/OnboardingModal'

const STORAGE_KEY = 'folio:onboarding-complete'

// In dev, reset to empty state on cold start (HMR / new tab) but not on
// in-app reloads (e.g. "Load sample data" button which sets mock:seeded then reloads).
// sessionStorage survives reloads but clears on new tabs / HMR full refresh.
if (import.meta.env.DEV && !sessionStorage.getItem('dev:session-started')) {
  localStorage.removeItem('mock:seeded')
  sessionStorage.setItem('dev:session-started', '1')
}

interface OnboardingContextValue {
  /** Re-show the onboarding (for dev/testing) */
  resetOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext)
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return ctx
}

const DEV = import.meta.env.DEV

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(() => {
    // In dev, show unless the user just loaded sample data
    if (DEV) return localStorage.getItem('mock:seeded') !== '1'
    return !getStorageItem<boolean>(STORAGE_KEY, false)
  })

  const dismiss = useCallback(() => {
    if (!DEV) setStorageItem(STORAGE_KEY, true)
    setIsOpen(false)
  }, [])

  const resetOnboarding = useCallback(() => {
    removeStorageItem(STORAGE_KEY)
    setIsOpen(true)
  }, [])

  return (
    <OnboardingContext.Provider value={{ resetOnboarding }}>
      {children}
      <OnboardingModal isOpen={isOpen} onDismiss={dismiss} />
    </OnboardingContext.Provider>
  )
}
