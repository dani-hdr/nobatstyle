'use client'

import * as React from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

import { Dialog, DialogContent } from './dialog'
import { Sheet, SheetContent } from './sheet'

/**
 * Project convention: modals open as a bottom drawer (`Sheet side="bottom"`)
 * on mobile and as a centered `Dialog` from `md` up. Always render modals
 * through this component instead of raw `Dialog`.
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  className,
  hideClose = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
  hideClose?: boolean
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop === undefined) return null

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={!hideClose} className={className}>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={!hideClose}
        className={cn('mx-auto max-h-[92dvh] w-full max-w-lg gap-0 rounded-t-2xl p-0', className)}
      >
        {children}
      </SheetContent>
    </Sheet>
  )
}
