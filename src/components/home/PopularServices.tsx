import { Scissors } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/button'
import type { Home, Service } from '@/payload-types'

function isService(value: string | Service): value is Service {
  return typeof value !== 'string'
}

function getIconUrl(icon: Service['icon']) {
  return typeof icon === 'object' && icon?.url ? icon.url : null
}

export function PopularServices({ services }: { services: Home['popularServices'] }) {
  const items = (services ?? []).filter(isService)

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

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((service) => {
            const iconUrl = getIconUrl(service.icon)

            return (
              <div
                key={service.id}
                className="border bg-background flex flex-col gap-4 rounded-2xl p-4"
              >
                <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                  {iconUrl ? (
                    <Image
                      src={iconUrl}
                      alt={service.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="bg-primary/10 flex size-full items-center justify-center">
                      <Scissors className="text-primary size-8" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="md:text-lg font-semibold">{service.name}</h3>
                  {service.description && (
                    <p className="text-muted-foreground text-xs md:text-sm">{service.description}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
