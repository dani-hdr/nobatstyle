'use client'

import { Check } from 'lucide-react'
import * as React from 'react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PREVIEW_LIMITS, formatDuration, formatPrice, type BarberService } from '@/lib/barber-profile'

import { BookingTrigger } from './booking/BookingTrigger'
import { SectionHeading } from './SectionHeading'

export function BarberServices({ services }: { services: BarberService[] }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? services : services.slice(0, PREVIEW_LIMITS.services)
  const hasMore = services.length > PREVIEW_LIMITS.services

  return (
    <section id="services" className="scroll-mt-20">
      <SectionHeading title="خدمات" subtitle="انتخاب خدمت موردنظر و رزرو آنلاین" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((service) => (
          <Card key={service.id} className="gap-0 py-5">
            <CardContent className="flex h-full flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{service.name}</h3>
                {service.popular && (
                  <Badge variant="success" className="shrink-0">
                    پرفروش
                  </Badge>
                )}
              </div>
              {service.description && (
                <p className="text-muted-foreground flex-1 text-sm leading-6">
                  {service.description}
                </p>
              )}

              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <span>{formatDuration(service.durationMinutes)}</span>
                {formatPrice(service.price) && (
                  <span className="font-medium text-foreground">{formatPrice(service.price)}</span>
                )}
              </div>

              <BookingTrigger
                initialServiceId={service.id}
                variant="outline"
                size="sm"
                className="mt-1 w-full rounded-lg"
              >
                <Check className="size-4" />
                انتخاب خدمت
              </BookingTrigger>
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
