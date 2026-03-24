import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LearningAsset, AssetType, ProcessingStatus, Topic } from '../../types/domain'
import { listAssets, listAllTopics, removeAsset, renameAsset, moveAsset } from '../../services/mockApi'
import { SearchInput } from '../ui/SearchInput'
import { FilterChips } from '../ui/FilterChips'
import { DropdownMenu } from '../ui/DropdownMenu'
import { AssetBadge, StatusBadge } from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'
import { InlineError } from '../ui/InlineError'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { useToast } from '../../context/ToastContext'
import { getStorageItem, setStorageItem } from '../../utils/storage'
import { Button } from '../ui/Button'
import { AddAssetModal } from '../asset/AddAssetModal'

type SortKey = 'title-asc' | 'title-desc' | 'date-added' | 'last-accessed'
type TypeFilter = 'all' | AssetType
type StatusFilter = 'all' | ProcessingStatus

interface LibraryPrefs {
  sort: SortKey
  typeFilter: TypeFilter
  statusFilter: StatusFilter
}

const STORAGE_KEY = 'pla.libraryPrefs.v3'

const defaultPrefs: LibraryPrefs = {
  sort: 'last-accessed',
  typeFilter: 'all',
  statusFilter: 'all',
}

const typeOptions = [
  { id: 'all', label: 'All' },
  { id: 'document', label: 'Document' },
  { id: 'video', label: 'Video' },
  { id: 'panopto', label: 'Panopto' },
]

const statusOptions = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'ready', label: 'Ready' },
  { id: 'failed', label: 'Failed' },
]

const sortOptions = [
  { id: 'title-asc', label: 'Title A-Z' },
  { id: 'title-desc', label: 'Title Z-A' },
  { id: 'date-added', label: 'Date added' },
  { id: 'last-accessed', label: 'Last accessed' },
]

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

function isRecent(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < THREE_DAYS_MS
}

function RecentBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      Recent
    </span>
  )
}

function ThreeDotIcon() {
  return (
    <svg className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM10 11.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM10 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
    </svg>
  )
}

function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  if (!direction) {
    return (
      <svg className="ml-1 inline h-3 w-3 text-text-disabled" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
        <path d="M6 2l3 4H3zM6 10l-3-4h6z" />
      </svg>
    )
  }
  return (
    <svg className="ml-1 inline h-3 w-3 text-primary" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      {direction === 'asc' ? <path d="M6 2l3 4H3z" /> : <path d="M6 10l-3-4h6z" />}
    </svg>
  )
}

