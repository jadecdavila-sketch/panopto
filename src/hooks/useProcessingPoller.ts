import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { advanceProcessingStatus } from '../services/mockApi'
import type { ProcessingStatus } from '../types/domain'

const POLL_INTERVAL_MS = 6000

interface UseProcessingPollerOptions {
  /** Asset IDs to poll, or a function that returns IDs */
  assetIds: string[] | (() => string[])
  /** Whether the poller should be active. Defaults to true when assetIds is non-empty. */
  enabled?: boolean
}

interface UseProcessingPollerResult {
  assets: Map<string, ProcessingStatus>
  isPolling: boolean
  start: () => void
  stop: () => void
}

export function useProcessingPoller({
  assetIds,
  enabled = true,
}: UseProcessingPollerOptions): UseProcessingPollerResult {
  const [statusMap, setStatusMap] = useState<Map<string, ProcessingStatus>>(new Map())
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const manualStop = useRef(false)

  const resolveIds = useCallback((): string[] => {
    return typeof assetIds === 'function' ? assetIds() : assetIds
  }, [assetIds])

  // Stable key for the resolved IDs to use as a dependency
  const idsKey = useMemo(() => {
    const ids = typeof assetIds === 'function' ? assetIds() : assetIds
    return ids.join(',')
  }, [assetIds])

  const clearPoller = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPolling(false)
  }, [])

  const poll = useCallback(async () => {
    const ids = resolveIds()
    if (ids.length === 0) {
      clearPoller()
      return
    }

    try {
      // Advance processing for all watched assets
      const results = await advanceProcessingStatus()

      setStatusMap((prev) => {
        const next = new Map(prev)
        for (const asset of results) {
          if (ids.includes(asset.id)) {
            next.set(asset.id, asset.processingStatus)
          }
        }
        return next
      })

      // Check if all terminal
      const currentIds = resolveIds()
      setStatusMap((prev) => {
        const allTerminal = currentIds.every((id) => {
          const status = prev.get(id)
          return status === 'ready' || status === 'failed'
        })
        if (allTerminal && currentIds.length > 0) {
          clearPoller()
        }
        return prev
      })
    } catch {
      // Silently ignore poll errors
    }
  }, [resolveIds, clearPoller])

  const start = useCallback(() => {
    manualStop.current = false
    if (intervalRef.current !== null) return
    setIsPolling(true)
    poll() // Immediate first poll
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)
  }, [poll])

  const stop = useCallback(() => {
    manualStop.current = true
    clearPoller()
  }, [clearPoller])

  // Auto-start/stop based on enabled and assetIds
  useEffect(() => {
    if (manualStop.current) return

    const ids = resolveIds()
    if (!enabled || ids.length === 0) {
      // Clear interval without triggering a state update during the sync phase
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Defer state update to avoid sync setState in effect
      queueMicrotask(() => setIsPolling(false))
      return
    }

    // Check if all already terminal
    const allTerminal = ids.every((id) => {
      const status = statusMap.get(id)
      return status === 'ready' || status === 'failed'
    })

    if (allTerminal) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      queueMicrotask(() => setIsPolling(false))
      return
    }

    if (intervalRef.current === null) {
      // Start polling — defer initial poll and state update to avoid sync setState in effect
      manualStop.current = false
      intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)
      setTimeout(poll, 0)
      queueMicrotask(() => setIsPolling(true))
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, idsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return { assets: statusMap, isPolling, start, stop }
}
