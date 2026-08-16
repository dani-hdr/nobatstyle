'use client'

import { Search } from 'lucide-react'
import * as React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function SearchDialog({ trigger }: { trigger: React.ReactNode }) {
  const [value, setValue] = React.useState('')

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="sr-only">جستجو</DialogTitle>
        <DialogDescription className="sr-only">جستجوی آرایشگر، سالن یا خدمت</DialogDescription>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2" />
          <input
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="جستجو آرایشگر، سالن یا خدمت..."
            className="focus-visible:ring-ring h-11 w-full rounded-xl border border-input bg-transparent pe-4 ps-10 text-sm outline-none transition-colors placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-muted-foreground text-xs">
          با تایپ نمادها و نکات جستجو، نتایج پیشنهادی در اینجا نمایش داده می‌شوند.
        </p>
      </DialogContent>
    </Dialog>
  )
}
