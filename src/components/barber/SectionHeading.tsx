import { cn } from '@/utils/cn'

export function SectionHeading({
  title,
  subtitle,
  action,
  className,
  as: Tag = 'h2',
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3'
}) {
  return (
    <div className={cn('mb-6 flex items-end justify-between gap-4', className)}>
      <div>
        <Tag className="text-xl font-bold tracking-tight md:text-2xl">{title}</Tag>
        {subtitle && <p className="text-muted-foreground mt-1.5 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
