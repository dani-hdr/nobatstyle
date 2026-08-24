'use client'

import { ChevronLeft, ChevronRight, Scissors } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'

import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/button'
import type { Service } from '@/payload-types'

function getIconUrl(icon: Service['icon']) {
  return typeof icon === 'object' && icon?.url ? icon.url : null
}

export function PopularServices({ services }: { services: Service[] }) {
  const trackRef = useRef<HTMLDivElement>(null)

  if (services.length === 0) return null

  const scroll = (delta: number) => {
    trackRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
  }
  const step = () => {
    const el = trackRef.current
    return el ? Math.round(el.clientWidth * 0.8) : 240
  }

  return (
    <section className="py-14 md:py-20">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">خدمات محبوب</h2>
            <p className="text-muted-foreground mt-2 text-sm">همه خدمات آرایشگاهی روی پلتفرم</p>
          </div>
          <div className="hidden shrink-0 gap-2 md:flex">
            <Button
              variant="outline"
              size="icon"
              aria-label="خدمات قبلی"
              onClick={() => scroll(step())}
            >
              <ChevronRight className="size-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="خدمات بعدی"
              onClick={() => scroll(-step())}
            >
              <ChevronLeft className="size-5" />
            </Button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="snap-x snap-mandatory flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {services.map((service) => {
            const iconUrl = getIconUrl(service.icon)

            return (
              <Link
                key={service.id}
                href={`/barbers?service=${service.id}`}
                className="hover:bg-accent border bg-background flex w-44 shrink-0 snap-start flex-col gap-4 rounded-2xl p-4 transition-colors sm:w-52"
              >
                <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                  {iconUrl ? (
                    <Image
                      src={iconUrl}
                      alt={service.name}
                      fill
                      sizes="(min-width: 640px) 208px, 176px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="bg-primary/10 flex size-full items-center justify-center">
                      <Scissors className="text-primary size-8" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold">{service.name}</h3>
                  {service.description && (
                    <p className="text-muted-foreground line-clamp-2 text-xs">{service.description}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
