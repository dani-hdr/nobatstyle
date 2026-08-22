'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import type { BarberImage } from '@/lib/barber-profile'

/**
 * Full-screen modal slider for an image list. Controlled: pass the open index
 * (or `null` when closed) and handle `onIndexChange` / `onClose` in the parent.
 */
export function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: BarberImage[]
  index: number | null
  onClose: () => void
  onIndexChange: (index: number) => void
}) {
  const go = useCallback(
    (dir: 1 | -1) => {
      if (index === null || images.length === 0) return
      onIndexChange((index + dir + images.length) % images.length)
    },
    [index, images.length, onIndexChange],
  )

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(-1)
      if (e.key === 'ArrowLeft') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, onClose, go])

  return (
    <Dialog open={index !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl overflow-hidden border-0 bg-black/90 p-0 ring-black/50"
      >
        {index !== null && (
          <>
            <div className="relative aspect-[4/5] max-h-[80dvh] w-full">
              <Image
                src={images[index].url}
                alt={images[index].alt}
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
                <button
                  key={i}
                  type="button"
                  onClick={() => onIndexChange(i)}
                  aria-label={`تصویر ${i + 1}`}
                  className={
                    i === index ? 'bg-white size-1.5 rounded-full' : 'bg-white/40 size-1.5 rounded-full'
                  }
                />
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
