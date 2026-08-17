import { MapPin, Search, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { BarberFilters } from '@/components/barbers/BarberFilters'
import { Pagination } from '@/components/barbers/Pagination'
import { Container } from '@/components/layout/Container'
import { getCities } from '@/lib/barber-search'
import { getBarbers } from '@/lib/barbers'
import config from '@payload-config'
import { getPayload } from 'payload'

export default async function BarbersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; service?: string; page?: string }>
}) {
  const { q, city, service, page } = await searchParams

  const currentPage = Math.max(1, parseInt(page ?? '1', 10) || 1)

  const [barbers, cities, services] = await Promise.all([
    getBarbers({ q, city, service, page: currentPage }),
    getCities(),
    payloadFindActiveServices(),
  ])
  const { docs, total, totalPages } = barbers

  const allCities = cities.flatMap((g) => g.cities)
  const matchedCity = city ? allCities.find((c) => c.id === city) : undefined
  const matchedService = service ? services.find((s) => s.id === service) : undefined

  const filterLabel = q || matchedCity?.name || matchedService?.name

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (city) params.set('city', city)
    if (service) params.set('service', service)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/barbers?${qs}` : '/barbers'
  }

  const hasFilters = Boolean(q || city || service)

  return (
    <Container className="py-10 md:py-14">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">آرایشگرها</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {total.toLocaleString('fa-IR')} آرایشگر فعال
          {filterLabel && <> برای «{filterLabel}»</>}
        </p>
      </div>

      <BarberFilters cities={cities} services={services} />

      {docs.length === 0 ? (
        <div className="border rounded-2xl p-12 text-center">
          <Search className="text-muted-foreground mx-auto mb-3 size-8" />
          <p className="text-muted-foreground text-sm">
            {hasFilters ? 'آرایشگری با این فیلترها یافت نشد.' : 'آرایشگری یافت نشد.'}
          </p>
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

      <Pagination
        currentPage={currentPage}
        totalPages={Math.max(1, totalPages)}
        buildHref={buildPageHref}
      />
    </Container>
  )
}

async function payloadFindActiveServices() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'services',
    where: { isActive: { equals: true } },
    sort: 'name',
    limit: 1000,
    depth: 0,
  })
  return docs.map((d) => ({ id: d.id, name: d.name }))
}
