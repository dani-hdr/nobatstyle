import { Award, CalendarCheck, MessageSquareText, ThumbsUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { BarberStat, BarberStatIcon } from '@/lib/barber-profile'
import type { LucideIcon } from 'lucide-react'

const STAT_ICONS: Record<BarberStatIcon, LucideIcon> = {
  slots: CalendarCheck,
  satisfaction: ThumbsUp,
  reviews: MessageSquareText,
  experience: Award,
}

export function BarberStats({ stats }: { stats: BarberStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon ? STAT_ICONS[stat.icon] : null
        return (
          <Card
            key={stat.label}
            className="py-0 bg-primary/20 text-muted border border-primary-foreground/20"
          >
            <CardContent className="px-4 py-5 text-center md:py-6">
              {Icon && (
                <span className="bg-primary/20 mx-auto mb-2 flex size-9 items-center justify-center rounded-full text-accent md:size-10">
                  <Icon className="size-4.5 md:size-5" />
                </span>
              )}
              <p className="text-accent text-xl font-extrabold md:text-2xl">{stat.value}</p>
              <p className="text-muted mt-1 text-xs md:text-sm">{stat.label}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
