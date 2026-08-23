'use client'

import { Scissors } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PREVIEW_LIMITS, type BarberService } from '@/lib/barber-profile'

import { SectionHeading } from './SectionHeading'

export function BarberServices({ services }: { services: BarberService[] }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? services : services.slice(0, PREVIEW_LIMITS.services)
  const hasMore = services.length > PREVIEW_LIMITS.services

  return (
    <section id="services" className="scroll-mt-20">
      <SectionHeading title="خدمات" subtitle="انتخاب خدمت موردنظر و رزرو آنلاین" />
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((service) => (
          <Card key={service.id} className="gap-0 overflow-hidden py-0">
            <CardContent className="flex h-full flex-col p-0">
              <div className="bg-muted relative aspect-[4/3] w-full">
                {service.image?.url ? (
                  <Image
                    src={service.image.url}
                    alt={service.image.alt || service.name}
                    fill
                    sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground flex size-full items-center justify-center">
                    <Scissors className="size-7" />
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="font-semibold">{service.name}</h3>
                {service.description && (
                  <p className="text-muted-foreground text-sm leading-6">
                    {service.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'نمایش کمتر' : 'مشاهده همه'}
          </Button>
        </div>
      )}
    </section>
  )
}