export function AssetsTable() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const toast = useToast()

  const [assets, setAssets] = useState<LearningAsset[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddAsset, setShowAddAsset] = useState(false)

  const [prefs, setPrefs] = useState<LibraryPrefs>(() =>
    getStorageItem<LibraryPrefs>(STORAGE_KEY, defaultPrefs),
  )

  const updatePrefs = useCallback((updates: Partial<LibraryPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updates }
      setStorageItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [assetList, topicList] = await Promise.all([
        listAssets(),
        listAllTopics(),
      ])
      setAssets(assetList)
      setTopics(topicList)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load assets.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const topicMap = useMemo(
    () => Object.fromEntries(topics.map((t) => [t.id, t.name])),
    [topics],
  )

  const filtered = useMemo(() => {
    let result = [...assets]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.topicId && topicMap[a.topicId]?.toLowerCase().includes(q)),
      )
    }

    // Type filter
    if (prefs.typeFilter !== 'all') {
      result = result.filter((a) => a.type === prefs.typeFilter)
    }

    // Status filter
    if (prefs.statusFilter !== 'all') {
      result = result.filter((a) => a.processingStatus === prefs.statusFilter)
    }

    // Sort
    switch (prefs.sort) {
      case 'title-asc':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'title-desc':
        result.sort((a, b) => b.title.localeCompare(a.title))
        break
      case 'date-added':
        result.sort(
          (a, b) =>
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
        )
        break
      case 'last-accessed':
        result.sort(
          (a, b) =>
            new Date(b.lastOpenedAt).getTime() -
            new Date(a.lastOpenedAt).getTime(),
        )
        break
    }

    return result
  }, [assets, search, prefs, topicMap])

  const handleDelete = async (asset: LearningAsset) => {
    try {
      await removeAsset(asset.id)
      setAssets((prev) => prev.filter((a) => a.id !== asset.id))
      toast.success(`"${asset.title}" deleted`)
    } catch {
      toast.error('Failed to delete asset. Please try again.')
    }
  }

  const handleRename = async (asset: LearningAsset) => {
    const newName = window.prompt('Rename asset:', asset.title)
    if (!newName || newName === asset.title) return
    try {
      const updated = await renameAsset(asset.id, newName)
      setAssets((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      )
      toast.success('Asset renamed')
    } catch {
      toast.error('Failed to rename asset. Please try again.')
    }
  }

  const handleMove = async (asset: LearningAsset) => {
    const topicName = window.prompt(
      'Move to topic (enter topic name or leave blank to unassign):',
    )
    if (topicName === null) return
    const targetTopic = topicName.trim()
      ? topics.find(
          (t) => t.name.toLowerCase() === topicName.trim().toLowerCase(),
        )
      : null
    const topicId = targetTopic?.id ?? null
    try {
      const updated = await moveAsset(asset.id, topicId)
      setAssets((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      )
      toast.success('Asset moved')
    } catch {
      toast.error('Failed to move asset. Please try again.')
    }
  }

  const getMenuItems = (asset: LearningAsset) => [
    { label: 'Rename', onClick: () => handleRename(asset) },
    { label: 'Move to topic', onClick: () => handleMove(asset) },
    { label: 'Delete', onClick: () => handleDelete(asset), danger: true },
  ]

  const getSortDirection = (
    column: 'title' | 'date' | 'accessed',
  ): 'asc' | 'desc' | null => {
    if (column === 'title') {
      if (prefs.sort === 'title-asc') return 'asc'
      if (prefs.sort === 'title-desc') return 'desc'
    }
    if (column === 'date' && prefs.sort === 'date-added') return 'desc'
    if (column === 'accessed' && prefs.sort === 'last-accessed') return 'desc'
    return null
  }

  const toggleTitleSort = () => {
    updatePrefs({
      sort: prefs.sort === 'title-asc' ? 'title-desc' : 'title-asc',
    })
  }

  if (loading) {
    return (
      <section aria-label="Learning Materials loading">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Learning Materials
        </h2>
        <Skeleton variant="rect" width="100%" height={40} className="mb-4" />
        <Skeleton variant="rect" width="100%" height={300} />
      </section>
    )
  }

  if (error) {
    return (
      <section aria-label="Learning Materials">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Learning Materials
        </h2>
        <InlineError message={error} onRetry={fetchData} />
      </section>
    )
  }

  return (
    <section aria-label="Learning Materials">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">
        Learning Materials
      </h2>

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search assets by title or topic..."
        />
      </div>

      {/* Filters + New button */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div>
            <span className="mr-2 text-xs font-medium text-text-secondary">Type:</span>
            <FilterChips
              options={typeOptions}
              selected={prefs.typeFilter}
              onChange={(id) => updatePrefs({ typeFilter: id as TypeFilter })}
            />
          </div>
          <div>
            <span className="mr-2 text-xs font-medium text-text-secondary">Status:</span>
            <FilterChips
              options={statusOptions}
              selected={prefs.statusFilter}
              onChange={(id) => updatePrefs({ statusFilter: id as StatusFilter })}
            />
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAddAsset(true)}
          leftIcon={
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M8 3v10M3 8h10" />
            </svg>
          }
        >
          New
        </Button>
      </div>

      {/* Sort dropdown */}
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="sort-select" className="text-xs font-medium text-text-secondary">
          Sort by:
        </label>
        <select
          id="sort-select"
          value={prefs.sort}
          onChange={(e) => updatePrefs({ sort: e.target.value as SortKey })}
          className="rounded-md border border-border bg-background py-1 pl-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {sortOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">
          No assets match your search or filters.
        </p>
      ) : isMobile ? (
        /* Mobile card grid */
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    className="text-left text-sm font-medium text-text-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {asset.title}
                  </button>
                  {isRecent(asset.lastOpenedAt) && <RecentBadge />}
                </div>
                <DropdownMenu
                  trigger={
                    <button
                      type="button"
                      className="rounded p-1 hover:bg-surface"
                      aria-label={`Actions for ${asset.title}`}
                    >
                      <ThreeDotIcon />
                    </button>
                  }
                  items={getMenuItems(asset)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                {asset.topicId && topicMap[asset.topicId] && (
                  <span>{topicMap[asset.topicId]}</span>
                )}
                <AssetBadge assetType={asset.type} />
                <StatusBadge status={asset.processingStatus} />
              </div>
              <p className="mt-1 text-xs text-text-disabled">
                Added {new Date(asset.addedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop table */
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  <button
                    type="button"
                    onClick={toggleTitleSort}
                    className="inline-flex items-center hover:text-text-primary"
                  >
                    Title
                    <SortIcon direction={getSortDirection('title')} />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">Folio</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Type</th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  <button
                    type="button"
                    onClick={() => updatePrefs({ sort: 'date-added' })}
                    className="inline-flex items-center hover:text-text-primary"
                  >
                    Date Added
                    <SortIcon direction={getSortDirection('date')} />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  <button
                    type="button"
                    onClick={() => updatePrefs({ sort: 'last-accessed' })}
                    className="inline-flex items-center hover:text-text-primary"
                  >
                    Last Accessed
                    <SortIcon direction={getSortDirection('accessed')} />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="w-10 px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((asset) => (
                <tr
                  key={asset.id}
                  className="cursor-pointer transition-colors hover:bg-surface/50"
                  onClick={() => navigate(`/assets/${asset.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    <span className="inline-flex items-center gap-2">
                      {asset.title}
                      {isRecent(asset.lastOpenedAt) && <RecentBadge />}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {asset.topicId && topicMap[asset.topicId]
                      ? topicMap[asset.topicId]
                      : '\u2014'}
                  </td>
                  <td className="px-4 py-3">
                    <AssetBadge assetType={asset.type} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(asset.addedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(asset.lastOpenedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={asset.processingStatus} />
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu
                      trigger={
                        <button
                          type="button"
                          className="rounded p-1 hover:bg-surface"
                          aria-label={`Actions for ${asset.title}`}
                        >
                          <ThreeDotIcon />
                        </button>
                      }
                      items={getMenuItems(asset)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AddAssetModal
        isOpen={showAddAsset}
        onClose={() => setShowAddAsset(false)}
        onAdded={(created) => {
          setShowAddAsset(false)
          if (created && created.length > 0) {
            navigate(`/assets/${created[0].id}`)
          } else {
            fetchData()
          }
        }}
      />
    </section>
  )
}
