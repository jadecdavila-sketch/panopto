import type { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateAction {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: EmptyStateAction
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 text-text-disabled" aria-hidden="true">
        {icon}
      </div>
      <h3 className="mb-1 text-base font-semibold text-text-primary">
        {title}
      </h3>
      <p className="mb-6 max-w-sm text-sm text-text-secondary">
        {description}
      </p>
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
