'use client'

import { Search } from 'lucide-react'
import * as React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function SearchDialog({ trigger }: { trigger: React.ReactNode }) {
  const [value, setValue] = React.useState('')

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent aria-describedby={undefined}>
          <DialogHeader>
             <DialogTitle className="sr-only"></DialogTitle>
              <DialogDescription className="sr-only">جستجوی آرایشگر، سالن یا خدمت</DialogDescription>
          </DialogHeader>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute inset-s-3.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="جستجو آرایشگر، سالن یا خدمت..."
            className="h-11 rounded-xl pe-4 ps-10"
          />
        </div>
        <p className="text-muted-foreground text-xs">
          با تایپ نمادها و نکات جستجو، نتایج پیشنهادی در اینجا نمایش داده می‌شوند.
        </p>
      </DialogContent>
    </Dialog>
  )
}
