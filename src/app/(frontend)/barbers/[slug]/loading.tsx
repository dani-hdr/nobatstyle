import { Container } from '@/components/layout/Container'
import { Skeleton } from '@/components/ui/skeleton'

export default function BarberLoading() {
  return (
    <Container className="space-y-12 py-6 md:py-10">
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <div className="relative">
          <Skeleton className="aspect-[4/3] h-auto w-full rounded-2xl" />
          <div className="mt-3 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border p-6">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </Container>
  )
}
