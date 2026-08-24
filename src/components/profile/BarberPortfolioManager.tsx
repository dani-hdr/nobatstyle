'use client'

import { ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import type { ProfilePortfolioItem } from '@/lib/profile-types'

export function BarberPortfolioManager({
  barberId,
  items,
  onUpdated,
}: {
  barberId: string
  items: ProfilePortfolioItem[]
  onUpdated: () => void | Promise<void>
}) {
  const [addOpen, setAddOpen] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const removeItem = async (id: string) => {
    if (deletingId) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
      if (res.ok) await onUpdated()
    } catch {
      // Reload below reflects the real state.
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card className="py-0">
      <CardHeader className="flex-row items-start justify-between space-y-0 px-5 pt-5">
        <div className="space-y-1.5">
          <CardTitle className="text-base">نمونه‌کارها</CardTitle>
          <CardDescription>
            تصاویری از سبک کاری خود برای نمایش در صفحه عمومی اضافه کنید.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          افزودن
        </Button>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {items.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
            هنوز نمونه‌کاری ثبت نکرده‌اید.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <figure
                key={item.id}
                className="group bg-muted relative overflow-hidden rounded-xl border"
              >
                <div className="relative aspect-square">
                  {item.image?.url && (
                    <Image
                      src={item.image.url}
                      alt={item.image.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, 220px"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <figcaption className="bg-background/90 absolute inset-x-0 bottom-0 truncate px-2 py-1.5 text-xs font-medium backdrop-blur-sm">
                  {item.title}
                </figcaption>
                <button
                  type="button"
                  aria-label={`حذف ${item.title}`}
                  disabled={Boolean(deletingId)}
                  onClick={() => void removeItem(item.id)}
                  className="bg-destructive text-white absolute top-2 end-2 flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs opacity-0 shadow-sm transition-opacity group-hover:opacity-100 disabled:opacity-60"
                >
                  {deletingId === item.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Trash2 className="size-3" />
                  )}
                  حذف
                </button>
              </figure>
            ))}
          </div>
        )}
      </CardContent>

      <AddPortfolioModal
        open={addOpen}
        onOpenChange={setAddOpen}
        barberId={barberId}
        onSaved={async () => {
          setAddOpen(false)
          await onUpdated()
        }}
      />
    </Card>
  )
}

function AddPortfolioModal({
  open,
  onOpenChange,
  barberId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  barberId: string
  onSaved: () => void | Promise<void>
}) {
  const [title, setTitle] = React.useState('')
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setTitle('')
      setFile(null)
      setPreviewUrl(null)
      setError(null)
    }
  }, [open])

  const submit = async () => {
    if (pending) return
    if (!title.trim() || !file) {
      setError('عنوان و تصویر الزامی است.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('alt', title.trim())
      const mediaRes = await fetch('/api/media', { method: 'POST', body: fd })
      if (!mediaRes.ok) throw new Error('آپلود تصویر ناموفق بود')
      const mediaData = (await mediaRes.json()) as { doc?: { id?: string } }
      const imageId = mediaData.doc?.id
      if (!imageId) throw new Error('آپلود تصویر ناموفق بود')

      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), barber: barberId, image: imageId }),
      })
      if (!res.ok) throw new Error('ثبت نمونه‌کار ناموفق بود')
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطایی رخ داد')
    } finally {
      setPending(false)
    }
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="border-b p-5">
        <DialogTitle>افزودن نمونه‌کار</DialogTitle>
        <DialogDescription>یک عنوان و تصویر انتخاب کنید</DialogDescription>
      </DialogHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className="space-y-4 p-5"
      >
        <label className="bg-muted hover:bg-muted/70 flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="پیش‌نمایش" className="h-full w-full object-cover" />
          ) : (
            <span className="text-muted-foreground flex flex-col items-center gap-2 text-sm">
              {pending ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <ImagePlus className="size-6" />
              )}
              انتخاب تصویر
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setFile(f)
              setPreviewUrl(f ? URL.createObjectURL(f) : null)
            }}
          />
        </label>

        <div className="space-y-1.5">
          <Label htmlFor="portfolio-title">عنوان</Label>
          <Input
            id="portfolio-title"
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً فید اینی و فِید کلاسیک"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            انصراف
          </Button>
          <Button type="submit" disabled={pending || !title.trim() || !file}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            ثبت نمونه‌کار
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  )
}
