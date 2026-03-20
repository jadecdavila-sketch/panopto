type SkeletonVariant = 'text' | 'rect' | 'circle'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'rounded',
  rect: 'rounded-lg',
  circle: 'rounded-full',
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const defaultHeight = variant === 'text' ? 16 : undefined
  const resolvedWidth =
    variant === 'circle' && !width && height ? height : width
  const resolvedHeight =
    variant === 'circle' && !height && width ? width : (height ?? defaultHeight)

  return (
    <div
      aria-hidden="true"
      className={[
        'animate-shimmer',
        variantClasses[variant],
        className,
      ].join(' ')}
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
        backgroundImage:
          'linear-gradient(90deg, #F5F5F5 25%, #EBEBEB 50%, #F5F5F5 75%)',
        backgroundSize: '200% 100%',
      }}
    />
  )
}
