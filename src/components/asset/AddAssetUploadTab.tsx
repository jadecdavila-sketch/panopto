import { useState, useRef, useCallback } from 'react'

export interface UploadFile {
  file: File
  id: string
  error?: string
}

interface AddAssetUploadTabProps {
  files: UploadFile[]
  onFilesChange: (files: UploadFile[]) => void
}

const ACCEPTED_TYPES = '.pdf,.docx,.pptx,.txt,.md,.mp4,.mov,.webm'

const DOCUMENT_EXTENSIONS = ['pdf', 'docx', 'pptx', 'txt', 'md']
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm']

const MAX_DOC_SIZE = 25 * 1024 * 1024 // 25 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500 MB

let fileIdCounter = 0

function getExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function isVideoFile(name: string): boolean {
  return VIDEO_EXTENSIONS.includes(getExtension(name))
}

function isValidExtension(name: string): boolean {
  const ext = getExtension(name)
  return [...DOCUMENT_EXTENSIONS, ...VIDEO_EXTENSIONS].includes(ext)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFile(file: File): string | undefined {
  if (!isValidExtension(file.name)) {
    return `Unsupported file type: .${getExtension(file.name)}`
  }
  const maxSize = isVideoFile(file.name) ? MAX_VIDEO_SIZE : MAX_DOC_SIZE
  const maxLabel = isVideoFile(file.name) ? '500 MB' : '25 MB'
  if (file.size > maxSize) {
    return `File too large (${formatFileSize(file.size)}). Maximum is ${maxLabel}.`
  }
  return undefined
}

function FileTypeIcon({ name }: { name: string }) {
  const isVideo = isVideoFile(name)
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0 text-text-secondary"
      aria-hidden="true"
    >
      {isVideo ? (
        <path
          d="M2 4a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm4.5 1.5v5l4-2.5-4-2.5z"
          fill="currentColor"
        />
      ) : (
        <path
          d="M4 2a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V6l-4-4H4zm5 0v3a1 1 0 001 1h3"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

export function AddAssetUploadTab({ files, onFilesChange }: AddAssetUploadTabProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const newFiles: UploadFile[] = Array.from(incoming).map((file) => ({
        file,
        id: `upload-${++fileIdCounter}`,
        error: validateFile(file),
      }))
      onFilesChange([...files, ...newFiles])
    },
    [files, onFilesChange],
  )

  const removeFile = useCallback(
    (id: string) => {
      onFilesChange(files.filter((f) => f.id !== id))
    },
    [files, onFilesChange],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files)
      }
      // Reset so same file can be selected again
      e.target.value = ''
    },
    [addFiles],
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <button
        type="button"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-text-secondary',
        ].join(' ')}
        aria-label="Drop files here or click to browse"
      >
        {/* Upload icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          className="text-text-secondary"
          aria-hidden="true"
        >
          <path
            d="M16 20V8m0 0l-4 4m4-4l4 4M6 22v2a2 2 0 002 2h16a2 2 0 002-2v-2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm text-text-secondary">
          Drop files here or click to browse
        </span>
        <span className="text-xs text-text-disabled">
          Documents up to 25 MB, videos up to 500 MB
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* File queue */}
      {files.length > 0 && (
        <ul className="flex max-h-[200px] flex-col gap-1 overflow-y-auto" aria-label="Selected files">
          {files.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
            >
              <FileTypeIcon name={item.file.name} />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-text-primary">{item.file.name}</p>
                {item.error ? (
                  <p className="text-xs text-status-failed">{item.error}</p>
                ) : (
                  <p className="text-xs text-text-secondary">
                    {formatFileSize(item.file.size)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeFile(item.id)}
                className="shrink-0 rounded-full p-1 text-text-secondary hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={`Remove ${item.file.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M11 3L3 11M3 3l8 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
