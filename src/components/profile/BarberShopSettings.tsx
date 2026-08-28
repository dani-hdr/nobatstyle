'use client'

import { ImagePlus, Loader2, MapPin, Save, Store, X } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { LocationPicker, type MapPoint } from '@/components/map/LocationPicker'
import type { ProfileBarber } from '@/lib/profile-types'
import { cn } from '@/utils/cn'

type CityOption = { id: string; name: string }

export function BarberShopSettings({
  barber,
  creating,
  onUpdated,
}: {
  barber: ProfileBarber | null
  creating: boolean
  onUpdated: () => void | Promise<void>
}) {
  const [cities, setCities] = React.useState<CityOption[] | null>(null)
  const [shopName, setShopName] = React.useState(barber?.shopName ?? '')
  const [cityId, setCityId] = React.useState<string>(barber?.cityId ?? '')
  const [address, setAddress] = React.useState(barber?.address ?? '')
  const [phone, setPhone] = React.useState(barber?.phone ?? '')
  const [about, setAbout] = React.useState(barber?.about ?? '')
  const [experienceYears, setExperienceYears] = React.useState(String(barber?.experienceYears ?? 0))
  const [location, setLocation] = React.useState<MapPoint | null>(barber?.location ?? null)
  const [pending, setPending] = React.useState(false)
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/cities?limit=400&sort=name', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as { docs?: CityOption[] }
        if (!cancelled) setCities(data.docs ?? [])
      } catch {
        // Non-critical.
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: {
            shopName,
            cityId: cityId || null,
            address,
            phone,
            about,
            experienceYears: Number(experienceYears) || 0,
            location: location ? [location.lng, location.lat] : null,
          },
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'خطا در ذخیره اطلاعات')
      }
      setMessage({ ok: true, text: 'اطلاعات آرایشگاه ذخیره شد.' })
      await onUpdated()
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'خطا در ذخیره اطلاعات' })
    } finally {
      setPending(false)
    }
  }

  const canSave = shopName.trim().length > 0 && Boolean(cityId)

  return (
    <Card className="py-0">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="flex items-center gap-2 text-base">
          <Store className="text-primary size-4.5" />
          اطلاعات آرایشگاه
        </CardTitle>
        {creating ? (
          <CardDescription>
            هنوز پروفایل آرایشگاهی نساخته‌اید؛ نام و شهر را وارد کنید تا پروفایل شما ساخته شود.
          </CardDescription>
        ) : (
          <CardDescription>
            این اطلاعات در صفحه عمومی آرایشگاه شما نمایش داده می‌شود.
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="px-5 pb-5">
        {!creating && barber && (
          <div className="mb-6 space-y-4">
            <CoverManager barber={barber} onUpdated={onUpdated} />
            <GalleryManager barber={barber} onUpdated={onUpdated} />
          </div>
        )}

        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="shop-name">نام آرایشگاه *</Label>
              <Input
                id="shop-name"
                value={shopName}
                maxLength={80}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="مثلاً آرایشگاه آقای پیرایش"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>شهر *</Label>
              <Select value={cityId} onValueChange={setCityId} dir="rtl">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب شهر" />
                </SelectTrigger>
                <SelectContent>
                  {cities === null ? (
                    <div className="p-2">
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shop-phone">شماره تماس آرایشگاه</Label>
              <Input
                id="shop-phone"
                dir="ltr"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="02112345678"
                className="text-start"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shop-experience">سال سابقه</Label>
              <Input
                id="shop-experience"
                dir="ltr"
                inputMode="numeric"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value.replace(/[^\d]/g, ''))}
                className="text-start"
              />
            </div>
          </div>

            <div className="space-y-1.5">
              <Label htmlFor="shop-address">آدرس</Label>
              <div className="relative">
                <MapPin className="text-muted-foreground pointer-events-none absolute top-2.5 start-3 size-4" />
                <Input
                  id="shop-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="خیابان، کوچه، پلاک"
                  className="ps-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>موقعیت روی نقشه</Label>
              <LocationPicker value={location} onChange={setLocation} />
            </div>

          <div className="space-y-1.5">
            <Label htmlFor="shop-about">درباره آرایشگاه</Label>
            <Textarea
              id="shop-about"
              value={about}
              rows={4}
              maxLength={1000}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="چند جمله‌ای درباره خدمات و سبک کاری خود بنویسید…"
            />
          </div>

          {message && (
            <p className={cn('text-sm', message.ok ? 'text-emerald-600' : 'text-destructive')}>
              {message.text}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !canSave}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              ذخیره تغییرات
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/** Cover image with click-to-replace upload; saves immediately. */
function CoverManager({
  barber,
  onUpdated,
}: {
  barber: ProfileBarber
  onUpdated: () => void | Promise<void>
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const changeCover = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('_payload', JSON.stringify({ alt: `کاور ${barber.shopName}` }))
      const mediaRes = await fetch('/api/media', { method: 'POST', body: fd })
      if (!mediaRes.ok) throw new Error()
      const mediaData = (await mediaRes.json()) as { doc?: { id?: string } }
      const coverId = mediaData.doc?.id
      if (!coverId) throw new Error()

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: { coverId } }),
      })
      if (!res.ok) throw new Error()
      await onUpdated()
    } catch {
      setError('آپلود تصویر کاور ناموفق بود.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>تصویر کاور</Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="group bg-muted relative block h-36 w-full cursor-pointer overflow-hidden rounded-xl border border-dashed md:h-44"
      >
        {barber.cover?.url && (
          <Image
            src={barber.cover.url}
            alt={barber.cover.alt}
            fill
            sizes="(max-width: 768px) 100vw, 700px"
            className="object-cover"
          />
        )}
        <span className="bg-background/70 text-foreground absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {barber.cover?.url ? 'تغییر تصویر کاور' : 'افزودن تصویر کاور'}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void changeCover(f)
          e.target.value = ''
        }}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}

