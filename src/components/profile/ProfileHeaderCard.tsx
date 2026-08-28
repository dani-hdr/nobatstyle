'use client'

import { Camera, Loader2, Pencil, User } from 'lucide-react'
import * as React from 'react'

import {
  Alert,
  AlertDescription
} from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import type { ProfileUser } from '@/lib/profile-types'

import { ROLE_LABELS } from '@/utils/constants'

export function ProfileHeaderCard({
  user,
  badge,
  subtitle,
  complete,
  onUpdated,
}: {
  user: ProfileUser
  badge?: React.ReactNode
  subtitle?: React.ReactNode
  /** Set to true when the profile is fully complete (no activation banner). */
  complete?: boolean
  onUpdated: () => void | Promise<void>
}) {
  const [editOpen, setEditOpen] = React.useState(false)

  const initials = (user.name || user.username || '').trim().slice(0, 2)

  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6">

      {complete === false && (
        <Alert variant='destructive'>
          <User />
          <AlertDescription>
            برای فعال‌شدن حساب خود، اطلاعات پروفایل را کامل کنید.
          </AlertDescription>
        </Alert>
      )}
      <div className="relative">
        <Avatar className="size-20 border-2 md:size-24">
          {user.avatar?.url && <AvatarImage src={user.avatar.url} alt={user.avatar.alt} />}
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          aria-label="تغییر تصویر پروفایل"
          onClick={() => setEditOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 absolute -bottom-1 -left-1 flex size-8 cursor-pointer items-center justify-center rounded-full shadow-sm transition-colors"
        >
          <Camera className="size-4" />
        </button>
      </div>

      <div className="min-w-fit flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
            {user.name || 'کاربر نوبت‌استایل'}
          </h1>
          <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
          {badge}
        </div>
        <p dir="ltr" className="text-muted-foreground mt-1 text-start text-sm">
          {user.username}
        </p>
        {subtitle}
      </div>

      <Button variant="outline" onClick={() => setEditOpen(true)}>
        <Pencil className="size-4" />
        ویرایش پروفایل
      </Button>

      <EditPersonalInfoModal
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
        onSaved={onUpdated}
      />
    </div>
  )
}

function EditPersonalInfoModal({
  open,
  onOpenChange,
  user,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: ProfileUser
  onSaved: () => void | Promise<void>
}) {
  const [name, setName] = React.useState(user.name ?? '')
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Re-sync form state whenever the modal is (re)opened.
  React.useEffect(() => {
    if (open) {
      setName(user.name ?? '')
      setFile(null)
      setPreviewUrl(null)
      setError(null)
    }
  }, [open, user])

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreviewUrl(f ? URL.createObjectURL(f) : null)
  }

  const save = async () => {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      let avatarId: string | undefined
      if (file) {
        const media = await fetch('/api/media', {
          method: 'POST',
          body: (() => {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('_payload', JSON.stringify({ alt: 'تصویر پروفایل' }))
            return fd
          })(),
        })
        if (!media.ok) throw new Error('آپلود تصویر ناموفق بود')
        const mediaData = (await media.json()) as { doc?: { id?: string } }
        avatarId = mediaData.doc?.id
        if (!avatarId) throw new Error('آپلود تصویر ناموفق بود')
      }
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ...(avatarId ? { avatarId } : {}) }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'خطا در ذخیره تغییرات')
      }
      onOpenChange(false)
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره تغییرات')
    } finally {
      setPending(false)
    }
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="border-b p-5">
        <DialogTitle>ویرایش اطلاعات شخصی</DialogTitle>
        <DialogDescription>نام و تصویر پروفایل خود را به‌روزرسانی کنید</DialogDescription>
      </DialogHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
        className="space-y-4 p-5"
      >
        <div className="flex items-center gap-4">
          <Avatar className="size-16 border">
            {(previewUrl ?? user.avatar?.url) && (
              <AvatarImage src={previewUrl ?? user.avatar!.url!} alt={user.avatar?.alt ?? ''} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {(user.name || user.username || '').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <Label
            htmlFor="avatar-upload"
            className="border-input hover:bg-muted inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
          >
            <Camera className="size-4" />
            انتخاب تصویر
          </Label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={pickFile}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-name">نام</Label>
          <Input
            id="profile-name"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام شما"
          />
        </div>

        <div className="space-y-1.5">
          <Label>شماره تماس</Label>
          <Input value={user.username} disabled dir="ltr" className="text-center" />
          <p className="text-muted-foreground text-xs">شماره تماس قابل تغییر نیست.</p>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            انصراف
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            ذخیره
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  )
}
