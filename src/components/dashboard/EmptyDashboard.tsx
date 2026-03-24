import { GraphicCTA } from '../ui/GraphicCTA'
import panoptoLogo from '../../assets/panopto-logo.svg'

interface EmptyDashboardProps {
  onCreateTopic: () => void
  onAddAsset: () => void
  onLoadSampleData?: () => void
}

export function EmptyDashboard({ onCreateTopic, onAddAsset, onLoadSampleData }: EmptyDashboardProps) {
  return (
    <div
      className="flex h-full flex-1 flex-col items-center justify-center px-6 py-16"
      style={{ background: 'linear-gradient(180deg, #FBFEFB 0%, #F1FDF8 100%)' }}
    >
      <img
        src={panoptoLogo}
        alt="Panopto Learning Assistant"
        className="mb-8 h-10"
      />

      <h1
        className="mb-3 text-center text-text-primary"
        style={{ fontSize: '48px', fontWeight: 300 }}
      >
        Welcome to Panopto Folio
      </h1>

      <p className="mb-10 max-w-xl text-center text-base text-text-secondary">
        Your AI-powered study companion. Organize your materials into folios,
        then let Folio AI transform them into flashcards, quizzes, and mind maps.
      </p>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        <GraphicCTA
          icon={
            <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path
                d="M6 8a2 2 0 012-2h8l3 3h13a2 2 0 012 2v20a2 2 0 01-2 2H8a2 2 0 01-2-2V8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 17v10M15 22h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          }
          title="Add a Folio"
          description="Organize your learning by subject or course"
          onClick={onCreateTopic}
        />

        <GraphicCTA
          icon={
            <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path
                d="M20 6v18M12 16l8 8 8-8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 28v4a2 2 0 002 2h24a2 2 0 002-2v-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          title="Add Learning Materials"
          description="Import a Panopto video or upload a file to get started"
          onClick={onAddAsset}
        />
      </div>

      {onLoadSampleData && (
        <button
          type="button"
          onClick={onLoadSampleData}
          className="mt-4 w-full max-w-2xl cursor-pointer rounded-xl border border-border bg-background px-6 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Load sample data
        </button>
      )}
    </div>
  )
}