/** Gallery thumbnails; every add/remove is saved immediately. */
function GalleryManager({
  barber,
  onUpdated,
}: {
  barber: ProfileBarber
  onUpdated: () => void | Promise<void>
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)
  const [removingId, setRemovingId] = React.useState<string | null>(null)

  const patchGallery = async (ids: string[]) => {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop: { galleryIds: ids } }),
    })
    if (!res.ok) throw new Error()
    await onUpdated()
  }

  const removeImage = async (id: string) => {
    if (busy) return
    setBusy(true)
    setRemovingId(id)
    try {
      await patchGallery(barber.gallery.map((g) => g.id).filter((gid) => gid !== id))
    } catch {
      // Keep UI consistent even if the request failed.
    } finally {
      setBusy(false)
      setRemovingId(null)
    }
  }

  const addImages = async (files: File[]) => {
    if (files.length === 0 || busy) return
    setBusy(true)
    try {
      const ids: string[] = [...barber.gallery.map((g) => g.id)]
      for (const f of files.slice(0, 10)) {
        const fd = new FormData()
        fd.append('file', f)
        fd.append('_payload', JSON.stringify({ alt: `گالری ${barber.shopName}` }))
        const mediaRes = await fetch('/api/media', { method: 'POST', body: fd })
        if (!mediaRes.ok) continue
        const mediaData = (await mediaRes.json()) as { doc?: { id?: string } }
        if (mediaData.doc?.id) ids.push(mediaData.doc.id)
      }
      await patchGallery(ids)
    } catch {
      // Ignore partial failures; the reload shows current state.
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>گالری تصاویر</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          افزودن تصاویر
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            void addImages(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
      </div>

      {barber.gallery.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
          تصویری در گالری نیست؛ تصاویر این‌جا در صفحه عمومی آرایشگاه نمایش داده می‌شود.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {barber.gallery.map((g) => (
            <div
              key={g.id}
              className="bg-muted group relative aspect-square overflow-hidden rounded-lg border"
            >
              {g.url && (
                <Image src={g.url} alt={g.alt} fill sizes="140px" className="object-cover" />
              )}
              <button
                type="button"
                aria-label="حذف تصویر"
                disabled={busy}
                onClick={() => void removeImage(g.id)}
                className="bg-destructive text-white absolute top-1 end-1 flex size-6 cursor-pointer items-center justify-center rounded-full opacity-90 transition-opacity hover:opacity-100"
              >
                {removingId === g.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <X className="size-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
