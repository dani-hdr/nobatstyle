import { MapPin, Search, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/layout/Container'
import { getBarbers } from '@/lib/barbers'

export default async function BarbersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string }>
}) {
  const { q, city } = await searchParams
  const { docs, total } = await getBarbers({ q, city })

  // Best-effort city name from the returned barbers (only if the filter matched).
  const matchedCity = docs
    .map((d) => d.city)
    .find((c): c is { id: string; name: string } => typeof c === 'object' && c?.id === city)

  return (
    <Container className="py-10 md:py-14">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">آرایشگرها</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {total} آرایشگر فعال
          {(q || matchedCity?.name) && (
            <>
              {' '}
              برای «{q || matchedCity?.name}»
            </>
          )}
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="border rounded-2xl p-12 text-center">
          <Search className="text-muted-foreground mx-auto mb-3 size-8" />
          <p className="text-muted-foreground text-sm">آرایشگری یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((barber) => (
            <Link
              key={barber.id}
              href={`/barbers/${barber.shopSlug || barber.id}`}
              className="hover:bg-accent border bg-background flex items-center gap-4 rounded-2xl p-4 transition-colors"
            >
              <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-2xl">
                {barber.avatar && typeof barber.avatar === 'object' && barber.avatar.url ? (
                  <Image
                    src={barber.avatar.url}
                    alt={barber.avatar.alt || barber.shopName}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground flex size-full items-center justify-center text-lg font-bold">
                    {barber.shopName.slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{barber.shopName}</h3>
                {typeof barber.city === 'object' && barber.city?.name && (
                  <span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                    <MapPin className="size-3" />
                    {barber.city.name}
                  </span>
                )}
              </div>

              {barber.rating ? (
                <div className="flex shrink-0 flex-col items-center">
                  <span className="flex items-center gap-1 text-sm font-semibold">
                    <Star className="fill-amber-400 size-4 text-amber-400" />
                    {barber.rating.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {(barber.reviewCount ?? 0).toLocaleString('fa-IR')} بازخورد
                  </span>
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </Container>
  )
}
