'use client'

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
          <Card key={service.id} className="gap-0 py-5">
            <CardContent className="flex h-full flex-col gap-2">
              <h3 className="font-semibold">{service.name}</h3>
              {service.description && (
                <p className="text-muted-foreground text-sm leading-6">
                  {service.description}
                </p>
              )}
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
