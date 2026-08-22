'use client'

import { BadgeCheck } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import type { BarberImage } from '@/lib/barber-profile'
import { cn } from '@/utils/cn'

import { ImageLightbox } from './ImageLightbox'

export function BarberCoverGallery({
  coverImage,
  gallery,
  verified,
}: {
  coverImage: BarberImage
  gallery: BarberImage[]
  verified: boolean
}) {
  const [active, setActive] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const allImages = useMemo(() => [coverImage, ...gallery], [coverImage, gallery])
  const currentUrl = gallery[active]?.url ?? coverImage.url

  const openLightbox = () => {
    const startIndex = Math.max(
      0,
      allImages.findIndex((img) => img.url === currentUrl),
    )
    setLightboxIndex(startIndex)
  }

  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted">
        <button
          type="button"
          onClick={openLightbox}
          aria-label="مشاهده گالری"
          className="group absolute inset-0 size-full cursor-zoom-in"
        >
          <Image
            src={currentUrl}
            alt={gallery[active]?.alt ?? coverImage.alt}
            fill
            priority
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover transition-all duration-300 group-hover:scale-[1.02]"
          />
        </button>
        {verified && (
          <Badge variant="secondary" className="bg-background/90 absolute top-3 start-3 gap-1 shadow-sm">
            <BadgeCheck className="size-3.5 text-emerald-500" />
            تایید شده
          </Badge>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {gallery.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={img.alt}
              className={cn(
                'relative aspect-square overflow-hidden rounded-lg border transition-all',
                i === active ? 'ring-primary ring-2' : 'opacity-70 hover:opacity-100',
              )}
            >
              <Image src={img.url} alt={img.alt} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <ImageLightbox
        images={allImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  )
}
