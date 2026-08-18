'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { PREVIEW_LIMITS, type BarberImage } from '@/lib/barber-profile'

import { SectionHeading } from './SectionHeading'

export function BarberPortfolio({ images }: { images: BarberImage[] }) {
  const [showAll, setShowAll] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const visible = showAll ? images : images.slice(0, PREVIEW_LIMITS.portfolio)
  const hasMore = images.length > PREVIEW_LIMITS.portfolio

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const go = useCallback(
    (dir: 1 | -1) => {
      setLightboxIndex((idx) =>
        idx === null ? idx : (idx + dir + images.length) % images.length,
      )
    },
    [images.length],
  )

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') go(-1)
      if (e.key === 'ArrowLeft') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, closeLightbox, go])

  return (
    <section id="portfolio" className="scroll-mt-20">
      <SectionHeading
        title="نمونه کارها"
        subtitle="نمونه‌هایی از کارهای این آرایشگر"
        action={
          hasMore ? (
            <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'نمایش کمتر' : 'مشاهده همه'}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((img, i) => (
          <button
            key={img.url}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="group relative aspect-[4/5] overflow-hidden rounded-xl border bg-muted"
            aria-label={img.alt}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Dialog open={lightboxIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent
          showCloseButton={false}
          className="max-w-4xl overflow-hidden border-0 bg-black/90 p-0 ring-black/50"
        >
          {lightboxIndex !== null && (
            <>
              <div className="relative aspect-[4/5] w-full max-h-[80dvh]">
                <Image
                  src={images[lightboxIndex].url}
                  alt={images[lightboxIndex].alt}
                  fill
                  sizes="80vw"
                  className="object-contain"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => go(-1)}
                className="absolute top-1/2 start-3 -translate-y-1/2 text-white"
                aria-label="قبلی"
              >
                <ChevronRight className="size-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => go(1)}
                className="absolute top-1/2 end-3 -translate-y-1/2 text-white"
                aria-label="بعدی"
              >
                <ChevronLeft className="size-6" />
              </Button>

              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="absolute top-3 end-3 text-white">
                  <X className="size-5" />
                </Button>
              </DialogClose>

              <div className="flex items-center justify-center gap-1.5 py-3">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={
                      i === lightboxIndex
                        ? 'bg-white size-1.5 rounded-full'
                        : 'bg-white/40 size-1.5 rounded-full'
                    }
                  />
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
