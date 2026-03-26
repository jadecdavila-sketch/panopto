import { useState, useEffect, useCallback } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Tabs } from '../ui/Tabs'
import { useToast } from '../../context/ToastContext'
import {
  listTopics,
  createTopic,
  createStudySet,
  startUpload,
} from '../../services/mockApi'
import type { Topic, StudySet, PanoptoVideo } from '../../types/domain'
import { AddAssetPanoptoTab } from './AddAssetPanoptoTab'
import { AddAssetUploadTab, type UploadFile } from './AddAssetUploadTab'

interface AddAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded?: (assets: import('../../types/domain').LearningAsset[]) => void
  defaultTopicId?: string
}

const TAB_OPTIONS = [
  { id: 'panopto', label: 'Your Videos' },
  { id: 'upload', label: 'Upload' },
]

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm']

function getExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

export function AddAssetModal({
  isOpen,
  onClose,
  onAdded,
  defaultTopicId,
}: AddAssetModalProps) {
  const [activeTab, setActiveTab] = useState('panopto')
  const [topicId, setTopicId] = useState(defaultTopicId ?? '')
  const [topicInput, setTopicInput] = useState('')
  const [studySetId, setStudySetId] = useState('')
  const [studySetInput, setStudySetInput] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [studySets, setStudySets] = useState<StudySet[]>([])
  const [selectedVideos, setSelectedVideos] = useState<PanoptoVideo[]>([])
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  // Fetch topics on open
  useEffect(() => {
    if (!isOpen) return
    listTopics().then(setTopics).catch(() => {})
  }, [isOpen])

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab('panopto')
      setTopicId(defaultTopicId ?? '')
      setTopicInput('')
      setStudySetId('')
      setStudySetInput('')
      setSelectedVideos([])
      setUploadFiles([])
      setIsSubmitting(false)
    }
  }, [isOpen, defaultTopicId])

  // Fetch study sets for selected topic
  useEffect(() => {
    if (!topicId) {
      setStudySets([])
      setStudySetId('')
      return
    }
    // Use listAssets to derive study sets — the mockApi getTopicDetail provides them
    import('../../services/mockApi').then((api) =>
      api.getTopicDetail(topicId).then((detail) => {
        setStudySets(detail.studySets)
      }).catch(() => setStudySets([])),
    )
  }, [topicId])

  const validUploadFiles = uploadFiles.filter((f) => !f.error)

  const hasItems =
    activeTab === 'panopto'
      ? selectedVideos.length > 0
      : validUploadFiles.length > 0

  const canSubmit = !isSubmitting && hasItems

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setIsSubmitting(true)

    try {
      // Resolve topic: use selected, create new from input, or null
      let resolvedTopicId: string | null = (topicId && topicId !== '__new__') ? topicId : null
      if (!resolvedTopicId && topicInput.trim()) {
        const newTopic = await createTopic(topicInput.trim())
        resolvedTopicId = newTopic.id
      }

      // Resolve study set: use selected, create new from input, or null
      let resolvedStudySetId: string | null = (studySetId && studySetId !== '__new__') ? studySetId : null
      if (studySetId === '__new__' && studySetInput.trim() && resolvedTopicId) {
        const newSet = await createStudySet(resolvedTopicId, studySetInput.trim(), [])
        resolvedStudySetId = newSet.id
      }

      let created: import('../../types/domain').LearningAsset[]
      if (activeTab === 'panopto') {
        created = await startUpload(
          selectedVideos.map((v) => ({
            title: v.title,
            type: 'panopto' as const,
            topicId: resolvedTopicId ?? '',
            studySetId: resolvedStudySetId || null,
            sourceLabel: 'Panopto',
            originalUrl: `https://panopto.example.com/video/${v.id}`,
            durationMinutes: parseDuration(v.duration),
          })),
        )
        toast.success(
          `${selectedVideos.length} Panopto video${selectedVideos.length > 1 ? 's' : ''} added`,
        )
      } else {
        created = await startUpload(
          validUploadFiles.map((f) => ({
            title: f.file.name.replace(/\.[^.]+$/, ''),
            type: VIDEO_EXTENSIONS.includes(getExtension(f.file.name))
              ? ('video' as const)
              : ('document' as const),
            topicId: resolvedTopicId ?? '',
            studySetId: resolvedStudySetId || null,
            sourceLabel: 'Upload',
            originalUrl: '',
          })),
        )
        toast.success(
          `${validUploadFiles.length} file${validUploadFiles.length > 1 ? 's' : ''} uploaded`,
        )
      }
      onAdded?.(created)
      onClose()
    } catch {
      toast.error('Failed to add assets. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    canSubmit,
    activeTab,
    selectedVideos,
    validUploadFiles,
    topicId,
    topicInput,
    studySetId,
    studySetInput,
    toast,
    onAdded,
    onClose,
  ])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Learning Material" size="md">
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <Tabs tabs={TAB_OPTIONS} activeTab={activeTab} onChange={setActiveTab} />

        {/* Folio selector — hidden when opened from within a folio */}
        {!defaultTopicId && <div>
          <label
            htmlFor="asset-topic"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Folio <span className="text-xs text-text-secondary">(optional)</span>
          </label>
          {topics.length > 0 ? (
            <>
              <select
                id="asset-topic"
                value={topicId}
                onChange={(e) => {
                  setTopicId(e.target.value)
                  setTopicInput('')
                  setStudySetId('')
                }}
                className="w-full rounded-lg border border-border bg-background py-2 pl-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select a folio...</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
                <option value="__new__">+ Create new folio...</option>
              </select>
              {topicId === '__new__' && (
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => {
                    setTopicInput(e.target.value)
                    setStudySetId('')
                  }}
                  placeholder="e.g., Molecular Genetics"
                  autoFocus
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              )}
            </>
          ) : (
            <input
              id="asset-topic"
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Type a folio name, e.g., Molecular Biology, to help organize your materials"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          )}
        </div>}

        {/* Study Set selector (optional, shown when topic selected) */}
        {topicId && topicId !== '__new__' && (
          <div>
            <label
              htmlFor="asset-studyset"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Study Set <span className="text-xs text-text-secondary">(optional)</span>
            </label>
            <select
              id="asset-studyset"
              value={studySetId}
              onChange={(e) => {
                setStudySetId(e.target.value)
                setStudySetInput('')
              }}
              className="w-full rounded-lg border border-border bg-background py-2 pl-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">None</option>
              {studySets.map((ss) => (
                <option key={ss.id} value={ss.id}>
                  {ss.name}
                </option>
              ))}
              <option value="__new__">+ Create new study set...</option>
            </select>
            {studySetId === '__new__' && (
              <input
                type="text"
                value={studySetInput}
                onChange={(e) => setStudySetInput(e.target.value)}
                placeholder="e.g., Week 1 Readings"
                autoFocus
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            )}
          </div>
        )}

        {/* Tab content */}
        <div role="tabpanel" aria-label={activeTab === 'panopto' ? 'Panopto videos' : 'Upload files'}>
          {activeTab === 'panopto' ? (
            <AddAssetPanoptoTab
              selectedVideos={selectedVideos}
              onSelectionChange={setSelectedVideos}
            />
          ) : (
            <AddAssetUploadTab files={uploadFiles} onFilesChange={setUploadFiles} />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} isLoading={isSubmitting}>
            Add
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/** Parse "1h 23m" or "45m" style duration strings to minutes */
function parseDuration(duration: string): number {
  const hours = duration.match(/(\d+)\s*h/)
  const minutes = duration.match(/(\d+)\s*m/)
  return (hours ? parseInt(hours[1], 10) * 60 : 0) + (minutes ? parseInt(minutes[1], 10) : 0)
}
