import type { ReactNode } from 'react'

interface GraphicCTAProps {
  icon: ReactNode
  title: string
  description: string
  onClick: () => void
}

export function GraphicCTA({ icon, title, description, onClick }: GraphicCTAProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full flex-col items-center rounded-xl border border-primary/20 bg-primary-tint p-8 text-center',
        'transition-transform duration-150 hover:scale-[1.02] hover:shadow-md',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'motion-reduce:hover:scale-100 motion-reduce:hover:shadow-none',
      ].join(' ')}
    >
      <div className="mb-4 text-primary" aria-hidden="true">
        {icon}
      </div>
      <h3 className="mb-1 text-base font-semibold text-text-primary">
        {title}
      </h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </button>
  )
}
