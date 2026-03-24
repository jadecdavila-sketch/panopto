import { useState, useEffect, useCallback } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { listAssets } from '../../services/mockApi'
import type { GenerationScope } from '../../types/domain'

interface ContentItem {
  id: string
  label: string
  group?: string
}

interface RegenerateModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (ktIds?: string[]) => void
  title: string
  /** Scope of the existing modality — used to fetch related content */
  scope: GenerationScope
  isLoading?: boolean
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function resolveTopicId(scope: GenerationScope): string | null {
  switch (scope.level) {
    case 'topic':
      return scope.topicId
    case 'studyset':
      return scope.topicId
    default:
      return null
  }
}

export function RegenerateModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  scope,
  isLoading: externalLoading = false,
}: RegenerateModalProps) {
  const [showContent, setShowContent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const topicId = resolveTopicId(scope)
  const supportsContent = scope.level === 'topic' || scope.level === 'studyset'

  // Reset state on open
  useEffect(() => {
    if (!isOpen) return
    setShowContent(false)
    setContentItems([])
    setSelectedIds(new Set())
  }, [isOpen])

  // Fetch content when expanded
  useEffect(() => {
    if (!showContent || !supportsContent || !isOpen) return
    let cancelled = false

    async function fetchContent() {
      setLoading(true)
      try {
        // Fetch assets for the topic so user can pick KTs
        const fetchedAssets = topicId
          ? await listAssets(topicId)
          : await listAssets()

        if (cancelled) return

        const readyAssets = fetchedAssets.filter(
          (a) => !a.isSynthesis && !a.isDeleted && a.processingStatus === 'ready',
        )

        const items: ContentItem[] = []
        const allKtIds: string[] = []
        for (const asset of readyAssets) {
          for (const kt of asset.knowledgeTouchpoints) {
            items.push({ id: kt.id, label: kt.heading, group: asset.title })
            allKtIds.push(kt.id)
          }
        }

        setContentItems(items)
        // Select all by default
        setSelectedIds(new Set(allKtIds))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchContent()
    return () => {
      cancelled = true
    }
  }, [showContent, supportsContent, isOpen, topicId, scope.level])

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size <= 1) return prev
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (showContent && selectedIds.size > 0) {
      onConfirm(Array.from(selectedIds))
    } else {
      onConfirm(undefined)
    }
  }, [showContent, selectedIds, onConfirm])

  // Group items
  const grouped = (() => {
    const groups: Array<{ group: string; items: ContentItem[] }> = []
    const map = new Map<string, ContentItem[]>()
    for (const item of contentItems) {
      const g = item.group ?? 'Other'
      if (!map.has(g)) {
        map.set(g, [])
        groups.push({ group: g, items: map.get(g)! })
      }
      map.get(g)!.push(item)
    }
    return groups
  })()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          This will replace the current content with new items generated from the source material.
        </p>

        {/* Content picker disclosure */}
        {supportsContent && (
          <div>
            <button
              type="button"
              onClick={() => setShowContent((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-expanded={showContent}
            >
              <ChevronIcon expanded={showContent} />
              Choose content to include
            </button>

            {showContent && (
              <div className="mt-2">
                {loading ? (
                  <div className="flex flex-col gap-2">
                    <Skeleton variant="rect" width="100%" height={36} />
                    <Skeleton variant="rect" width="100%" height={36} />
                    <Skeleton variant="rect" width="100%" height={36} />
                  </div>
                ) : contentItems.length === 0 ? (
                  <p className="rounded-lg border border-border px-3 py-4 text-center text-sm text-text-secondary">
                    No content available to select.
                  </p>
                ) : (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-text-secondary">
                        {selectedIds.size} of {contentItems.length} selected
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedIds(new Set(contentItems.map((i) => i.id)))}
                          className="text-xs text-primary hover:underline"
                        >
                          Select all
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            // Keep at least the first item
                            setSelectedIds(new Set([contentItems[0].id]))
                          }}
                          className="text-xs text-text-secondary hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <ul
                      className="flex max-h-[240px] flex-col gap-0.5 overflow-y-auto rounded-lg border border-border p-1"
                      role="group"
                      aria-label="Select content to regenerate from"
                    >
                      {grouped.map(({ group, items }) => (
                        <li key={group}>
                          <p className="sticky top-0 bg-background px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-text-disabled">
                            {group}
                          </p>
                          <ul className="flex flex-col">
                            {items.map((item) => {
                              const isSelected = selectedIds.has(item.id)
                              return (
                                <li key={item.id}>
                                  <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-surface">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleItem(item.id)}
                                      className="h-3.5 w-3.5 rounded border-border text-primary accent-primary"
                                      aria-label={`Include ${item.label}`}
                                    />
                                    <span className="flex-1 truncate text-sm text-text-primary">
                                      {item.label}
                                    </span>
                                  </label>
                                </li>
                              )
                            })}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={externalLoading}
            disabled={showContent && selectedIds.size === 0}
          >
            Regenerate
          </Button>
        </div>
      </div>
    </Modal>
  )
}
