import { KPICard } from '../ui/KPICard'
import type { DashboardKPI } from '../../types/domain'

interface KPIStripProps {
  kpis: DashboardKPI
}

export function KPIStrip({ kpis }: KPIStripProps) {
  const accuracyDisplay =
    kpis.overallAccuracy != null ? `${kpis.overallAccuracy}%` : null

  const quizDisplay =
    kpis.overallQuizBest != null ? `${kpis.overallQuizBest}%` : null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KPICard
        label="Study Streak"
        value={`${kpis.studyStreak} days`}
        icon={
          <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
              clipRule="evenodd"
            />
          </svg>
        }
      />

      <KPICard
        label="Flashcard Accuracy"
        value={accuracyDisplay}
        icon={
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M2 4.5A2.5 2.5 0 014.5 2h5A2.5 2.5 0 0112 4.5v11a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 012 15.5v-11z" />
            <path d="M8 4.5A2.5 2.5 0 0110.5 2h5A2.5 2.5 0 0118 4.5v11a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 018 15.5v-11z" opacity="0.5" />
          </svg>
        }
      />

      <KPICard
        label="Quiz Best Score"
        value={quizDisplay}
        icon={
          <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 1l2.928 6.472L20 8.417l-5.236 4.614L16.18 20 10 16.472 3.82 20l1.416-6.969L0 8.417l7.072-.945L10 1z"
              clipRule="evenodd"
            />
          </svg>
        }
      />
    </div>
  )
}
