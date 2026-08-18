import { Card, CardContent } from '@/components/ui/card'
import type { BarberStat } from '@/lib/barber-profile'

export function BarberStats({ stats }: { stats: BarberStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="py-0">
          <CardContent className="px-4 py-5 text-center md:py-6">
            <p className="text-accent-foreground text-xl font-extrabold md:text-2xl">{stat.value}</p>
            <p className="text-muted-foreground mt-1 text-xs md:text-sm">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
