interface CircularGaugeProps {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
}

export function CircularGauge({
  value,
  size = 120,
  strokeWidth = 8,
  label,
}: CircularGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference
  const center = size / 2

  return (
    <div
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `${clamped}%`}
      className="inline-flex flex-col items-center"
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-surface)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>

      {/* Centered value */}
      <span
        className="text-xl font-semibold text-text-primary"
        style={{
          marginTop: -(size / 2 + 12),
          position: 'relative',
        }}
        aria-hidden="true"
      >
        {clamped}%
      </span>

      {/* Spacer to restore layout flow after negative margin */}
      <div style={{ height: size / 2 - 12 }} />

      {label && (
        <span className="mt-1 text-xs text-text-secondary">{label}</span>
      )}
    </div>
  )
}
