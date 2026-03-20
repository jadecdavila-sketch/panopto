import type { ReactNode } from 'react'

interface KPICardProps {
  label: string
  value: string | number | null | undefined
  icon?: ReactNode
}

export function KPICard({ label, value, icon }: KPICardProps) {
  const displayValue = value != null ? String(value) : '\u2014'

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-secondary">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-primary">
            {displayValue}
          </p>
        </div>
        {icon && (
          <div aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
