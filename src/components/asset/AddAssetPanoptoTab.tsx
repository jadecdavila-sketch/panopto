import { useState, useEffect, useCallback } from 'react'
import { SearchInput } from '../ui/SearchInput'
import { Skeleton } from '../ui/Skeleton'
import { searchPanopto, listRecentPanoptoVideos } from '../../services/mockApi'
import type { PanoptoVideo } from '../../types/domain'

interface AddAssetPanoptoTabProps {
  selectedVideos: PanoptoVideo[]
  onSelectionChange: (videos: PanoptoVideo[]) => void
}

export function AddAssetPanoptoTab({
  selectedVideos,
  onSelectionChange,
}: AddAssetPanoptoTabProps) {
  const [query, setQuery] = useState('')
  const [videos, setVideos] = useState<PanoptoVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [label, setLabel] = useState('Recent videos')

  const selectedIds = new Set(selectedVideos.map((v) => v.id))

  const fetchVideos = useCallback(async (searchQuery: string) => {
    setIsLoading(true)
    try {
      if (searchQuery.length >= 2) {
        const results = await searchPanopto(searchQuery)
        setVideos(results)
        setLabel(`Results for "${searchQuery}"`)
      } else {
        const recent = await listRecentPanoptoVideos()
        setVideos(recent)
        setLabel('Recent videos')
      }
    } catch {
      setVideos([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVideos(query)
  }, [query, fetchVideos])

  const toggleVideo = useCallback(
    (video: PanoptoVideo) => {
      if (selectedIds.has(video.id)) {
        onSelectionChange(selectedVideos.filter((v) => v.id !== video.id))
      } else {
        onSelectionChange([...selectedVideos, video])
      }
    },
    [selectedVideos, onSelectionChange, selectedIds],
  )

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search Panopto videos..."
        debounceMs={300}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        {selectedVideos.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {selectedVideos.length} selected
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-label="Loading videos">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Skeleton variant="rect" width={16} height={16} />
              <div className="flex-1 space-y-1.5">
                <Skeleton variant="text" width="70%" height={14} />
                <Skeleton variant="text" width="40%" height={12} />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-secondary">
          No videos found
        </p>
      ) : (
        <ul className="flex max-h-[280px] flex-col gap-1 overflow-y-auto" role="listbox" aria-label="Panopto videos">
          {videos.map((video) => {
            const isSelected = selectedIds.has(video.id)
            return (
              <li key={video.id} role="option" aria-selected={isSelected}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleVideo(video)}
                    className="h-4 w-4 rounded border-border text-primary accent-primary"
                    aria-label={`Select ${video.title}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {video.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span>{video.duration}</span>
                      <span aria-hidden="true">-</span>
                      <span>{new Date(video.recordedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
