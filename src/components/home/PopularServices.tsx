import { Clock, MapPin, Scissors } from 'lucide-react'
import Link from 'next/link'

import type { Home, Service } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/Container'

function isService(value: string | Service): value is Service {
  return typeof value !== 'string'
}

export function PopularServices({ services }: { services: Home['popularServices'] }) {
  const items = (services ?? []).filter(isService)
  const [barber, city] = useBarberCity(items)

  if (items.length === 0) return null

  return (
    <section className="py-14 md:py-20">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">خدمات محبوب</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              پرتقاضاترین خدمات آرایشگاهی روی پلتفرم
            </p>
          </div>
          <Button asChild variant="ghost" className="shrink-0">
            <Link href="/services">مشاهده همه</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((service) => {
            const shopName = barber.get(service.id)?.shopName
            const cityName = city.get(service.id)?.name

            return (
              <Link
                key={service.id}
                href={`/barbers/${barber.get(service.id)?.id ?? ''}`}
                className="group hover:bg-accent border bg-background flex flex-col gap-4 rounded-2xl p-5 transition-colors"
              >
                <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
                  <Scissors className="text-primary size-6" />
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-pretty font-semibold">{service.name}</h3>
                  <p className="text-muted-foreground text-sm">{shopName || service.description}</p>
                  <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {service.duration} دقیقه
                    </span>
                    {cityName && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {cityName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t pt-4">
                  <span className="text-lg font-bold">
                    {service.price.toLocaleString('fa-IR')}
                    <span className="text-muted-foreground text-sm font-normal"> تومان</span>
                  </span>
                  <span className="text-primary text-sm font-medium group-hover:underline">
                    رزرو نوبت
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

function useBarberCity(items: Service[]) {
  const barber = new Map<string, { id: string; shopName?: string | null }>()
  const city = new Map<string, { name?: string | null }>()

  for (const service of items) {
    if (typeof service.barber !== 'string' && service.barber) {
      const b = service.barber
      barber.set(service.id, {
        id: b.id,
        shopName: b.shopName,
      })
      if (typeof b.city !== 'string' && b.city?.name) {
        city.set(service.id, { name: b.city.name })
      }
    }
  }

  return [barber, city] as const
}
