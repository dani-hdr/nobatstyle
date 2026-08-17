import { BadgeCheck } from 'lucide-react'
import Image from 'next/image'

import { Container } from '@/components/layout/Container'
import type { Home, Media } from '@/payload-types'

function getIconUrl(icon: Media | null | undefined) {
  return icon?.url || null
}

export function WhyUs({ items }: { items: Home['whyUs'] }) {
  if (!items || items.length === 0) return null

  return (
    <section className="bg-muted/40 py-14 md:py-20">
      <Container>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            بهترین انتخاب برای آرایش و زیبایی شما
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items
            .filter((item) => item.title)
            .map((item) => {
              const iconUrl = getIconUrl(item.icon && typeof item.icon === 'object' ? item.icon : null)
              return (
                <div
                  key={item.id}
                  className="border bg-background flex flex-col items-center gap-3 rounded-2xl p-6 text-center"
                >
                  {iconUrl ? (
                    <div className="bg-primary/10 relative size-12 overflow-hidden rounded-xl">
                      <Image
                        src={iconUrl}
                        alt={item.title || 'آیکون'}
                        fill
                        sizes="48px"
                        className="object-contain p-1.5"
                      />
                    </div>
                  ) : (
                    <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
                      <BadgeCheck className="text-primary size-6" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  {item.description && (
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  )}
                </div>
              )
            })}
        </div>
      </Container>
    </section>
  )
}
